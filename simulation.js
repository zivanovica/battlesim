const {resolve} = require('path');

const {Simulator} = require(resolve('Simulator', 'Core', 'Engine', 'Simulator'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {Vehicle, VehicleDefaults} = require(resolve('Simulator', 'Entities', 'Units', 'Vehicle'));

const unitSpawners = {
    Soldier: (name, config) => {
        return new Soldier({name, ...config});
    },
    Vehicle: (name, config, scenarioUnits) => {
        const {operators, health, recharge = 1000} = config;

        if (
            false === operators instanceof Array ||
            VehicleDefaults.MinOperatorsCount > operators.length ||
            VehicleDefaults.MaxOperatorsCount < operators.length
        ) {
            // throw new SimulatorException(InvalidScenarioConfig, `unit's "${name}" number of operators is out of range`);
            // TODO: throw proper exception
            throw new Error('Invalid range');
        }

        const vehicle = new Vehicle({name, health, rechargeDuration: recharge});

        vehicle.setOperators(config.operators.map((operatorName) => {
            return unitSpawners.Soldier(operatorName, scenarioUnits[operatorName]);
        }));

        return vehicle;
    }
};

const simulator = new Simulator({unitSpawners});

simulator.playScenario(require('./scenarios/default.json'));


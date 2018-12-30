const {resolve} = require('path');
const {
    ScenarioParserException, ScenarioParserExceptionCode: {InvalidConfig}
} = require(resolve('Simulator', 'Core', 'Exception', 'CoreExceptions', 'ScenarioParserException'));
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {Squad} = require(resolve('Simulator', 'Entities', 'Squad'));
const {Army} = require(resolve('Simulator', 'Entities', 'Army'));

const propUnitSpawners = Symbol();

/**
 * Creates array of unit instances used to provide to Squad
 *
 * @param {string[]} squadUnitsList
 * @param {{type: string, experience: number, health: number, recharge?: number, operators?: Array}}unitsConfig
 * @constructor
 */
const CreateSquadUnits = function (squadUnitsList, unitsConfig) {
    return squadUnitsList.map((unitName) => {
        if (null === unitsConfig[unitName] || typeof unitsConfig[unitName] !== 'object') {
            throw new ScenarioParserException(InvalidConfig, `invalid unit name ${unitName}`);
        }

        const unit = unitsConfig[unitName];

        if (typeof this[propUnitSpawners][unit.type] !== 'function') {
            throw new ScenarioParserException(InvalidConfig, `unknown unit type ${unit.type}`);
        }

        const squadUnit = this[propUnitSpawners][unit.type](unitName, unit, unitsConfig);

        if (false === squadUnit instanceof Unit) {
            throw new ScenarioParserException(InvalidConfig, `Unit parser ${unit.type} return value is not type Unit`);
        }

        return squadUnit;
    });
};

class ScenarioParser {
    constructor() {
        this[propUnitSpawners] = {};
    }

    /**
     * Adds unit spawner
     *
     * @param {string} identifier
     * @param {function} callback
     */
    addUnitSpawner(identifier, callback) {
        if (typeof callback !== 'function') {
            // TODO: Throw proper error
            throw new Error('Invalid type');
        }

        this[propUnitSpawners][identifier] = callback;
    }

    /**
     * Parse and validate provided scenario.
     *
     * Note: This method will create instances of armies, squads and their units
     *
     * @param {{units: object, armies: object}} scenario
     */
    parse(scenario) {
        const {units: scenarioUnits, armies} = scenario;

        if (null === scenarioUnits || typeof scenarioUnits !== 'object') {
            const type = null === scenarioUnits ? 'null' : typeof scenarioUnits;

            throw new ScenarioParserException(InvalidConfig, `field "units" must be object, got ${type}`);
        }

        if (null === armies || typeof armies !== 'object') {
            const type = null === armies ? 'null' : typeof armies;

            throw new ScenarioParserException(InvalidConfig, `field "armies" must be object, got ${type}`);
        }

        return Object.keys(armies).map((armyName) => {
            return new Army({
                name: armyName,
                squads: Object.keys(armies[armyName] || {}).map((squadName) => {
                    const {attackStrategy, units} = armies[armyName][squadName];
                    const squad = new Squad({name: squadName, attackStrategy: attackStrategy});

                    squad.setUnits(CreateSquadUnits.call(this, units, scenarioUnits));

                    return squad;
                })
            });
        });
    }
}

module.exports = {ScenarioParser};
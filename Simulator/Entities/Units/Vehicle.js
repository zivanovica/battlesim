const {resolve} = require('path');
const {EntityAttribute} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {MathEx} = require(resolve('Simulator', 'Utils', 'MathEx'));

const VehicleDefaults = {
    MinOperatorsCount: 1,
    MaxOperatorsCount: 3,
    MinRechargeSpeed: 1000,
    MaxRechargeSpeed: 2000
};

const VehicleAttribute = {
    OperatorsCount: 'requiredOperatorsCount',
    Operators: 'operators',
};

/**
 * Generate array containing "requiredOperatorsCount" number of Soldier units
 */
const LoadOperators = function () {
    return new Array(this.getAttributeValue(VehicleAttribute.OperatorsCount))
        .fill(Soldier)
        .map((OperatorUnit, index) => {
            return new OperatorUnit({name: `${this.getName()} ${index} Soldier`})
        });
};

/**
 * Vehicle unit is treated same as normal unit, with custom attack probability and damage calculations.
 * Vehicle unit also ensures that it contains
 */
class Vehicle extends Unit {
    constructor({name, rechargeSpeed, operatorsCount}) {
        super({name, rechargeSpeed});

        this.setAttribute({name: VehicleAttribute.OperatorsCount, value: operatorsCount});
        this.setAttribute({name: VehicleAttribute.Operators, value: LoadOperators.call(this)});
    }

    /**
     * Calculate vehicle attack probability based on operators average probability
     *
     * @returns {number}
     */
    calculateAttackProbability() {
        return 0.5 * (1 + this.getHealth() / 100) * this.getOperatorsAverageAttackProbability();
    }

    /**
     * Calculate damage vehicle can give, based on alive operators experience
     *
     * @returns {number}
     */
    calculateDamage() {
        return 0.1 + (this.getOperatorsExperience() / 100)
    }

    /**
     * Sets number of required operators to operate vehicle
     *
     * @param {number} count
     */
    setRequiredOperatorsCount(count) {
        if (VehicleDefaults.MinOperatorsCount > count || VehicleDefaults.MaxOperatorsCount < count) {
            return;
        }

        this.setAttributeValue(VehicleAttribute.OperatorsCount, count);
    }

    /**
     * Retrieve number of required operators to operate vehicle
     *
     * @returns {number}
     */
    getRequiredOperatorsCount() {
        return this.getAttributeValue(VehicleAttribute.OperatorsCount);
    }

    /**
     * Retrieve list of vehicle operators
     *
     * @returns {Soldier[]}
     */
    getOperators() {
        return this.getAttributeValue(VehicleAttribute.Operators) || [];
    }

    /**
     * Retrieve list of all alive operators in vehicle
     *
     * @returns {Soldier[]}
     */
    getAliveOperators() {
        return this.getOperators().filter((operator) => (false === operator.isDead()));
    }

    /**
     * Retrieve geometric average attack probability of all alive vehicle operators
     *
     * @returns {number}
     */
    getOperatorsAverageAttackProbability() {
        return MathEx.average(this.getAliveOperators().map((operator) => (operator.getAttackProbability())));
    }

    /**
     * Retrieve sum of all alive vehicle operators
     *
     * @returns {number}
     */
    getOperatorsExperience() {
        return this.getAliveOperators().reduce((experience, operator) => {
            return experience + operator.getExperience();
        });
    }

    /**
     * Retrieve flag that deremines is vehicle dead or not
     *
     * @returns {boolean}
     */
    isDead() {
        return super.isDead() || 0 === this.getAliveOperators().length || false;
    }
}

module.exports = {Vehicle, VehicleAttribute};
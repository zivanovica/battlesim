const {resolve} = require('path');
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {MathEx: {average, random}} = require(resolve('Simulator', 'Utils', 'MathEx'));

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
    return new Array(this.getOperatorsCount())
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
    constructor({name, rechargeSpeed = null, operatorsCount = null}) {
        super({name, rechargeSpeed});

        rechargeSpeed = null

        this.setOperatorsCount(operatorsCount);
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
    setOperatorsCount(count) {
        if (VehicleDefaults.MinOperatorsCount > count) {
            count = VehicleDefaults.MinOperatorsCount;
        } else if (VehicleDefaults.MaxOperatorsCount < count) {
            count = VehicleDefaults.MaxOperatorsCount;
        }

        this.setAttributeValue(VehicleAttribute.OperatorsCount, count);
    }

    /**
     * Retrieve number of required operators to operate vehicle
     *
     * @returns {number}
     */
    getOperatorsCount() {
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
        return average(this.getOperators().map((operator) => (operator.getAttackProbability())));
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

    /**
     * Retrieve vehicle unit recharge state based on recharge state of operators
     *
     * @returns {boolean}
     */
    isRecharging() {
        return 0 === this.getOperators().reduce((rechargeCount = 0, unit) => {
            return rechargeCount + (unit.isRecharging() && 1 || 0);
        });
    }

    /**
     * Receive damage and apply it to vehicle and its operators
     *
     * @param {number} damage
     */
    receiveDamage(damage) {
        const operators = this.getAliveOperators();

        // In case that there are no operators alive, give all damage to vehicle itself
        if (0 === operators.length) {
            super.receiveDamage(damage);

            return;
        }

        const selfDamage = damage * 0.3;
        super.receiveDamage(selfDamage);

        const operatorDamage = (damage - selfDamage) * 0.5;

        operators.splice(random({min: 0, max: operators.length - 1}), 1).shift().receiveDamage(operatorDamage);

        const otherDamage = (damage - selfDamage - operatorDamage);

        if (operators.length) {
            const otherDamagePerUnit = otherDamage / operators.length;

            operators.forEach((operator) => {
                operator.receiveDamage(otherDamagePerUnit);
            });
        } else {
            super.receiveDamage(otherDamage);
        }
    }
}

module.exports = {Vehicle, VehicleAttribute};
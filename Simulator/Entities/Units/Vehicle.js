const {resolve} = require('path');
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {MathEx: {average, random}} = require(resolve('Simulator', 'Utils', 'MathEx'));

const VehicleDefaults = {
    MinOperatorsCount: 1,
    MaxOperatorsCount: 3,
    MinRechargeDuration: 1000,
    MaxRechargeDuration: 2000
};

const VehicleAttribute = {
    OperatorsCount: 'requiredOperatorsCount',
    Operators: 'operators',
};

/**
 * Generate array containing "operatorsCount" number of Soldier units
 */
const CreateOperators = function () {
    return (
        new Array(this.getOperatorsCount()).fill(Soldier).map((Unit, index) => (new Unit({name: `Operator #${index}`})))
    );
};

/**
 * Vehicle unit is treated same as normal unit, with custom attack probability and damage calculations.
 * Vehicle unit also ensures that it contains
 */
class Vehicle extends Unit {
    constructor({name, rechargeDuration = VehicleDefaults.MaxRechargeDuration, operatorsCount = -1}) {
        super({name});

        this.setRechargeDuration(rechargeDuration);
        this.setOperatorsCount(operatorsCount);
        this.setAttribute({name: VehicleAttribute.Operators, value: CreateOperators.call(this)});

        this.getOperators().forEach((operator) => {
            const onDeathHandler = () => {
                if (0 === this.getAttributeValue(VehicleAttribute.Operators).length) {
                    // Send maximum damage to vehicle, as it will trigger "onDeath" for it
                    super.receiveDamage(this.getHealth());
                }

                operator.removeOnDeathHandler(onDeathHandler);
            };

           operator.addOnDeathHandler(onDeathHandler);
        });
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
        if (VehicleDefaults.MinOperatorsCount > count || VehicleDefaults.MaxOperatorsCount < count) {
            count = Math.round(
                random({min: VehicleDefaults.MinOperatorsCount, max: VehicleDefaults.MaxOperatorsCount})
            );
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
        return this.getAliveOperators().reduce((experience, operator) => (experience + operator.getExperience()));
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
        return (
            super.isRecharging() ||
            this.getAliveOperators().reduce((recharging = false, unit) => (recharging || unit.isRecharging()), 0)
        )
    }

    /**
     * Trigger recharge on all alive operators in vehicle
     */
    recharge() {
        super.recharge();

        this.getAliveOperators().forEach((operator) => (operator.recharge()));
    }

    /**
     * Increases experience to each vehicle operator equally divided
     *
     * @param {number} amount
     */
    increaseExperience(amount) {
        const perOperatorAmount = amount / (this.getAliveOperators().length || 1);

        this.getAliveOperators().forEach((soldier) => {
            soldier.increaseExperience(perOperatorAmount);
        });
    }

    /**
     * Spawns vehicle and all its operators
     */
    spawn() {
        super.spawn();

        this.getAliveOperators().forEach((operator) => {
            operator.spawn();
        });
    }

    /**
     * Despawns vehicle and all its operators
     */
    despawn() {
        super.despawn();

        this.getOperators().forEach((operator) => {
            operator.despawn();
        });
    }

    /**
     * Note: Overriding this method to change default min and max values, while making it still settable
     *
     * @param {number} duration
     * @param {{minDuration?: number, maxDuration?: number}}
     */
    setRechargeDuration(duration, {minDuration = VehicleDefaults.MinRechargeDuration, maxDuration = VehicleDefaults.MaxRechargeDuration} = {}) {
        super.setRechargeDuration(duration, {minDuration, maxDuration});
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

        // 30% of total damage is applied to vehicle
        const selfDamage = damage * 0.3;
        super.receiveDamage(selfDamage);

        // 50% of remaining damage (subtracting vehicle damage) is applied to one random operator
        const operatorDamage = (damage - selfDamage) * 0.5;

        operators.splice(Math.round(random({
            min: 0,
            max: operators.length - 1
        })), 1).shift().receiveDamage(operatorDamage);

        /*
            What is left of damage is applied equally to all other operators.
            If there are no alive operators then this damage is applied to vehicle itself
        */
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
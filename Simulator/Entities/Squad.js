const {resolve} = require('path');
const {MathEx: {random, average}} = require(resolve('Simulator', 'Utils', 'MathEx'));
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {Vehicle} = require(resolve('Simulator', 'Entities', 'Units', 'Vehicle'));
const {
    SquadException, SquadExceptionCode: {
        InvalidAttackStrategy, InvalidAttackTarget, InvalidOnAttackHandler, InvalidOnDamageHandler
    }
} = require(resolve('Simulator', 'Entities', 'Exceptions', 'SquadException'));

const SquadAttackStatus = {
    Recharging: 0,
    LowProbability: 1,
    Success: 2,
};

const SquadDefaults = {
    MinUnitCount: 5,
    MaxUnitCount: 10
};

const SquadAttackStrategy = {
    Random: 'random',
    Weak: 'weak',
    Strong: 'strong'
};

const ValidSquadAttackStrategies = Object.values(SquadAttackStrategy);

const SquadAttribute = {
    AttackStrategy: 'attackStrategy',
    UnitsCount: 'unitsCount',
    Units: 'units',
};

const Units = [
    {name: 'Soldier', constructor: Soldier},
    {name: 'Vehicle', constructor: Vehicle}
];

/**
 *
 * @returns {Unit[]}
 */
const CreateUnits = function () {
    return new Array(this.getUnitsCount()).fill(Units).map((units, unitId) => {
        const UnitData = units[Math.round(random({min: 0, max: units.length - 1}))];

        return new UnitData.constructor({name: `${UnitData.name} #${unitId}`})
    });
};

/**

 * @param {{target: Squad, damage: number, status: number}}
 */
const TriggerOnAttackHandlers = function ({target, damage, status}) {
    this[propOnAttackHandlers].forEach((handler) => (handler({target, damage, status})));
};

/**
 * Trigger all registered onDamage handlers
 *
 * @param {{source: Squad, damage: number}}
 * @constructor
 */
const TriggerOnDamageHandlers = function ({source, damage}) {
    this[propOnDamageHandlers].forEach((handler) => (handler({source, damage})));
};

const propOnAttackHandlers = Symbol();
const propOnDamageHandlers = Symbol();

class Squad extends Entity {
    constructor({name, attackStrategy = SquadAttackStrategy.Random, unitsCount = SquadDefaults.MinUnitCount} = {}) {
        super({name});

        this.setUnitsCount(unitsCount);
        this.setAttackStrategy(attackStrategy);

        this.setAttribute({name: SquadAttribute.Units, value: CreateUnits.call(this)});

        this[propOnAttackHandlers] = [];
        this[propOnDamageHandlers] = [];
    }

    /**
     * Add callback function that will be triggered when attack (successful or failed)
     *
     * @param {function} callback
     */
    addOnAttackHandler(callback) {
        if (typeof callback !== 'function') {
            throw new SquadException(InvalidOnAttackHandler, `Expected function, got ${typeof callback}`);
        }

        this[propOnAttackHandlers].push(callback);
    }

    /**
     * Remove registered onAttack callback function from list
     *
     * @param {function} callback
     */
    removeOnAttackHandler(callback) {
        this[propOnAttackHandlers] = this[propOnAttackHandlers].filter((handler) => (handler !== callback));
    }

    /**
     * Add handler triggered when squad receive
     *
     * @param {function} callback
     */
    addOnDamageHandler(callback) {
        if (typeof callback !== 'function') {
            throw new SquadException(InvalidOnDamageHandler, `Expected function, got ${typeof callback}`);
        }

        this[propOnDamageHandlers].push(callback);
    }

    /**
     * Remove registered onDamage handler
     *
     * @param {function} callback
     */
    removeOnDamageHandler(callback) {
        this[propOnDamageHandlers] = this[propOnDamageHandlers].filter((handler) => (handler !== callback));
    }

    /**
     * @param {number} unitsCount
     */
    setUnitsCount(unitsCount) {
        if (SquadDefaults.MinUnitCount > unitsCount) {
            unitsCount = SquadDefaults.MinUnitCount;
        } else if (SquadDefaults.MaxUnitCount < unitsCount) {
            unitsCount = SquadDefaults.MaxUnitCount;
        }

        this.setAttributeValue(SquadAttribute.UnitsCount, unitsCount);
    }

    /**
     * @returns {number}
     */
    getUnitsCount() {
        return this.getAttributeValue(SquadAttribute.UnitsCount);
    }

    /**
     * Retrieve list of all units
     *
     * @returns {[]}
     */
    getUnits() {
        return this.getAttributeValue(SquadAttribute.Units) || null;
    }

    /**
     * Retrieve list of all units that are alive
     *
     * @returns {*[]}
     */
    getAliveUnits() {
        return this.getUnits().filter((unit) => (false === unit.isDead()));
    }

    /**
     * @param {"random"|"weak"|"strong"} strategy
     */
    setAttackStrategy(strategy = SquadAttackStrategy.Random) {
        if (-1 === ValidSquadAttackStrategies.indexOf(strategy)) {
            throw new SquadException(InvalidAttackStrategy, strategy);
        }

        this.setAttributeValue(SquadAttribute.AttackStrategy, strategy);
    }

    /**
     * Retrieve current attack strategy, in case that strategy is invalid "random" will be used
     *
     * @returns {"random"|"weak"|"strong"}
     */
    getAttackStrategy() {
        return this.getAttributeValue(SquadAttribute.AttackStrategy) || SquadAttackStrategy.Random;
    }

    /**
     * Retrieve squad attack probability based on average of all squad units
     *
     * Note: Dead units are included
     * return {number}
     */
    getAttackProbability() {
        return average(this.getUnits().map((unit) => (unit.getAttackProbability())));
    }

    /**
     * Retrieve death status based on count of alive units in squad
     *
     * @returns {boolean}
     */
    isDead() {
        return 0 === this.getAliveUnits().length;
    }

    /**
     * Apply damage to all alive units
     *
     * @param {{source: Squad, damage: number}}
     * @return {boolean} TRUE if attack was applied, false if squad is dead
     */
    receiveDamage({source, damage}) {
        if (this.isDead()) {
            return false;
        }

        const aliveUnits = this.getAliveUnits() || [];
        const damagePerUnit = damage / aliveUnits.length;

        aliveUnits.forEach((unit) => {
            unit.receiveDamage(damagePerUnit);
        });

        TriggerOnDamageHandlers.call(this, {source, damage});

        return true;
    }

    /**
     * Calls "receiveDamage" on target, providing current squad damage
     *
     * @param {Squad} target
     * @param {number} experienceGain
     * @return {boolean} true if attack was success, otherwise false
     */
    attack(target, experienceGain = 0.1) {
        if (false === target instanceof Squad) {
            throw new SquadException(InvalidAttackTarget, 'target must be instance of Squad');
        }

        if (target.getAttackProbability() > this.getAttackProbability()) {
            TriggerOnAttackHandlers.call(this, {target, damage: 0, status: SquadAttackStatus.LowProbability});

            return false;
        }

        if (this.isRecharging()) {
            TriggerOnAttackHandlers.call(this, {target, damage: 0, status: SquadAttackStatus.Recharging});

            return false;
        }

        const damage = this.getDamage();

        target.receiveDamage({source: this, damage});

        TriggerOnAttackHandlers.call(this, {target, damage, status: SquadAttackStatus.Success});

        return true;
    }

    /**
     * Increases all alive units experience by provided amount
     *
     * @param {number} amount
     */
    increaseUnitsExperience(amount = 0.1) {
        this.getAliveUnits().forEach((unit) => (unit.increaseExperience(amount)));
    }

    /**
     * Trigger recharge on all alive units
     */
    recharge() {
        this.getAliveUnits().forEach((unit) => (unit.recharge()));
    }

    /**
     * Retrieve Squad recharge state based on squad units recharge state.
     *
     * @return {number}
     */
    isRecharging() {
        return this.getAliveUnits().reduce((recharge = false, unit) => (unit.isRecharging()));
    }

    /**
     * Retrieve total squad damage as sum of damage from all alive units
     *
     * @return {number}
     */
    getDamage() {
        return Number(this.getAliveUnits().reduce((damage, unit) => (damage + unit.getDamage()), 0)) || 0;
    }

    /**
     * Spawn Squad and all of its units
     */
    spawn() {
        super.spawn();

        this.getUnits().forEach((unit) => {
            unit.spawn();
        });
    }

    /**
     * Despawn Squad and all of its units
     */
    despawn() {
        super.despawn();

        this.getUnits().forEach((unit) => {
            unit.despawn();
        });
    }


}

module.exports = {Squad, SquadAttackStrategy, SquadDefaults, SquadAttackStatus};
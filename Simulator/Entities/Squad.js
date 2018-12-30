const {resolve} = require('path');
const {MathEx: {random, average}} = require(resolve('Simulator', 'Utils', 'MathEx'));
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity'));
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {Vehicle} = require(resolve('Simulator', 'Entities', 'Units', 'Vehicle'));
const {
    SquadException, SquadExceptionCode: {
        InvalidAttackStrategy, InvalidAttackTarget, InvalidOnAttackHandler, InvalidOnDamageHandler, InvalidHandlersType,
        InvalidOnDeathHandler
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
 * Iterate through provided array, and trigger each handler with provided options
 *
 * @param {Array} handlers
 * @param {object} options
 * @constructor
 */
const TriggerHandlers = (handlers, options = {}) => {
    if (false === handlers instanceof Array) {
        throw new SquadException(InvalidHandlersType, `Expect Array, got ${typeof handlers}`);
    }

    handlers.forEach((handler) => {
        if (typeof handler !== 'function') {
            throw new SquadException(InvalidHandlersType, `Expect function, got ${typeof handler}`);
        }

        handler(options)
    });
};

/**

 * @param {{target: Squad, damage: number, status: number}}
 */
const TriggerOnAttackHandlers = function ({target, damage, status}) {
    TriggerHandlers(this[propOnAttackHandlers], {target, damage, status});
};

/**
 * Trigger all registered onDamage handlers
 *
 * @param {{source: Squad, damage: number}}
 * @constructor
 */
const TriggerOnDamageHandlers = function ({source, damage}) {
    TriggerHandlers(this[propOnDamageHandlers], {source, damage});
};

/**
 * Execute (trigger) all registered "onDeath" handlers
 */
const TriggerOnDeathHandlers = function () {
    TriggerHandlers(this[propOnDeathHandlers]);
};

/**
 *
 * Adds callback to provided handlers list.
 *
 * Note: It will validate "handlers" to check is proper array. it will also validate "callback" to check is it a function
 * Note: It will throw SquadException with provided "exceptionErrorCode"
 *
 * @param {Array} handlers
 * @param {function} callback
 * @param {number} exceptionErrorCode
 * @constructor
 */
const AddHandler = function (handlers, callback, exceptionErrorCode) {
    if (false === handlers instanceof Array) {
        throw new SquadException(InvalidHandlersType, `Expect Array, got ${typeof handlers}`);
    }

    if (typeof callback !== 'function') {
        throw new SquadException(exceptionErrorCode, `Expect function, got ${typeof callback}`);
    }

    handlers.push(callback);
};

/**
 * Removes provided "callback" from provided array of "handlers"
 *
 * @param {Array} handlers
 * @param {function} callback
 */
const RemoveHandler = function (handlers, callback) {
    if (false === handlers instanceof Array) {
        throw new SquadException(InvalidHandlersType, `Expect Array, got ${typeof handlers}`);
    }

    const handlerIndex = handlers.indexOf(callback);

    if (-1 !== handlerIndex) {
        handlers.splice(handlerIndex, 1);
    }
};

/**
 * Iterate through all squad units, and add onDeath handler
 * It will also trigger Squad's onDeath handlers when all units are dead.
 */
const RegisterOnUnitDeathHandlers = function () {
    this.getUnits().forEach((unit) => {
        const onUnitDeathHandler = () => {
            if (0 === this.getAliveUnits().length) {
                TriggerOnDeathHandlers.call(this);
            }

            // unit.removeOnDeathHandler(onUnitDeathHandler);
        };

        unit.addOnDeathHandler(onUnitDeathHandler);
    });
};

const propOnAttackHandlers = Symbol();
const propOnDamageHandlers = Symbol();
const propOnDeathHandlers = Symbol();

class Squad extends Entity {
    constructor({name, attackStrategy = SquadAttackStrategy.Random, unitsCount = null} = {}) {
        super({name});

        this[propOnAttackHandlers] = [];
        this[propOnDamageHandlers] = [];
        this[propOnDeathHandlers] = [];

        if (unitsCount) {
            this.setUnitsCount(unitsCount);
            this.setUnits(CreateUnits.call(this));
        }

        this.setAttackStrategy(attackStrategy);
    }

    /**
     *
     * @param {Unit[]} units
     */
    setUnits(units) {
        if (false === units instanceof Array) {
            // TODO: Throw proper error
            throw new Error('Invalid type');
        }

        if (SquadDefaults.MinUnitCount > units.length || SquadDefaults.MaxUnitCount < units.length) {
            // TODO: Throw proper error
            throw new Error('Out-of-range');
        }

        this.getUnits().forEach((unit) => {
            unit.despawn()
        });

        this.setAttributeValue(SquadAttribute.Units, units.map((unit) => {
            if (false === unit instanceof Unit) {
                // TODO: throw proper exception
                throw new Error('Invalid type');
            }

            return unit;
        }));

        this.setUnitsCount(units.length);

        RegisterOnUnitDeathHandlers.call(this);
    }

    /**
     * Add callback function that will be triggered when attack (successful or failed)
     *
     * @param {function} callback
     */
    addOnAttackHandler(callback) {
        AddHandler.call(this, this[propOnAttackHandlers], callback, InvalidOnAttackHandler);
    }

    /**
     * Remove registered onAttack callback function from list
     *
     * @param {function} callback
     */
    removeOnAttackHandler(callback) {
        RemoveHandler.call(this, this[propOnAttackHandlers], callback);
    }

    /**
     * Add handler triggered when squad receive
     *
     * @param {function} callback
     */
    addOnDamageHandler(callback) {
        AddHandler.call(this, this[propOnDamageHandlers], callback, InvalidOnDamageHandler);
    }

    /**
     * Remove registered onDamage handler
     *
     * @param {function} callback
     */
    removeOnDamageHandler(callback) {
        RemoveHandler.call(this, this[propOnDamageHandlers], callback);
    }

    /**
     * Add handler triggered when Squad dies (all members of squad are dead)
     *
     * @param {function} callback
     */
    addOnDeathHandler(callback) {
        AddHandler.call(this, this[propOnDeathHandlers], callback, InvalidOnDeathHandler);
    }

    /**
     * Remove registered onDeath handler
     * @param callback
     */
    removeOnDeathHandler(callback) {
        RemoveHandler.call(this, this[propOnDeathHandlers], callback);
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
        return this.getAttributeValue(SquadAttribute.Units) || [];
    }

    /**
     * Retrieve list of all units that are alive
     *
     * @returns {Unit[]}
     */
    getAliveUnits() {
        return this.getUnits().filter((unit) => {return false === unit.isDead();});
    }

    /**
     * @param {"random"|"weak"|"strong"} strategy
     */
    setAttackStrategy(strategy = SquadAttackStrategy.Random) {
        if (-1 === ValidSquadAttackStrategies.indexOf(strategy)) {
            throw new SquadException(InvalidAttackStrategy, `invalid attack strategy ${strategy}`);
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

        if (this.isRecharging()) {
            TriggerOnAttackHandlers.call(this, {target, damage: -1, status: SquadAttackStatus.Recharging});

            return false;
        }

        if (target.getAttackProbability() > this.getAttackProbability()) {
            TriggerOnAttackHandlers.call(this, {target, damage: -2, status: SquadAttackStatus.LowProbability});

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
     * @return {boolean}
     */
    isRecharging() {
        return 0 !== this.getAliveUnits().filter((unit) => (unit.isRecharging())).length;
    }

    /**
     * Retrieve total squad damage as sum of damage from all alive units
     *
     * @return {number}
     */
    getDamage() {
        return this.getAliveUnits().map((unit) => {
            return unit.getDamage();
        }).reduce((totalDamage = 0, unitDamage) => {return totalDamage + unitDamage}, 0);
    }

    /**
     * Retrieve total squad health (summary of all alive units health)
     *
     * @return {number}
     */
    getHealth() {
        return this.getAliveUnits().map((unit) => {
            return unit.getHealth();
        }).reduce((totalHealth = 0, unitHealth) => (totalHealth + unitHealth), 0);
    }

    /**
     * Retrieve total squad experience (summary of all alive units experience)
     */
    getExperience() {
        return this.getAliveUnits().map((unit) => {
            return unit.getExperience();
        }).reduce((totalXP = 0, unitXP) => (totalXP + unitXP), 0);
    }

    /**
     * Get current squad score
     *
     * @return {number}
     */
    getScore() {
        return this.getHealth() + this.getExperience() + this.getDamage() + this.getAliveUnits().length;
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
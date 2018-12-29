const {resolve} = require('path');
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity'));
const {UpdateType} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));
const {
    UnitException, UnitExceptionCode: {InvalidAttackCalculus, InvalidDamageCalculus, InvalidOnDeathHandler}
} = require(resolve('Simulator', 'Entities', 'Exceptions', 'UnitException'));
const {MathEx: {random}} = require(resolve('Simulator', 'Utils', 'MathEx'));

const UnitAttribute = {
    Health: 'health',
    isRecharging: 'isRecharging',
};

const UnitDefaults = {
    Health: 0.2,
    MinHealth: 0.0,
    MaxHealth: 100.0,
    RechargeDuration: 2000.0,
    MinRechargeDuration: 100.0,
    MaxRechargeDuration: 2000.0
};

const propAttackProbabilityCalculus = Symbol();
const propDamageCalculus = Symbol();
const propMinRechargeDuration = Symbol();
const propMaxRechargeDuration = Symbol();
const propOnDeathHandlers = Symbol();

/**
 *
 * @param {number} calculus
 * @returns {number}
 */
const ExecuteCalculus = function (calculus) {
    return typeof this[calculus] === 'function' && this[calculus]() || 0;
};

/**
 * Execute all registered "onDeath" handlers
 */
const TriggerOnDeathHandlers = function () {
    this[propOnDeathHandlers].forEach((handler) => (handler()));
};

class Unit extends Entity {
    constructor(
        {name, health = UnitDefaults.Health, rechargeDuration, minRechargeSpeed: minRechargeDuration = UnitDefaults.MinRechargeDuration, maxRechargeSpeed: maxRechargeDuration = UnitDefaults.MaxRechargeDuration} = {}
    ) {
        super({name});

        this[propMinRechargeDuration] = minRechargeDuration;
        this[propMaxRechargeDuration] = maxRechargeDuration;

        this.setAttribute({
            name: UnitAttribute.isRecharging, value: false, updateValue: false, updateType: UpdateType.Set,
            updateSpeed: rechargeDuration || random({min: minRechargeDuration, max: maxRechargeDuration}),
        });

        const isRechargingAttribute = this.getAttribute(UnitAttribute.isRecharging);

        isRechargingAttribute.shouldUpdate = () => {
            return isRechargingAttribute.getValue();
        };

        this.setAttribute({name: UnitAttribute.Health, value: health});

        this.setAttackProbabilityCalculus(this.calculateAttackProbability);
        this.setDamageCalculus(this.calculateDamage);

        this[propOnDeathHandlers] = [];
    }

    /**
     * @param {number} health
     */
    setHealth(health) {
        if (UnitDefaults.MinHealth > health) {
            health = UnitDefaults.MinHealth;
        } else if (UnitDefaults.MaxHealth < health) {
            health = UnitDefaults.MaxHealth;
        }

        this.setAttributeValue(UnitAttribute.Health, health);
    }

    /**
     * @returns {number}
     */
    getHealth() {
        return this.getAttributeValue(UnitAttribute.Health);
    }

    /**
     * Sets unit recharge speed
     *
     * @param {number} rechargeDuration
     * @param {{minDuration?: number, maxDuration?: number}}
     */
    setRechargeDuration(rechargeDuration, {minDuration = UnitDefaults.MinRechargeDuration, maxDuration = UnitDefaults.MaxRechargeDuration} = {}) {
        if (minDuration > rechargeDuration) {
            rechargeDuration = UnitDefaults.MinRechargeDuration;
        } else if (maxDuration < rechargeDuration) {
            rechargeDuration = UnitDefaults.MaxRechargeDuration;
        }

        const isRechargingAttribute = this.getAttribute(UnitAttribute.isRecharging);

        isRechargingAttribute && isRechargingAttribute.setUpdateSpeed(rechargeDuration);
    }

    /**
     * Retrieve unit recharge speed.
     *
     * Note: If speed is not defined (0, false, null...) MaxRechargeDuration will be returned
     *
     * @returns {number}
     */
    getRechargeDuration() {
        const isRechargingAttribute = this.getAttribute(UnitAttribute.isRecharging);

        return isRechargingAttribute && isRechargingAttribute.getUpdateSpeed() || this[propMaxRechargeDuration];
    }

    /**
     * @returns {boolean}
     */
    isDead() {
        return UnitDefaults.MinHealth >= this.getHealth();
    }

    /**
     * Set callback function that will be triggered when
     *
     * @param {function} callback
     */
    addOnDeathHandler(callback) {
        if (typeof callback !== 'function') {
            throw new UnitException(InvalidOnDeathHandler, `Expected function, got ${typeof callback}`);
        }

        this[propOnDeathHandlers].push(callback);
    }

    /**
     * @param {function} callback
     */
    removeOnDeathHandler(callback) {
        this[propOnDeathHandlers] = this[propOnDeathHandlers].filter((handler) => (handler !== callback));
    }

    /**
     * Set recharging flag to "true"
     */
    recharge() {
        this.setAttributeValue(UnitAttribute.isRecharging, true);
    }

    /**
     * @returns {boolean}
     */
    isRecharging() {
        return this.isDead() ? false : this.getAttributeValue(UnitAttribute.isRecharging);
    }

    /**
     * Register method used to retrieve calculated attack probability of unit
     *
     * @param {function} callback
     */
    setAttackProbabilityCalculus(callback) {
        if (typeof callback !== 'function') {
            throw new UnitException(InvalidAttackCalculus, 'Not a function');
        }

        this[propAttackProbabilityCalculus] = callback;
    }

    /**
     * Retrieve calculated unit attack probability
     *
     * @returns {number}
     */
    getAttackProbability() {
        return this.isDead() ? 0 : ExecuteCalculus.call(this, propAttackProbabilityCalculus);
    }

    /**
     * Register method used to retrieve calculated damage of unit
     *
     * @param {function} callback
     */
    setDamageCalculus(callback) {
        if (typeof callback !== 'function') {
            throw new UnitException(InvalidDamageCalculus, 'Not a function');
        }

        this[propDamageCalculus] = callback;
    }

    /**
     * Retrieve calculated unit damage
     *
     * @returns {number}
     */
    getDamage() {
        return this.isDead() ? 0 : ExecuteCalculus.call(this, propDamageCalculus);
    }

    /**
     * Subtract damage from unit health
     *
     * @param {number} damage
     */
    receiveDamage(damage) {
        if (this.isDead()) {
            return;
        }

        this.setHealth(this.getHealth() - damage);

        if (this.isDead()) {
            TriggerOnDeathHandlers.call(this);
        }
    }

    /**
     * Determine is unit available for attacking, based on spawn, recharge and death state
     *
     * @returns {boolean}
     */
    canAttack() {
        return this.isSpawned() && false === this.isRecharging() && false === this.isDead();
    }

    /**
     * Method used to retrieve attack probability of unit.
     *
     * Note: This is just placeholder, and It MUST be overriden in child object. Otherwise exception is thrown
     *
     * @return {number}
     * @throws UnitException
     */
    calculateAttackProbability() {
        throw new UnitException(InvalidAttackCalculus, 'Method not implemented.');
    }

    /**
     * Method used to retrieve attack damage of unit.
     *
     * Note: This is just placeholder, and It MUST be overriden in child object. Otherwise exception is thrown
     *
     * @return {number}
     * @throws UnitException
     */
    calculateDamage() {
        throw new UnitException(InvalidDamageCalculus, 'Method not implemented.');
    }
}

module.exports = {Unit, UnitDefaults, UnitAttributes: UnitAttribute};
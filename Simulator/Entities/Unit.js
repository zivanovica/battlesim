const {resolve} = require('path');
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity.js'));
const {EntityAttribute, UpdateType} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute.js'));

const UnitAttributes = {
    Health: 'health',
    isRecharging: 'isRecharging',
};

const UnitDefaults = {
    Health: 100.0,
    MinHealth: 0.0,
    MaxHealth: 100.0,
    RechargeSpeed: 2000.0
};

class Unit extends Entity {
    constructor({name, health = UnitDefaults.Health, rechargeSpeed = UnitDefaults.RechargeSpeed} = {}) {
        super({name});

        const isRechargingAttribute = new EntityAttribute({
            name: UnitAttributes.isRecharging,
            value: false,
            updateValue: false,
            updateSpeed: rechargeSpeed,
            updateType: UpdateType.Set
        });

        isRechargingAttribute.shouldUpdate = () => {
            return isRechargingAttribute.getValue();
        };

        this.setAttribute(isRechargingAttribute);
        this.setAttribute(new EntityAttribute({name: UnitAttributes.Health, value: health}));
    }

    onHealthChange(callback) {

    }

    /**
     * @param {number} health
     */
    setHealth(health) {
        if (UnitDefaults.MinHealth > health || UnitDefaults.MaxHealth < health) {
            return;
        }

        this.setAttributeValue(UnitAttributes.Health, health);
    }

    /**
     * @returns {number}
     */
    getHealth() {
        return this.getAttributeValue(UnitAttributes.Health);
    }

    /**
     * Sets unit recharge speed
     *
     * @param {number} rechargeSpeed
     */
    setRechargeSpeed(rechargeSpeed) {
        const isRechargingAttribute = this.getAttribute(UnitAttributes.isRecharging);

        isRechargingAttribute && isRechargingAttribute.setUpdateSpeed(rechargeSpeed);
    }

    /**
     * Set recharging flag to "true"
     */
    recharge() {
        this.setAttributeValue(UnitAttributes.isRecharging, true);
    }

    /**
     * @returns {boolean}
     */
    isRecharging() {
        return this.getAttributeValue(UnitAttributes.isRecharging);
    }

    canAttack() {
        return this.isSpawned() && false === this.isRecharging() && UnitDefaults.MinHealth < this.getHealth();
    }
}

module.exports = {Unit, UnitDefaults, UnitAttributes};
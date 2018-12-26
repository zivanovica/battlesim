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
    RechargeSpeed: 100
};

const propIsSpawned = Symbol();

class Unit extends Entity {
    constructor({name, health = UnitDefaults.Health, rechargeSpeed = UnitDefaults.RechargeSpeed} = {}) {
        super({name});

        this[propIsSpawned] = false;

        const isRechargingAttribute = new EntityAttribute({
            name: UnitAttributes.isRecharging,
            value: 1,
            updateValue: 0,
            updateSpeed: rechargeSpeed,
            updateType: UpdateType.Set
        });

        isRechargingAttribute.shouldUpdate = () => {
            return isRechargingAttribute.getValue();
        };

        this.setAttribute(isRechargingAttribute);
        this.setAttribute(new EntityAttribute({name: UnitAttributes.Health, value: health}));
    }

    /**
     * Starts all attribute updates and flags unit as spawned
     */
    spawn() {
        this[propIsSpawned] = true;

        this.getAttributes().forEach((attribute) => {
            attribute.reset();
            attribute.startUpdateHandler();
        });
    }

    /**
     * Stops all attribute updates and flags unit as non-spawned
     */
    despawn() {
        this[propIsSpawned] = false;

        this.getAttributes().forEach((attribute) => {
            attribute.stopUpdateHandler();
        });
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
}

module.exports = {Unit, UnitDefaults};
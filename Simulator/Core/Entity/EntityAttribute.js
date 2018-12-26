// Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
const {resolve} = require('path');
const {
    EntityAttributeException, EntityAttributeExceptionCode: {
        InvalidName, InvalidRechargeSpeed, InvalidAttributeValue, InvalidRechargeType, InvalidRechargeValue
    }
} = require(resolve('Simulator', 'Core', 'Exception', 'EntityAttributeException'));
const UpdateType = {
    None: 0, // No recharge
    Sum: 1, // Sum current value with "rechargeValue"
    Set: 2, // Set current value to "rechargeValue"
    Push: 3 // Append "rechargeValue" to current value (note: current value MUST be an array)
};

// We use provided array to determine if update type that is being set to object is valid
const ValidUpdateTypes = Object.keys(UpdateType).map((key) => (UpdateType[key]));

// Below are properties that are "private" to object scope only
const propName = Symbol();
const propValue = Symbol();
const propInitialValue = Symbol();
const propInitialUpdateValue = Symbol();
const propInitialUpdateSpeed = Symbol();
const propInitialUpdateType = Symbol();
const propUpdateValue = Symbol();
const propUpdateSpeed = Symbol();
const propUpdateType = Symbol();
const propUpdateUnsubscribe = Symbol();
const propHandleUpdate = Symbol();

// Defining this as anonymous function as we want to make it "private" and prevent call from outside object scope
const SetUpdateHandler = function () {
    let previousTime = Date.now();
    let preventUpdate = false;

    this[propHandleUpdate] = () => {
        setImmediate(() => {
            if (preventUpdate) {
                return;
            }

            if (this.shouldUpdate() && this[propUpdateSpeed] < Date.now() - previousTime) {
                // Update etc
                console.log(`${this[propName]} entity attribute update triggered.`);
                previousTime = Date.now();
            }

            this[propHandleUpdate]();
        });

        return () => {
            preventUpdate = true;
        };
    };
};

/**
 * Using EntityAttribute we ensure that "value" will always be of same type.
 * We also control
 */
class EntityAttribute {
    constructor(
        {name, value, updateValue, updateSpeed = null, updateType = UpdateType.None} = {}
    ) {
        if (typeof name !== 'string' || 0 === name.length) {
            throw new EntityAttributeException(InvalidName, name);
        }

        this[propName] = name;

        this[propInitialValue] = value;
        this.setValue(value);

        this[propInitialUpdateType] = updateType;
        this.setUpdateType(updateType);

        this[propInitialUpdateSpeed] = updateSpeed;
        this.setUpdateSpeed(updateSpeed);

        this[propInitialUpdateValue] = updateValue;
        this.setUpdateValue(updateValue);

        SetUpdateHandler.call(this);
    }

    /**
     * Starts update handler, and sets its unsubscribe callback
     */
    startUpdateHandler() {
        this[propUpdateUnsubscribe] = this[propHandleUpdate]();
    }

    /**
     * Prevents update on any next tick
     */
    stopUpdateHandler() {
        if (typeof this[propUpdateUnsubscribe] !== 'function') {
            return;
        }

        this[propUpdateUnsubscribe]();
    }

    /**
     * Sets and validates attribute recharge type
     *
     * Recharge type defines how will script affect attribute value on each trigger
     *
     * @param {Number} updateType
     */
    setUpdateType(updateType) {
        if (-1 === ValidUpdateTypes.indexOf(updateType)) {
            throw new EntityAttributeException(InvalidRechargeType, updateType);
        }

        this[propUpdateType] = updateType;
    }

    /**
     * @returns {number}
     */
    getUpdateType() {
        return this[propUpdateType];
    }

    /**
     * Sets and validates recharge speed type.
     *
     * Update speed defines interval between update triggering
     *
     * NOTE: If updateType is None then setting and validating will be ignored.
     *
     * @param {number} updateSpeed Positive number
     */
    setUpdateSpeed(updateSpeed) {
        if (false === this.isUpdatable()) {
            return;
        }

        if (isNaN(Math.abs(updateSpeed))) {
            throw new EntityAttributeException(InvalidRechargeSpeed, updateSpeed);
        }

        this[propUpdateSpeed] = updateSpeed;
    }

    /**
     * @returns {number}
     */
    getUpdateSpeed() {
        return this[propUpdateSpeed];
    }

    /**
     * Sets and validates recharge value.
     *
     * Recharge value is used to perform action with.
     *
     * NOTE: If updateType is None then setting and validating will be ignored.
     *
     * @param {*} rechargeValue
     */
    setUpdateValue(rechargeValue) {
        if (false === this.isUpdatable()) {
            return;
        }

        if (typeof this[propValue] !== typeof rechargeValue) {
            throw new EntityAttributeException(
                InvalidRechargeValue, `expect ${typeof this[propValue]} got ${typeof rechargeValue}`
            );
        }

        this[propUpdateValue] = rechargeValue;
    }

    /**
     * @return {*}
     */
    getUpdateValue() {
        return this[propUpdateValue];
    }

    /**
     * Validates and sets new value.
     *
     * Validates if new value is same type as previous (original)
     *
     * @param {*} value
     */
    setValue(value) {
        if (null === value || typeof value === 'undefined') {
            throw new EntityAttributeException(
                InvalidAttributeValue, `Accept any value except null and undefined. Got ${value}`
            );
        }

        if (null !== this[propValue] && typeof this[propValue] !== 'undefined' && typeof this[propValue] !== typeof value) {
            throw new EntityAttributeException(
                InvalidAttributeValue, `Type mismatch, expected ${typeof this[propValue]} go ${typeof value}`
            );
        }

        this[propValue] = value;
    }

    /**
     * @returns {*}
     */
    getValue() {
        return this[propValue];
    }

    /**
     * @returns {string}
     */
    getName() {
        return this[propName];
    }

    /**
     * @returns {boolean}
     */
    isUpdatable() {
        return UpdateType.None !== this.getUpdateType();
    }

    /**
     * This method is meant to be override, it determines should updatable value be updated.
     *
     * @returns {boolean}
     */
    shouldUpdate() {
        return true;
    }

    /**
     * Resets attribute values to initial state.
     */
    reset() {
        this.setValue(this[propInitialValue]);

        this.setUpdateType(this[propInitialUpdateType]);
        this.setUpdateSpeed(this[propInitialUpdateSpeed]);
        this.setUpdateValue(this[propInitialUpdateValue]);
    }
}

/**
 * Although there are no additional exported values, we export class as object property to stay consistent
 */
module.exports = {EntityAttribute, UpdateType};
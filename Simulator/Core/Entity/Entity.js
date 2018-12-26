// Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
const {resolve} = require('path');
const {
    EntityException, EntityExceptionCode: {InvalidName, InvalidAttributeType}
} = require(resolve('Simulator', 'Core', 'Exception', 'EntityException'));
const {EntityAttribute} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));

const propName = Symbol();
const propAttributes = Symbol();
const propIsSpawned = Symbol();

class Entity {
    constructor({name} = {}) {
        if (typeof name !== 'string' || 0 === name.length) {
            throw new EntityException(InvalidName, `Got ${name}`);
        }

        this[propName] = name;
        this[propIsSpawned] = false;
        this[propAttributes] = {};
    }

    /**
     * Starts all attribute updates and flags unit as spawned
     */
    spawn() {
        if (this.isSpawned()) {
            return;
        }

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
        if (false === this.isSpawned()) {
            return;
        }

        this[propIsSpawned] = false;

        this.getAttributes().forEach((attribute) => {
            attribute.stopUpdateHandler();
        });
    }

    /**
     * @returns {boolean}
     */
    isSpawned() {
        return this[propIsSpawned];
    }

    /**
     * @returns {string}
     */
    getName() {
        return this[propName];
    }

    /**
     * Retrieve list of all entity attributes
     *
     * @returns {EntityAttribute[]}
     */
    getAttributes() {
        return Object.values(this[propAttributes]);
    }

    /**
     * Creates and adds new attribute, if attribute with same name already exist it will be overwritten.
     *
     * @param {{name: string, value: *, updateValue?: *, updateSpeed?: number, updateType?: number}} options
     */
    setAttribute(options) {
        // if (false === attribute instanceof EntityAttribute) {
        //     throw new EntityException(InvalidAttributeType, attribute);
        // if (this[propAttributes][attribute.getName()]) {
        //     this[propAttributes][attribute.getName()].stopUpdateHandler();
        // }
        //
        // }

        this[propAttributes][options.name] = new EntityAttribute({...options});
    }

    /**
     *
     * @param {number|string} name
     * @returns {EntityAttribute|null}
     */
    getAttribute(name) {
        return this[propAttributes][name] instanceof EntityAttribute && this[propAttributes][name] || null;
    }

    setAttributeValue(name, value) {
        const attribute = this.getAttribute(name);

        attribute && attribute.setValue(value);
    }

    /**
     * @param name
     * @returns {*}
     */
    getAttributeValue(name) {
        const attribute = this.getAttribute(name);

        return attribute && attribute.getValue() || null;
    }
}

module.exports = {Entity, EntityException};
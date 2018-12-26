// Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
const {resolve} = require('path');
const {
    EntityException, EntityExceptionCode: { InvalidName, InvalidAttributeType }
} = require(resolve('Simulator', 'Core', 'Exception', 'EntityException'));
const {EntityAttribute} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));

const propName = Symbol();
const propAttributes = Symbol();

class Entity {
    constructor({name} = {}) {
        if (typeof name !== 'string' || 0 === name.length) {
            throw new EntityException(InvalidName, `Got ${name}`);
        }

        this[propName] = name;
        /**
         *
         * @type {{EntityAttribute}}
         */
        this[propAttributes] = {};
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
     *
     * @param {EntityAttribute} attribute
     */
    setAttribute(attribute) {
        if (false === attribute instanceof EntityAttribute) {
            throw new EntityException(InvalidAttributeType, attribute);
        }

        // if (this[propAttributes][attribute.getName()]) {
        //     this[propAttributes][attribute.getName()].stopUpdateHandler();
        // }

        this[propAttributes][attribute.getName()] = attribute;
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
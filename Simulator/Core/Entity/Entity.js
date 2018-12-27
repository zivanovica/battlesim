// Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
const {resolve} = require('path');
const {
    EntityException, EntityExceptionCode: {InvalidName, InvalidSpawnHandler, InvalidDespawnHandler}
} = require(resolve('Simulator', 'Core', 'Exception', 'CoreExceptions', 'EntityException'));
const {EntityAttribute} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));

const propName = Symbol();
const propAttributes = Symbol();
const propIsSpawned = Symbol();
const propSpawnHandler = Symbol();
const propDespawnHandler = Symbol();

class Entity {
    constructor({name, onSpawn = null, onDespawn = null} = {}) {
        if (typeof name !== 'string' || 0 === name.length) {
            throw new EntityException(InvalidName, `Got ${name}`);
        }

        this[propName] = name;
        this[propIsSpawned] = false;
        this[propAttributes] = {};

        this.registerSpawnHandler(onSpawn);
        this.registerDespawnHandler(onDespawn);
    }

    /**
     * Register callback function that is triggered when entity spawns
     *
     * Note: To remove spawn handler pass "null" as callback argument
     * @param {function|null} callback
     */
    registerSpawnHandler(callback) {
        if (null !== callback && typeof callback !== 'function') {
            throw new EntityException(InvalidSpawnHandler, `Expect function got ${typeof callback}`);
        }

        this[propSpawnHandler] = callback;
    }

    /**
     * Register callback function that is triggered when entity despawns
     *
     * Note: To remove spawn handler pass "null" as callback argument
     * @param {function|null} callback
     */
    registerDespawnHandler(callback) {
        if (null !== callback && typeof callback !== 'function') {
            throw new EntityException(InvalidDespawnHandler, `Expect function got ${typeof callback}`);
        }

        this[propDespawnHandler] = null;
    }

    /**
     * Starts all attribute updates and flags unit as spawned
     * And trigger spawn handler if any
     */
    spawn() {
        if (this.isSpawned()) {
            return;
        }

        this[propIsSpawned] = true;

        this.getAttributes().forEach((attribute) => {
            attribute.startUpdateHandler();
        });

        this[propSpawnHandler] && this[propSpawnHandler]();
    }

    /**
     * Stops all attribute updates and flags unit as non-spawned
     * And triggers despawn handler if any
     */
    despawn() {
        if (false === this.isSpawned()) {
            return;
        }

        this[propIsSpawned] = false;

        this.getAttributes().forEach((attribute) => {
            attribute.stopUpdateHandler();
            attribute.reset();
        });

        this[propDespawnHandler] && this[propSpawnHandler]();
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
        this[propAttributes][options.name || null] = new EntityAttribute({...options});
    }

    /**
     *
     * @param {number|string} name
     * @returns {EntityAttribute|null}
     */
    getAttribute(name) {
        return this[propAttributes][name] instanceof EntityAttribute && this[propAttributes][name] || null;
    }

    /**
     * Sets value of specific attribute
     *
     * Note: In case that attribute doesn't exist, it will be created with provided name and value, with other options
     * set to default.
     *
     * @param {string} name
     * @param {*} value
     */
    setAttributeValue(name, value) {
        let attribute = this.getAttribute(name);

        if (false === attribute instanceof EntityAttribute) {
            this.setAttribute({name, value});

            attribute = this.getAttribute(name);
        }

        attribute && attribute.setValue(value);
    }

    /**
     * Remove provided attribute if it exist
     *
     * @param name
     */
    removeAttribute(name) {
        if (this[propAttributes][name] instanceof EntityAttribute) {
            this[propAttributes][name].stopUpdateHandler();

            delete this[propAttributes][name];
        }
    }

    /**
     * @param name
     * @returns {*}
     */
    getAttributeValue(name) {
        const attribute = this.getAttribute(name);

        return attribute instanceof EntityAttribute ? attribute.getValue() : null;
    }
}

module.exports = {Entity, EntityException};
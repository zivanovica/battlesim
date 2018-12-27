const {resolve} = require('path');
const {MathEx: {random, average}} = require(resolve('Simulator', 'Utils', 'MathEx'));
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity'));
const {Soldier} = require(resolve('Simulator', 'Entities', 'Units', 'Soldier'));
const {Vehicle} = require(resolve('Simulator', 'Entities', 'Units', 'Vehicle'));
const {
    SquadException, SquadExceptionCode: {InvalidAttackStrategy}
} = require(resolve('Simulator', 'Entities', 'Exceptions', 'SquadException'));

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

/**
 *
 * @returns {Unit[]}
 */
const CreateUnits = function () {
    return new Array(this.getUnitsCount()).fill([Soldier, Vehicle]).map((units, unitId) => {
        const Unit = units[Math.round(random({min: 0, max: units.length - 1}))];

        return new Unit({name: `${this.getName()} unit #${unitId}`});
    });
};

class Squad extends Entity {
    constructor({name, attackStrategy = SquadAttackStrategy.Random, unitsCount = SquadDefaults.MinUnitCount} = {}) {
        super({name});


        this.setUnitsCount(unitsCount);
        this.setAttackStrategy(attackStrategy);

        this.setAttribute({name: SquadAttribute.Units, value: CreateUnits.call(this)});
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
        return this.getUnits().filter((unit) => {
            return false === unit.isDead();
        });
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
        return average(this.getUnits().map((unit) => {
            return unit.getAttackProbability();
        }));
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
     * @param {number} damage
     */
    receiveDamage(damage) {
        if (this.isDead()) {
            return;
        }

        const aliveUnits = this.getAliveUnits() || [];
        const damagePerUnit = damage / aliveUnits.length;

        aliveUnits.forEach((unit) => {
            unit.receiveDamage(damagePerUnit);
        });
    }
}

module.exports = {Squad, SquadAttackStrategy, SquadDefaults};
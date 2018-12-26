const {resolve} = require('path');
const {EntityAttribute} = require(resolve('Simulator', 'Core', 'Entity', 'EntityAttribute'));
const {Unit} = require(resolve('Simulator', 'Entities', 'Unit'));
const {MathEx} = require(resolve('Simulator', 'Utils', 'MathEx'));

const SoldierDefaults = {
    MinExperience: 0,
    MaxExperience: 50
};

const SoldierAttribute = {
    Experience: 'experience',
};

class Soldier extends Unit {

    constructor({name, health} = {}) {
        super({name, health});

        this.setAttribute({name: SoldierAttribute.Experience, value: 0});
    }

    /**
     * Calculate soldier attack probability based on health and experience
     *
     * @returns {number}
     */
    calculateAttackProbability() {
        return 0.5 * (1 + this.getHealth() / 100) * MathEx.random({min: 30 + this.getExperience(), max: 100}) / 100;
    }

    /**
     * Calculate soldier damage based on experience
     *
     * @returns {number}
     */
    calculateDamage() {
        return 0.05 + this.getExperience() / 100;
    }

    /**
     * Retrieve current soldier unit experience
     *
     * @returns {number}
     */
    getExperience() {
        return this.getAttributeValue(SoldierAttribute.Experience);
    }

    /**
     * Sets new soldier experience
     *
     * @param {number} experience
     */
    setExperience(experience) {
        if (SoldierDefaults.MinExperience > experience || SoldierDefaults.MaxExperience < experience) {
            return;
        }

        this.setAttributeValue(SoldierAttribute.Experience, experience);
    }
}

module.exports = {Soldier, SoldierAttribute, SoldierDefaults};
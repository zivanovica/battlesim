const {resolve} = require('path');
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

    constructor({name, health, experience = SoldierDefaults.MinExperience} = {}) {
        super({name, health});

        this.setExperience(experience);
    }

    /**
     * Calculate soldier attack probability based on health and experience
     *
     * Note: If unit is dead, then 0 (zero) is returned
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
        return 0.05 + (this.getExperience() / 100);
    }

    /**
     * Retrieve current soldier unit experience
     *
     * @returns {number}
     */
    getExperience() {
        // console.log('ovde', this.getAttributeValue(SoldierAttribute.Experience));
        return this.getAttributeValue(SoldierAttribute.Experience);
    }

    /**
     * Sets new soldier experience
     *
     * @param {number} experience
     */
    setExperience(experience) {
        if (SoldierDefaults.MinExperience > experience) {
            experience = SoldierDefaults.MinExperience;
        } else if (SoldierDefaults.MaxExperience < experience) {
            experience = SoldierDefaults.MaxExperience;
        }

        console.log('setting', experience, this.getName());

        this.setAttributeValue(SoldierAttribute.Experience, experience);
    }
}

module.exports = {Soldier, SoldierAttribute, SoldierDefaults};
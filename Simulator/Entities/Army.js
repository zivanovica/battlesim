const {resolve} = require('path');
const {Entity} = require(resolve('Simulator', 'Core', 'Entity', 'Entity'));
const {Squad, SquadAttackStrategy} = require(resolve('Simulator', 'Entities', 'Squad'));
const {MathEx: {random}} = require(resolve('Simulator', 'Utils', 'MathEx'));

const ArmyDefaults = {
    MinSquads: 2
};

const ArmyAttribute = {
    Squads: 'squads',
    EnemySquads: 'enemies'
};

const propAttackingSquads = Symbol();

class Army extends Entity {
    constructor({name, squads = [], enemies = []}) {
        super({name});

        this[propAttackingSquads] = [];
        this.setSquads(squads);
    }

    /**
     * Spawns army and all its squads
     */
    spawn() {
        this.getSquads().forEach((squad) => (squad.spawn()));

        super.spawn();
    }

    /**
     * Despawns army and all its squads
     */
    despawn() {
        this.getSquads().forEach((squad) => (squad.despawn()));

        super.despawn();
    }

    /**
     *
     * @param {Squad[]} squads
     */
    setSquads(squads) {
        if (false === squads instanceof Array) {
            //TODO: Throw proper error
            throw new Error('Invalid type')
        }

        if (ArmyDefaults.MinSquads > squads.length) {
            // TODO: Throw proper error
            throw new Error('Out-of-range');
        }

        this[propAttackingSquads] = [];

        this.setAttributeValue(ArmyAttribute.Squads, squads.map((squad) => {
            if (false === squad instanceof Squad) {
                // TODO: Throw proper error
                throw new Error('Invalid type');
            }

            const deathHandler = () => {
                const squadIndex = this[propAttackingSquads].indexOf(squad);

                if (-1 !== squadIndex) {
                    this[propAttackingSquads].splice(squadIndex, 1);
                }
                // squad.removeOnDeathHandler(deathHandler);
            };

            squad.addOnDeathHandler(deathHandler);

            this[propAttackingSquads].push(squad);

            return squad;
        }));
    }

    /**
     * Set current army enemies
     *
     * @param {Army[]} enemies
     */
    setEnemies(enemies) {
        if (false === enemies instanceof Array) {
            //TODO: Throw proper error
            throw new Error('Invalid type')
        }

        let enemiesSquads = [];

        enemies.forEach((enemy) => {
            if (enemy === this) {
                return;
            }

            enemiesSquads = enemiesSquads.concat(enemy.getAliveSquads());
        });

        this.setAttributeValue(ArmyAttribute.EnemySquads, enemiesSquads);
    }

    /**
     * Retrieve all alive enemy squads
     *
     * @return {Squad[]}
     */
    getEnemies() {
        return this.getAttributeValue(ArmyAttribute.EnemySquads).filter((squad) => {
            return false === squad.isDead();
        });
    }

    /**
     * Decide which Squad should attack, and attack enemy squad based on attacking squad attack strategy
     */
    attack() {
        const attackingSquad = this[propAttackingSquads].shift();

        if (typeof attackingSquad === 'undefined') {
            return;
        }

        let enemy = null;

        switch (attackingSquad.getAttackStrategy()) {
            case SquadAttackStrategy.Random:
                enemy = this.getRandomEnemy();

                break;
            case SquadAttackStrategy.Weak:
                enemy = this.getWeakestEnemy();

                break;
            case SquadAttackStrategy.Strong:
                enemy = this.getStrongestEnemy();

                break;
        }

        if (enemy) {
            attackingSquad.attack(enemy);
        }

        this[propAttackingSquads].push(attackingSquad);
    }

    /**
     * Retrieve random enemy squad
     *
     * @return {Squad}
     */
    getRandomEnemy() {
        const enemies = this.getEnemies();

        return enemies[Math.round(random({min: 0, max: enemies.length - 1}))];
    }

    /**
     * Retrieve weakest enemy squad
     *
     * @return {Squad|null}
     */
    getWeakestEnemy() {
        const scoreSquad = (this.getEnemies().map((squad) => {
            return {squad, score: squad.getScore()};
        }).sort((previousSquad, currentSquad) => {
            return (previousSquad.score < currentSquad.score ? -1 : (previousSquad.score > currentSquad.score ? 1 : 0))
        }).shift());

        return scoreSquad && scoreSquad.squad || null;
    }

    /**
     * Retrieve strongest enemy squad
     *
     * @return {Squad|null}
     */
    getStrongestEnemy() {
        const scoreSquad = (this.getEnemies().map((squad) => {
            return {squad, score: squad.getScore()};
        }).sort((previousSquad, currentSquad) => {
            return (previousSquad.score < currentSquad.score ? -1 : (previousSquad.score > currentSquad.score ? 1 : 0))
        }).pop());

        return scoreSquad && scoreSquad.squad || null;
    }

    /**
     * Retrieve all army squads that are alive
     *
     * @return {Squad[]}
     */
    getAliveSquads() {
        return this.getSquads().filter((squad) => (false === squad.isDead()));
    }

    /**
     *
     * @return {Squad[]}
     */
    getSquads() {
        return this.getAttributeValue(ArmyAttribute.Squads) || [];
    }
}

module.exports = {Army};
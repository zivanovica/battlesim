const {resolve} = require('path');
const {createWriteStream} = require('fs');
const {ScenarioParser} = require(resolve('Simulator', 'Core', 'Engine', 'ScenarioParser'));
const {SquadAttackStatus} = require(resolve('Simulator', 'Entities', 'Squad'));

const propScenarioParser = Symbol();

class Simulator {

    constructor({unitSpawners}) {
        this[propScenarioParser] = new ScenarioParser();

        Object.keys(unitSpawners || {}).forEach((identifier) => {
            this[propScenarioParser].addUnitSpawner(identifier, unitSpawners[identifier]);
        });
    }

    /**
     * Simulate provided scenario configuration
     *
     * @param {{units: object, armies: object}} scenario
     * @param {string} output
     */
    playScenario(scenario, output = './battle_log.txt') {
        const armies = this[propScenarioParser].parse(scenario);
        const writeStream = createWriteStream(output);

        const isSquadRecharging = {};

        const log = (message) => {
            console.log(message);

            writeStream.write(`${message}\n`);
        };

        const onAttackHandler = function ({target, damage, status}) {
            if (SquadAttackStatus.Recharging !== status) {
                isSquadRecharging[this.getName()] = false;

                this.recharge();
            }

            switch (status) {
                case SquadAttackStatus.LowProbability:
                    log(`${this.getName()} missed attack on ${target.getName()}`);

                    break;
                case SquadAttackStatus.Success:
                    this.increaseUnitsExperience(0.1);

                    log(`${this.getName()} landed successful attack on ${target.getName()}, making ${damage} damage`);

                    break;
                case SquadAttackStatus.Recharging:
                    if (false === isSquadRecharging[this.getName()] || typeof isSquadRecharging[this.getName()] === 'undefined') {
                        isSquadRecharging[this.getName()] = true;

                        log(`${this.getName()} is recharging.`);
                    }


                    break;
            }
        };

        const onDeathHandler = function () {
            this.despawn();

            log(`${this.getName()} lost all of its units`);
        };

        armies.forEach((army) => {
            army.getSquads().forEach((squad) => {
                squad.addOnAttackHandler(onAttackHandler.bind(squad));
                squad.addOnDeathHandler(onDeathHandler.bind(squad))
            });

            army.setEnemies(armies);

            army.spawn();
        });

        const performAttack = () => {
            setImmediate(() => {
                armies.forEach((army) => {
                    army.attack();
                });

                const armiesAlive = armies.filter((army) => {
                    return 0 !== army.getAliveSquads().length
                });

                if (1 < armiesAlive.length) {
                    performAttack();
                } else {

                    armies.forEach((army) => (army.despawn()));

                    log(`${armiesAlive.shift().getName()} won!`);

                    writeStream.end();
                }
            });
        };

        performAttack();
    }
}

module.exports = {Simulator};
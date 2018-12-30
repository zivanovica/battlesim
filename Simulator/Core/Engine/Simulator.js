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

        const onAttackHandler = function ({target, damage, status}) {
            if (SquadAttackStatus.Recharging !== status) {
                isSquadRecharging[this.getName()] = false;

                // this.recharge();
            }

            switch (status) {
                case SquadAttackStatus.LowProbability:
                    writeStream.write(`${this.getName()} missed attack on ${target.getName()}\n`);

                    break;
                case SquadAttackStatus.Success:
                    this.increaseUnitsExperience(0.1);

                    writeStream.write(`${this.getName()} landed successful attack on ${target.getName()}, making ${damage} damage\n`);

                    break;
                case SquadAttackStatus.Recharging:
                    if (false === isSquadRecharging[this.getName()] || typeof isSquadRecharging[this.getName()] === 'undefined') {
                        isSquadRecharging[this.getName()] = true;

                        writeStream.write(`${this.getName()} is recharging.\n`);
                    }


                    break;
            }
        };

        const onDeathHandler = function () {
            this.despawn();

            writeStream.write(`${this.getName()} lost all of its units.\n`);
        };

        armies.forEach((army) => {
            army.getSquads().forEach((squad) => {
                squad.addOnAttackHandler(onAttackHandler.bind(squad));
                squad.addOnDeathHandler(onDeathHandler.bind(squad))
            });

            army.spawn();

            army.setEnemies(armies);
        });

        const performAttack = () => {
            setImmediate(() => {
                armies.forEach((army) => {
                    army.attack();
                });

                const armiesAlive = armies.filter((army) => {return 0 !== army.getAliveSquads().length});

                if (1 < armiesAlive.length) {
                    performAttack();
                } else {

                    armies.forEach((army) => {
                        army.despawn();
                    });

                    const aliveArmy = armiesAlive.shift();

                    console.log(`${aliveArmy.getName()} won!`);
                }

            });
        };

        performAttack();
    }
}

module.exports = {Simulator};
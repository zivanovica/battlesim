// const {resolve} = require('path');

/*
    Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
*/

// const {Soldier} = require('./Simulator/Entities/Units/Soldier');
// const {Vehicle} = require('./Simulator/Entities/Units/Vehicle');
const {Squad, SquadAttackStatus} = require('./Simulator/Entities/Squad');
// const {MathEx: {random}} = require('./Simulator/Utils/MathEx');

const squad1 = new Squad({name: 'Squad #1'});
const squad2 = new Squad({name: 'Squad #2'});

// const soldier = new Soldier({name: 'Coa', health: 100.0});
// const vehicle = new Vehicle({name: 'Car', operatorsCount: 10});

// vehicle.getOperators().forEach((operator) => {
//     operator.setHealth(operator.getHealth() - random({min: 5, max: 75}));
// });


squad1.spawn();
squad2.spawn();

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

let aa = 0;

squad1.addOnAttackHandler(({target, damage, status}) => {

    if (SquadAttackStatus.Recharging !== status) {
        squad1.recharge();
    }

    switch (status) {
        case SquadAttackStatus.LowProbability:
            console.log(`${squad1.getName()} missed attack on ${target.getName()}`);

            break;
        case SquadAttackStatus.Success:
            console.log(`${squad1.getName()} landed successful attack on ${target.getName()} making ${damage} damage`);

            squad1.increaseUnitsExperience(0.1);

            break;
    }
});

squad2.addOnDamageHandler(({source, damage}) => {
    console.log(`${squad2.getName()} damaged by ${source.getName()} with ${damage} damage`);

    squad2.getUnits().forEach((unit) => {
        console.log(`\t${unit.getName()} HP ${unit.getHealth()}`);

        if (unit.getName().startsWith('Vehicle')) {
            unit.getOperators().forEach((operator) => {
                console.log(`\t${unit.getName()} ${operator.getName()} HP ${operator.getHealth()}`);
            });
        }
    });
});

const a = () => {
    setImmediate(async () => {
        await sleep(100);

        if (squad2.isDead()) {
            console.log(`${squad1.getName()} destroyed ${squad2.getName()} with ${aa} attacks.`);

            squad1.despawn();
            squad2.despawn();

            return;
        }

        squad1.attack(squad2);

        // if (damage) {
        //     console.log(`\n\t${squad1.getName()} DMG ${damage}\n`);

        aa++;
        // }

        a();
    });
};

a();
//

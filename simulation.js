// const {resolve} = require('path');

/*
    Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
*/

const {Soldier} = require('./Simulator/Entities/Units/Soldier');
const {Vehicle} = require('./Simulator/Entities/Units/Vehicle');
const {MathEx: {random}} = require('./Simulator/Utils/MathEx');

const soldier = new Soldier({name: 'Coa', health: 100.0});
const vehicle = new Vehicle({name: 'Car', operatorsCount: 10});

soldier.spawn();
vehicle.spawn();


let aa = 0;
const a= () => {
    var b= setInterval(() => {
        if (vehicle.isDead()) {
            console.log('Vehicle is dead', aa, soldier.getDamage());
            clearInterval(b);

            return;
        }
        // console.log(Math.round(random(({min: 0, max: 1}))));
        // console.log(vehicle.getOperatorsAverageAttackProbability(), vehicle.getAttackProbability(), vehicle.getOperatorsAverageAttackProbability());
        const damage = soldier.getDamage();

        vehicle.receiveDamage(damage);

        console.log(vehicle.getOperators().map((operator) => {
            return operator.getHealth();
        }).join(' | '));

        //
        soldier.setExperience(soldier.getExperience() + random({min: 0, max: 1}));
        aa++;


        // a();
    }, 1);
};

a();
//

// const {resolve} = require('path');

/*
    Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
*/

const {Soldier} = require('./Simulator/Entities/Units/Soldier');
const {Vehicle} = require('./Simulator/Entities/Units/Vehicle');

const soldier = new Soldier({name: 'Coa', health: 100.0});
const vehicle = new Vehicle({name: 'Car', operatorsCount: 2});

soldier.spawn();
vehicle.spawn();

setInterval(() => {
    console.log(vehicle.isDead(), vehicle.getAttackProbability());
}, 1000);
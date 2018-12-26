// const {resolve} = require('path');

/*
    Using "resolve" to determine absolute path of module, and ensure secure cross system loading (Windows, Linux, OSX...)
*/

const {EntityAttribute, UpdateType} = require('./Simulator/Core/Entity/EntityAttribute');
const {Entity} = require('./Simulator/Core/Entity/Entity');
const {Unit} = require('./Simulator/Entities/Unit');


const attr = new EntityAttribute({
    name: 'health', value: 50.0, updateSpeed: 1000, updateType: UpdateType.Sum, updateValue: 1.9
});
const attr2 = new EntityAttribute({
    name: 'armor', value: 50.0, updateSpeed: 1000, updateType: UpdateType.Sum, updateValue: 1.9
});

attr.startUpdateHandler();
attr2.startUpdateHandler();

setTimeout(() => {attr.stopUpdateHandler();}, 5000);

const Soldier = {};

new Entity({name: 'Unit', refObject: Soldier});

var aa = new Unit({name: 'Test'});

aa.spawn();
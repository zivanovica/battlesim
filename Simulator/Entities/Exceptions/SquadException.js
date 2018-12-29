const BaseException = require('../../Core/Exception/BaseException');

const SquadExceptionCode = {
    InvalidAttackStrategy: 0,
    InvalidAttackTarget: 1,
    InvalidOnAttackHandler: 2,
    InvalidOnDamageHandler: 4,
    InvalidHandlersType: 8,
    InvalidOnDeathHandler: 16,
};

class SquadException extends BaseException {
    getErrorMessages() {
        return {
            [SquadExceptionCode.InvalidAttackStrategy]: 'Error with attack strategy',
            [SquadExceptionCode.InvalidAttackTarget]: 'Error with attack target',
            [SquadExceptionCode.InvalidOnAttackHandler]: 'Error with onAttack handler',
            [SquadExceptionCode.InvalidOnDamageHandler]: 'Error with onDamage handler',
            [SquadExceptionCode.InvalidHandlersType]: 'Error with trigger handlers',
            [SquadExceptionCode.InvalidOnDeathHandler]: 'Error with onDeath handler',
        };
    }
}

module.exports = {SquadException, SquadExceptionCode};
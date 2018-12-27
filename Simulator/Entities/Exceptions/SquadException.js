const BaseException = require('../../Core/Exception/BaseException');

const SquadExceptionCode = {
    InvalidAttackStrategy: 0,
};

class SquadException extends BaseException {
    getErrorMessages() {
        return {
          [SquadExceptionCode.InvalidAttackStrategy]: 'Error with attack strategy',
        };
    }
}

module.exports = {SquadException, SquadExceptionCode};
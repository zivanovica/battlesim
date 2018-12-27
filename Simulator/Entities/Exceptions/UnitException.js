const BaseException = require('../../Core/Exception/BaseException');

const UnitExceptionCode = {
    InvalidAttackCalculus: 0,
    InvalidDamageCalculus: 1,
};

class UnitException extends BaseException {
    getErrorMessages() {
        return {
            [UnitExceptionCode.InvalidAttackCalculus]: 'Provided attack probability calculus function is invalid',
            [UnitExceptionCode.InvalidDamageCalculus]: 'Provided damage calculus function is invalid',
        };
    }
}

module.exports = {UnitException, UnitExceptionCode};
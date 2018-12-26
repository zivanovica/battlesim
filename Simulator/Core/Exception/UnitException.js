const BaseException = require('./BaseException');

const UnitExceptionCode = {
    InvalidAttackCalculus: 30001,
    InvalidDamageCalculus: 30002,
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
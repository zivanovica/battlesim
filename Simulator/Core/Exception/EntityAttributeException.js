const BaseException = require('./BaseException');

const EntityAttributeExceptionCode = {
    InvalidName: 10000,
    InvalidValue: 10001,
    InvalidRechargeSpeed: 10002,
    InvalidRechargeType: 10003,
    InvalidRechargeValue: 10004,
    InvalidAttributeValue: 10005,
};

class EntityAttributeException extends BaseException {
    getErrorMessages() {
        return {
            [EntityAttributeExceptionCode.InvalidName]: 'Error with attribute name',
            [EntityAttributeExceptionCode.InvalidValue]: 'Error with attribute value',
            [EntityAttributeExceptionCode.InvalidRechargeSpeed]: 'Error with attribute recharge speed (must be typeof number)',
            [EntityAttributeExceptionCode.InvalidRechargeType]: 'Error with attribute recharge type',
            [EntityAttributeExceptionCode.InvalidRechargeValue]: 'Error with attribute recharge value',
            [EntityAttributeExceptionCode.InvalidAttributeValue]: 'Error with attribute value',
        };
    }
}

module.exports = {EntityAttributeException, EntityAttributeExceptionCode};
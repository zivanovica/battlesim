const BaseException = require('../BaseException');

const EntityAttributeExceptionCode = {
    InvalidName: 0,
    InvalidValue: 1,
    InvalidRechargeSpeed: 2,
    InvalidRechargeType: 4,
    InvalidRechargeValue: 8,
    InvalidAttributeValue: 16,
    InvalidStartHandler: 32,
    InvalidStopHandler: 64,
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
            [EntityAttributeExceptionCode.InvalidStartHandler]: 'Error with attribute start handler',
            [EntityAttributeExceptionCode.InvalidStopHandler]: 'Error with attribute stop handler',
        };
    }
}

module.exports = {EntityAttributeException, EntityAttributeExceptionCode};
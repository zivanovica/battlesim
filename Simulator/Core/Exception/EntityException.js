const BaseExtension = require('./BaseException');

const EntityExceptionCode = {
    InvalidName: 20001,
    InvalidAttributeType: 20002,
};

class EntityException extends BaseExtension {
    getErrorMessages() {
        return {
            [EntityExceptionCode.InvalidName]: 'Invalid entity name',
            [EntityExceptionCode.InvalidAttributeType]: 'Invalid attribute type'
        }
    }
}

module.exports = {EntityException, EntityExceptionCode};
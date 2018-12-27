const BaseExtension = require('../BaseException');

const EntityExceptionCode = {
    InvalidName: 0,
    InvalidSpawnHandler: 1,
    InvalidDespawnHandler: 2,
};

class EntityException extends BaseExtension {
    getErrorMessages() {
        return {
            [EntityExceptionCode.InvalidName]: 'Invalid entity name',
            [EntityExceptionCode.InvalidSpawnHandler]: 'Invalid entity spawn handler',
            [EntityExceptionCode.InvalidDespawnHandler]: 'Invalid entity despawn handler/',
        }
    }
}

module.exports = {EntityException, EntityExceptionCode};
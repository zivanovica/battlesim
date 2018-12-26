const BaseException = require('./BaseException');

class UnitException extends BaseException {
    getErrorMessages() {
        return;
    }
};

module.exports = {
    UnitException,
};
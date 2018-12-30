const BaseExtension = require('../BaseException');

const ScenarioParserExceptionCode = {
    InvalidConfig: 0,
};

class ScenarioParserException extends BaseExtension {
    getErrorMessages() {
        return {
            [ScenarioParserExceptionCode.InvalidConfig]: 'Provided scenario configuration is invalid',
        }
    }
}

module.exports = {ScenarioParserException, ScenarioParserExceptionCode};
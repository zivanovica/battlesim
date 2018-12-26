class BaseException extends Error {
    /**
     * @param {Number} code Identifier code that matches key value from "messages" property of child class
     * @param {String|null} additionalMessage Additional text appended to error message
     */
    constructor(code, additionalMessage = null) {
        super();

        if (new.target === BaseException) {
            throw new Error('BaseException is an abstract class and must be inherited.');
        }

        const messages = this.getErrorMessages();
        const message = messages && messages[code] || 'Unknown error';

        this.message = `${message}${additionalMessage && ` - ${additionalMessage}` || ''}`;
    }

    /**
     * e.g response
     *  return {
     *      10000: 'Base Error',
     *      10001: 'Other Error',
     *      10002: 'Some Other Error'
     *  };
     *
     * @return Object Object containing errors corresponding to all valid exception codes
     * @throws Error
     */
    getErrorMessages() {
        throw new Error('Method "getErrorMessages" not implemented.');
    }
}

module.exports = BaseException;
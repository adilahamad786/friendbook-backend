class ErrorHandler extends Error {
    constructor(errorType, message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
    }
}

module.exports = ErrorHandler;
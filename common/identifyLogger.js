import {IdentifyLogLevels} from "../constants/identifyLogLevel.js";

export class IdentifyLogger {
    currentLogLevel = IdentifyLogLevels.INFO;

    constructor(logLevel) {
        this.currentLogLevel = logLevel;
    }

    setLevel(level) {
        this.currentLogLevel = level;
    }

    log(level, message, context = {}) {
        if (level <= this.currentLogLevel) {
            const levelName = Object.keys(IdentifyLogLevels).find(key => IdentifyLogLevels[key] === level);
            const timestamp = new Date().toISOString();
            const formatted = `[${timestamp}] [${levelName}] ${message}`;

            switch (level) {
                case IdentifyLogLevels.EMERGENCY:
                case IdentifyLogLevels.ALERT:
                case IdentifyLogLevels.CRITICAL:
                case IdentifyLogLevels.ERROR:
                    console.error(formatted, context);
                    break;
                case IdentifyLogLevels.WARNING:
                    console.warn(formatted, context);
                    break;
                case IdentifyLogLevels.NOTICE:
                case IdentifyLogLevels.INFO:
                    console.info(formatted, context);
                    break;
                case IdentifyLogLevels.DEBUG:
                    console.debug(formatted, context);
                    break;
            }
        }
    }

    emergency(msg, ctx) {
        this.log(IdentifyLogLevels.EMERGENCY, msg, ctx);
    }

    alert(msg, ctx) {
        this.log(IdentifyLogLevels.ALERT, msg, ctx);
    }

    critical(msg, ctx) {
        this.log(IdentifyLogLevels.CRITICAL, msg, ctx);
    }

    error(msg, ctx) {
        this.log(IdentifyLogLevels.ERROR, msg, ctx);
    }

    warning(msg, ctx) {
        this.log(IdentifyLogLevels.WARNING, msg, ctx);
    }

    notice(msg, ctx) {
        this.log(IdentifyLogLevels.NOTICE, msg, ctx);
    }

    info(msg, ctx) {
        this.log(IdentifyLogLevels.INFO, msg, ctx);
    }

    debug(msg, ctx) {
        this.log(IdentifyLogLevels.DEBUG, msg, ctx);
    }

    called(msg, ctx) {
        this.log(IdentifyLogLevels.DEBUG, "Çağırılan method" + msg, ctx);
    }
}
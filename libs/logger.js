"use strict"

const bunyan = require("bunyan")

const config = require(`${__base}libs/config`)

class Logger {
    constructor() {
        let stream = null

        if (true === config.app.debug) {
            stream = {
                level: "error",
                stream: process.stdout
            }
        } else {
            stream = {
                type: "file",
                level: "error",
                path: __base + "logs/error.log"
            }
        }

        return bunyan.createLogger({
            name: config.app.name,
            streams: [stream],
            serializers: bunyan.stdSerializers,
            src: true
        })
    }
}

const loggerInstance = new Logger()

module.exports = loggerInstance
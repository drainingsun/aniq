"use strict"

const restify = require("restify")

const config = require(`${__base}libs/config`)
const Messages = require(`${__base}libs/messages`)
const logger = require(`${__base}libs/logger`)

class Restify {
    constructor() {
        const options = {
            name: config.app.name,
            version: config.app.version,
            log: logger
        }

        this.server = restify.createServer(options)

        this.server.pre(restify.pre.sanitizePath())

        this.server.use(restify.plugins.queryParser())
        this.server.use(restify.plugins.bodyParser({maxBodySize: 1048576}))

        this.server.use((req, res, next) => {
            if (config.app.offline === true) {
                res.send(503, Messages.offlineStatus)
            } else {
                return next()
            }
        })

        this.server.on("restifyError", (req, res, error, callback) => {
            error.toJSON = () => {
                return error.body
            }

            if (error.name === "InternalServerError") {
                req.log.error("InternalServerError", {error: error})
            } else if (error.name === "BadRequestError") {
                if (config.app.debug === true) {
                    req.log.error("BadRequestError", {error: error})
                }
            } else {
                req.log.error("RequestFailError", {error: error})
            }


            return callback()
        })
    }

    start() {
        this.server.listen(config.http.port, (error) => {
            if (error) {
                throw error
            }
        })
    }
}

const restifyInstance = new Restify()

module.exports = restifyInstance
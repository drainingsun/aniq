"use strict"

const restifyErrors = require("restify-errors")
const async = require("async")
const metrohash = require("metrohash")

const config = require(`${__base}libs/config`)
const Helper = require(`${__base}libs/helper`)
const Messages = require(`${__base}libs/messages`)

class Kmv {
    constructor(server, ared) {
        this.ared = ared

        server.put({path: "/add/:key"}, this.add.bind(this))
        server.get({path: "/cardinality/:key"}, this.cardinality.bind(this))
        server.get({path: "/union/:keys"}, this.union.bind(this))
        server.get({path: "/intersection/:keys"}, this.intersection.bind(this))
    }

    add(req, res, next) {
        if (typeof req.body === "undefined" || (!Array.isArray(req.body) && typeof req.body !== "string")
            || (Array.isArray(req.body) && 1 > req.body.length)) {

            return next(new restifyErrors.BadRequestError(Messages.missingMembersErrors))
        } else {
            let values = req.body

            if (!Array.isArray(values)) {
                values = [values]
            }

            const args = [req.params.key]

            for (let i = 0; i < values.length; i++) {
                const hash = metrohash.metrohash64(values[i], config.metrohashSeed)

                args.push(parseInt(hash, 16))
                args.push(hash)
            }

            this.ared.exec("zadd", args, (error, result) => {
                let atLeastOneSucceeded = false

                if (result[req.params.key] > 0) {
                    atLeastOneSucceeded = true
                }

                if (error && !atLeastOneSucceeded) {
                    return next(new restifyErrors.InternalServerError(error))
                } else {
                    const args = [req.params.key, config.maxSetSize, -1]

                    this.ared.exec("zrange", args, (error, result) => {
                        if (error) {
                            return next(new restifyErrors.InternalServerError(error))
                        } else {
                            if (result[req.params.key].length > 0) {
                                const args = [req.params.key]

                                for (let i = 0; i < result[req.params.key].length; i++) {
                                    args.push(result[req.params.key][i])
                                }

                                this.ared.exec("zrem", args, (error, result) => {
                                    let atLeastOneSucceeded = false

                                    if (result[req.params.key] > 0) {
                                        atLeastOneSucceeded = true
                                    }

                                    if (error && !atLeastOneSucceeded) {
                                        return next(new restifyErrors.InternalServerError(error))
                                    } else {
                                        res.send({result: "OK"})

                                        return next()
                                    }
                                })
                            } else {
                                res.send({result: "OK"})

                                return next()
                            }
                        }
                    })
                }
            })
        }
    }

    cardinality(req, res, next) {
        if (!req.params.key) {
            return next(new restifyErrors.BadRequestError(Messages.missingParametersError))
        } else {
            this._getLists([req.params.key], (error, results) => {
                if (error) {
                    return next(new restifyErrors.InternalServerError(JSON.stringify(error)))
                } else {
                    const normalized = Helper.normalize(results[0])

                    res.send({result: Helper.cardinality(normalized)})

                    return next()
                }
            })
        }
    }

    union(req, res, next) {
        const keys = req.params.keys.split(",")

        if (!Array.isArray(keys) || 2 > keys.length) {
            return next(new restifyErrors.BadRequestError(Messages.notEnoughKeysErrors))
        } else {
            this._getLists(keys, (error, results) => {
                if (error) {
                    return next(new restifyErrors.InternalServerError(JSON.stringify(error)))
                } else {
                    let union = Helper.union(results)

                    union = Helper.normalize(union)

                    res.send({result: Helper.cardinality(union)})

                    return next()
                }
            })
        }
    }

    intersection(req, res, next) {
        const keys = req.params.keys.split(",")

        if (!Array.isArray(keys) || 2 > keys.length) {
            return next(new restifyErrors.BadRequestError(Messages.notEnoughKeysErrors))
        } else {
            this._getLists(keys, (error, results) => {
                if (error) {
                    return next(new restifyErrors.InternalServerError(JSON.stringify(error)))
                } else {
                    res.send({result: Helper.intersection(results)})

                    return next()
                }
            })
        }
    }

    _getLists(keys, callback) {
        let results = {}

        const queue = async.queue((key, callback) => {
            const args = [key, 0, -1]

            results[key] = null

            this.ared.exec("zrange", args, (error, result) => {
                if (error) {
                    return callback(error)
                } else {
                    results[key] = result[key]

                    return callback(null)
                }
            })
        }, config.parallelQueue)


        queue.drain = (error) => {
            return callback(error, Object.values(results))
        }

        queue.push(keys)
    }
}

module.exports = Kmv

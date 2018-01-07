"use strict"

global.__base = __dirname + "/../"

const async = require("async")
const redis = require("redis")
const request = require("supertest")
const should = require("should") // eslint-disable-line no-unused-vars

const config = require(`${__base}libs/config`)

const app = require(`${__base}app`)

const unionRoute = () => {
    const describeUnion = () => {
        const clients = {}

        const beforeEachTest = (done) => {
            for (let serverId in config.servers) {
                for (let redisId in config.servers[serverId].redis) {
                    clients[redisId] = redis.createClient(config.servers[serverId].redis[redisId])

                    clients[redisId].send_command("FLUSHALL")
                }
            }

            setTimeout(() => {
                done()
            }, 100)
        }

        beforeEach(beforeEachTest)

        const testUnionNoKey = (done) => {
            request(app)
                .put("/union/")
                .expect(404)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("ResourceNotFound")

                    return done()
                })
        }

        it("Should return error when no key is provided", testUnionNoKey)

        const testUnion = (done) => {
            const keys = ["foo", "bar", "qux"]

            async.eachOf(keys, (key, index, callback) => {
                // Make sure all 3 keys have are not different
                const offset = 10000 * index - 1000 * index
                const limit = offset + 10000

                const params = []

                for (let i = offset; i < limit; i ++) {
                    params.push(i.toString())
                }

                request(app)
                    .put(`/add/${key}`)
                    .send(params)
                    .expect(200)
                    .end((error) => {
                        if (error) {
                            throw error
                        }

                        callback()
                    })

            }, (error) => {
                if (error) {
                    throw error
                }

                request(app)
                    .get(`/union/${keys.join(",")}`)
                    .expect(200)
                    .end((error, response) => {
                        if (error) {
                            throw error
                        }

                        response.body.should.be.deepEqual({result: 27966})

                        return done()
                    })
            })
        }

        it("Should estimate union of 3 sets", testUnion)
    }

    describe("Union", describeUnion)
}

describe("UNION ROUTE", unionRoute)
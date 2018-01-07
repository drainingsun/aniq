"use strict"

global.__base = __dirname + "/../"

const redis = require("redis")
const request = require("supertest")
const should = require("should") // eslint-disable-line no-unused-vars

const config = require(`${__base}libs/config`)

const app = require(`${__base}app`)

const cardinalityRoute = () => {
    const describeCardinality = () => {
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

        const testSubLimitCardinality = (done) => {
            const key = "foo"
            const params = ["bar", "qux"]

            request(app)
                .put(`/add/${key}`)
                .send(params)
                .expect(200)
                .end((error) => {
                    if (error) {
                        throw error
                    }

                    request(app)
                        .get(`/cardinality/${key}`)
                        .expect(200)
                        .end((error, response) => {
                            if (error) {
                                throw error
                            }

                            response.body.should.be.deepEqual({result: 2})

                            return done()
                        })
                })

        }

        it("Should estimate cardinality of less than full sorted set", testSubLimitCardinality)

        const testCardinalityNoKey = (done) => {
            request(app)
                .get("/cardinality/")
                .expect(404)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("ResourceNotFound")

                    return done()
                })
        }

        it("Should return error when no key is provided", testCardinalityNoKey)

        const testOverLimitCardinality = (done) => {
            const key = "foo"

            const params = []

            for (let i = 0; i < config.maxSetSize + 100; i ++) {
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

                    request(app)
                        .get(`/cardinality/${key}`)
                        .expect(200)
                        .end((error, response) => {
                            if (error) {
                                throw error
                            }

                            response.body.should.be.deepEqual({result: 8283})

                            return done()
                        })
                })

        }

        it("Should estimate cardinality of full sorted set", testOverLimitCardinality)
    }

    describe("Cardinality", describeCardinality)
}

describe("CARDINALITY ROUTE", cardinalityRoute)
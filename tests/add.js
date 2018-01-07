"use strict"

global.__base = __dirname + "/../"

const redis = require("redis")
const request = require("supertest")
const should = require("should") // eslint-disable-line no-unused-vars

const config = require(`${__base}libs/config`)

const app = require(`${__base}app`)

const addRoute = () => {
    const describeAdd = () => {
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

        const testAdd = (done) => {
            const key = "foo"
            const params = ["bar", "qux"]

            request(app)
                .put(`/add/${key}`)
                .send(params)
                .expect(200)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.should.be.deepEqual({result: "OK"})

                    clients["r1"].zrange(key, 0, -1, (error, result) => {
                        if (error) {
                            return done(error)
                        } else {
                            result[0].should.be.equal("c0541ad8439142ca")
                            result[1].should.be.equal("fad62b60f5864442")

                            return done()
                        }
                    })
                })

        }

        it("Should add values `bar` and `qux` to `foo` sorted set", testAdd)

        const testAddEmptyArray = (done) => {
            const key = "foo"
            const params = []

            request(app)
                .put(`/add/${key}`)
                .send(params)
                .expect(400)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("api-2")

                    return done()
                })
        }

        it("Should return error when array of members is empty", testAddEmptyArray)

        const testAddObject = (done) => {
            const key = "foo"
            const params = {}

            request(app)
                .put(`/add/${key}`)
                .send(params)
                .expect(400)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("api-2")

                    return done()
                })
        }

        it("Should return error when members are not an array or an object", testAddObject)

        const testAddNoKey = (done) => {
            request(app)
                .put("/add/")
                .expect(404)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("ResourceNotFound")

                    return done()
                })
        }

        it("Should return error when no key is provided", testAddNoKey)

        const testTruncate = (done) => {
            const key = "foo"

            const params = []

            for (let i = 0; i < config.maxSetSize + 1; i ++) {
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

                    clients["r1"].ZCOUNT(key, 0, config.maxNumber, (error, result) => {
                        if (error) {
                            return done(error)
                        } else {
                            result.should.be.equal(config.maxSetSize)

                            return done()
                        }
                    })
                })

        }

        it("Should truncate list if too many members", testTruncate)
    }

    describe("Add", describeAdd)
}

describe("ADD ROUTE", addRoute)
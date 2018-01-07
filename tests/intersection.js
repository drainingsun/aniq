"use strict"

global.__base = __dirname + "/../"

const async = require("async")
const redis = require("redis")
const request = require("supertest")
const should = require("should") // eslint-disable-line no-unused-vars

const config = require(`${__base}libs/config`)

const app = require(`${__base}app`)

const intersectionRoute = () => {
    const describeIntersection = () => {
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

        const testIntersectionNoKey = (done) => {
            request(app)
                .put("/intersection/")
                .expect(404)
                .end((error, response) => {
                    if (error) {
                        throw error
                    }

                    response.body.code.should.be.equal("ResourceNotFound")

                    return done()
                })
        }

        it("Should return error when no key is provided", testIntersectionNoKey)

        const testIntersection = (done) => {
            const keys = ["foo", "bar", "qux"]

            async.eachOf(keys, (key, index, callback) => {
                // Make sure all 3 keys have intersecting members
                const offset = 10000 * index - 3000 * index * 2
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
                    .get(`/intersection/${keys.join(",")}`)
                    .expect(200)
                    .end((error, response) => {
                        if (error) {
                            throw error
                        }

                        response.body.should.be.deepEqual({result: 2063})

                        return done()
                    })
            })
        }

        it("Should estimate intersection of 3 sets", testIntersection)
    }

    describe("Intersection", describeIntersection)
}

describe("INTERSECTION ROUTE", intersectionRoute)
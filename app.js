"use strict"

global.__base = __dirname + "/"

const ARed = require("ared")

const config = require(`${__base}libs/config`)
const restify = require(`${__base}libs/restify`)

const client = new ARed()

client.replication = config.client.replication
client.writePolicy = config.client.writePolicy

const servers = []
const forwarding = {}

let x = Object.keys(config.servers).length

for (let serverId in config.servers) {
    forwarding[serverId] = {
        host: config.servers[serverId].host,
        port: config.servers[serverId].port
    }

    servers[serverId] = new ARed()

    servers[serverId].listen(
        forwarding[serverId],
        config.servers[serverId].redis,
        null,

        () => {
            if (--x === 0) {
                client.listen(null, null, forwarding, () => {
                    restify.start()
                })
            }
        }
    )
}

require(`${__base}routes`)(restify.server, client)

module.exports = restify.server


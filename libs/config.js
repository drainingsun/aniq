"use strict"

class Config {
    constructor() {
        const environments = new Set(["production", "staging", "testing", "development"])

        if (environments.has(process.env.NODE_ENV) === false) {
            throw new Error("No valid environment variable declared.")
        }

        return require(`${__base}config/${process.env.NODE_ENV}`)
    }
}

const configInstance = new Config()

module.exports = configInstance
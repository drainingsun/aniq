"use strict"

const _ = require("lodash")
const BigNumber = require("bignumber.js")

const config = require(`${__base}libs/config`)

class Helper {
    static cardinality(kmv) {
        if (kmv.length < config.maxSetSize) {
            return kmv.length
        } else {
            return new BigNumber(config.maxSetSize - 1).dividedBy(kmv[kmv.length - 1])
                .round(0)
                .toNumber(0)
        }
    }

    static union(sets) {
        const k = Helper._getK(sets)

        return _.union(...sets).sort((a, b) => (a > b) - (a < b))
            .splice(0, k)
    }

    static intersection(sets) {
        let L = Helper.union(sets)

        const K = _.intersection(L, ...sets).length

        L = Helper.normalize(L)

        const k = Helper._getK(sets)

        return Math.round(K / k * Helper.cardinality(L))
    }

    static normalize(set) {
        const kmv = []

        for (let i = 0; i < set.length; i++) {
            let number = new BigNumber(set[i], 16)

            kmv.push(number.dividedBy(config.maxNumber))
        }

        return kmv
    }

    static _getK(sets) {
        const setLengths = []

        for (let i = 0; i < sets.length; i++) {
            setLengths.push(sets[i].length)
        }

        return Math.min(...setLengths)
    }
}

module.exports = Helper
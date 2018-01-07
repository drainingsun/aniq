"use strict"

class Messages {
    static get offlineStatus() {
        return {
            code: "api-1",
            message: "OFFLINE"
        }
    }

    static get missingMembersErrors() {
        return {
            code: "api-2",
            message: "Members parameter should either be a string or an array of strings"
        }
    }

    static get notEnoughKeysErrors() {
        return {
            code: "api-3",
            message: "Keys parameter should be an array of two or more key strings"
        }
    }

}

module.exports = Messages
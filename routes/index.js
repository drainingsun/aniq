"use strict"

const fs = require("fs")
const path = require("path")

module.exports = function (server, ared) {
    fs.readdirSync(path.join(__dirname, ".")).forEach((file) => {
        if (file.substr(-3, 3) === ".js" && file !== "index.js") {
            new (require(`./${file.replace(".js", "")}`))(server, ared)
        }
    })
}
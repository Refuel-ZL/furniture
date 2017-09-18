"use strict"
const path = require("path")
const fs = require("fs")
let isexist = void 0

let LogPath = path.resolve(__dirname, "../../logs/log.log")
isexist = fs.existsSync(path.resolve(__dirname, "../../logs"))
if (!isexist) {
    fs.mkdirSync(path.resolve(__dirname, "../../logs"), "0777")
}
module.exports = {
    "appenders": {
        "cheese": {
            "type": "file",
            "filename": LogPath,
            "maxLogSize": 2 * 1024 * 1024 * 1000,
            "backups": 10
        },
        "con": {
            "type": "console",
            "category": "console"
        },
        // "deta": {
        //     "type": "dateFile",
        //     "filename": "log",
        //     "alwaysIncludePattern": true,
        //     "pattern": "-yyyy-MM-dd-hh.log"
        // }
    },
    "categories": {
        "default": {
            "appenders": ["cheese", "con"],
            "level": "debug"
        }
    }
}
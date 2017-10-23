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
        "out": { "type": "console" },
        "task": {
            "type": "file",
            "filename": LogPath,
            "maxLogSize": 10485760,
            "compress": true,
            "backups": 10,
            "alwaysIncludePattern": true
        }
    },
    "categories": {
        "default": {
            "appenders": ["out", "task"],
            "level": "debug"
        }
    }
}
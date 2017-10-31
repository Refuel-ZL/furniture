"use strict"
const path = require("path")
const fs = require("fs")
let isexist = void 0

let LogPath = path.resolve(__dirname, "../../logs/log.log")
let LogDir = path.resolve(__dirname, "../../logs")
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
        },
        "Debug": {
            "type": "file",
            "filename": LogDir + "/debug.log",
            "maxLogSize": 10485760,
            "compress": true,
            "backups": 10,
            "alwaysIncludePattern": true
        },
        "Info": {
            "type": "file",
            "filename": LogDir + "/info.log",
            "maxLogSize": 10485760,
            "compress": true,
            "backups": 10,
            "alwaysIncludePattern": true
        },
        "Error": {
            "type": "file",
            "filename": LogDir + "/error.log",
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
        },
        "Debug": {
            "appenders": ["out", "Debug"],
            "level": "debug"
        },
        "Info": {
            "appenders": ["out", "Info", "task"],
            "level": "debug"
        },
        "Error": {
            "appenders": ["out", "Error"],
            "level": "error"
        }
    }
}
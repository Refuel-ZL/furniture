'use strict'

var fs = require('fs')
const Promise = require('bluebird')

exports.readFileAsync = function(fpath, encoding) {
    return new Promise(function(resolve, reject) {
        try {
            if (fs.existsSync(fpath)) {
                fs.readFile(fpath, encoding, function(err, content) {
                    if (err) reject(err)
                    else resolve(content)
                })
            } else {
                reject('没有找到文件')
            }
        } catch (error) {
            reject(error)
        }

    })
}

exports.writeFileAsync = function(fpath, content) {
    return new Promise(function(resolve, reject) {
        try {
            fs.writeFile(fpath, content, function(err) {
                if (err) reject(err)
                else resolve()
            })
        } catch (error) {
            reject(error)
        }

    })
}
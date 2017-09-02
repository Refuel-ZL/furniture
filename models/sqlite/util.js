const sqlite3 = require('sqlite3').verbose()

const path = require('path')
const Promise = require('bluebird')

var sqlsrc = path.join(__dirname, '../../data', 'data.db')


exports = module.exports = {
    select: function(sql, param) {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database(sqlsrc)
            db.serialize(function() {
                db.all(sql, param, function(err, res) {
                    db.close()
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                })
            })
        })
    },
    select_: function(sql) {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database(sqlsrc)
            db.serialize(function() {
                db.all(sql, function(err, res) {
                    db.close()
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                })
            })
        })
    },
    update: function(sql, param) {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database(sqlsrc)
            db.serialize(function() {
                db.run(sql, param, function(err, res) {
                    db.close()
                    if (err) {
                        reject(err)

                    } else {
                        resolve(res)
                    }
                })
            })
        })
    },
    inser: function(sql, param) {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database(sqlsrc)
            db.serialize(function() {
                db.run(sql, param, function(err, res) {
                    db.close()
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                })
            })
        })
    },
    delete: function(sql, param) {
        return new Promise(function(resolve, reject) {
            let db = new sqlite3.Database(sqlsrc)
            db.serialize(function() {
                db.run(sql, param, function(err, res) {
                    db.close()
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                })
            })
        })
    }
}
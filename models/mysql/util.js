'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-09-02 21:27:07 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-06 18:59:46
 */
var mysql = require('mysql')
var config = require('./config')
var pool = mysql.createPool(config)

exports = module.exports = {
    query: function(sql, values) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                // Use the connection 
                if (err) {
                    reject(err)
                } else {
                    connection.query(sql, values, function(err, results, fields) {
                        // And done with the connection. 
                        connection.release()
                        if (err) {
                            reject(err)
                        } else {
                            resolve(results, fields)
                        }
                    })
                }

            })
        })
    }
}
pool.on('acquire', function(connection) {
    // console.log('Connection %d acquired', connection.threadId)
})

pool.on('connection', function(connection) {
    // connection.query('SET SESSION auto_increment_increment=1')
    // console.log('Connection')
})
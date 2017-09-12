'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-09-02 21:27:07 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 16:47:13
 */
var mysql = require('mysql')
const async = require('async')
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
    },
    /** 事务处理类
     * sqls=[{
     * sql:'',
     * param:[]
     * }]
     */
    sqlaffair: function(sqls) {
        var funs = []
        return new Promise(function(resolve, reject) {
            if (!sqls) {
                reject('参数为空')
            } else {
                pool.getConnection(function(err, connection) {
                    if (err) {
                        reject(err)
                        return
                    }
                    connection.beginTransaction(function(err) {
                        if (err) {
                            reject(err)
                            return
                        }
                        sqls.forEach(function(item) {
                            funs.push(function(callback) {
                                connection.query(item.sql, item.param, function(err, result) {
                                    if (err) {
                                        callback(err, null)
                                        return
                                    }
                                    callback(null, result)
                                })
                            })
                        }, this)
                        async.series(funs, function(err, result) {
                            if (err) { //回滚  
                                connection.rollback(function() {
                                    console.log('出现错误,回滚!')
                                        //释放资源  
                                    connection.release()
                                    reject(err)
                                })
                                return
                            }
                            //提交
                            connection.commit(function(err) {
                                if (err) {
                                    connection.rollback(function() {
                                        console.log('出现错误,回滚!')
                                        connection.release() //释放资源  
                                        reject(err)
                                    })
                                    return
                                }
                                console.log('成功,提交!')
                                connection.release() //释放资源  
                                resolve()
                            })
                        })
                    })
                })
            }
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
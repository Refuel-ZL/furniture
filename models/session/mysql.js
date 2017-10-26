const { Store } = require("koa-session2")
var mysql = require("mysql")
const Promise = require("bluebird")


const CREATE_STATEMENT = "CREATE  TABLE IF NOT EXISTS `_mysql_session_store` (`id` VARCHAR(255) NOT NULL, `expires` BIGINT NULL, `data` TEXT NULL, PRIMARY KEY (`id`), KEY `_mysql_session_store__expires` (`expires`));",
    GET_STATEMENT = "SELECT * FROM `_mysql_session_store` WHERE id  = ? AND expires > ?",
    SET_STATEMENT = "INSERT INTO _mysql_session_store(id, expires, data) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE expires=?, data =?",
    DELETE_STATEMENT = "DELETE FROM `_mysql_session_store` WHERE id  = ?",
    CLEANUP_STATEMENT = "DELETE FROM `_mysql_session_store` WHERE expires  < ?";


const FIFTEEN_MINUTES = 10 * 1000

class MysqlStore extends Store {

    constructor(options) {
        super()
        let cleanInterval = (!options.clean) ? FIFTEEN_MINUTES : options.clean;
        var pool = ""
        this.getPool = function() {
            if (!pool) {
                pool = mysql.createPool(options)
            }
            return pool
        }
        this.cleanup = function() {
            let now = new Date().getTime()
            let pool = this.getPool()
            pool.query(CLEANUP_STATEMENT, [now])
        }

        this.getPool().query(CREATE_STATEMENT)
        this.cleanup()

        setInterval(this.cleanup.bind(this), cleanInterval)
    }
    async get(sid, ctx) {
        let pool = this.getPool()
        return new Promise(function(resolve) {
            pool.getConnection(function(err, connection) {
                if (err) {
                    console.log(err)
                    resolve()
                    return
                }
                connection.query(GET_STATEMENT, [sid, Date.now()], function(err, results) {
                    connection.release()
                    if (err) {
                        console.log(err)
                        resolve()
                    }
                    let res = ''
                    if (results[0]) {
                        res = JSON.parse(results[0].data)
                    }
                    resolve(res)
                })
            })
        })

    }

    async set(session, sids, ctx) {
        try {
            sids.sid = sids.sid || this.getID(24)
            let pool = this.getPool()
            await new Promise(function(resolve) {
                let data = JSON.stringify(session)
                let expires = new Date(new Date().getTime() + sids.cookie.maxAge).valueOf()
                pool.getConnection(function(err, connection) {
                    if (err) {
                        console.log(err)
                        resolve()
                        return
                    }
                    connection.query(SET_STATEMENT, [sids.sid, expires, data, expires, data], function(err) {
                        connection.release()
                        if (err) {
                            console.log(err)
                        }
                        resolve()
                    })
                })
            })()
        } catch (e) {}
        return sids.sid
    }

    async destroy(sid, ctx) {
        let pool = this.getPool()
        return new Promise(function(resolve) {
            try {
                pool.getConnection(function(err, connection) {
                    if (err) {
                        console.log(err)
                        resolve()
                        return
                    }
                    connection.query(DELETE_STATEMENT, [sid], function(err) {
                        // console.log(ctx.cookies)
                        // ctx.cookies.set("")
                        resolve()
                    })
                })
            } catch (error) {
                console.log(error)
                resolve()
            }

        })
    }
}

module.exports = MysqlStore
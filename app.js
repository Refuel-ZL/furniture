'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 09:19:07
 */
const Koa = require('koa')
const app = new Koa()
const session = require('koa-session-minimal')
const MysqlSession = require('koa-mysql-session')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const staticServer = require('koa-static')
const path = require('path')

const logUtil = require('./models/log4js/log_utils')
const config = require('./config/wxconfig')
const index = require('./routes/index')

const port = process.env.PORT || config.port

// 配置存储session信息的mysql
const mysqlconf = require(path.join(__dirname, './models/mysql', 'config.js'))
let store = new MysqlSession(mysqlconf)

// 存放sessionId的cookie配置
let cookie = {
    maxAge: '', // cookie有效时长
    expires: '', // cookie失效时间
    path: '', // 写cookie所在的路径
    domain: '', // 写cookie所在的域名
    httpOnly: '', // 是否只用于http请求中获取
    overwrite: '', // 是否允许重写
    secure: '',
    sameSite: '',
    signed: '',

}

// 使用session中间件
app.use(session({
    key: 'Furniture',
    store: store,
    cookie: cookie
}))

app.use(async(ctx, next) => {
    //响应开始时间
    const start = new Date()

    //响应间隔时间
    var ms
    try {
        //开始进入到下一个中间件
        await next()
        ms = new Date() - start

        //记录响应日志
        // logUtil.logResponse(ctx, ms)
        logUtil.writeInfo(`${ctx.ip} ${ctx.method} ${ctx.url} - ${ms}ms`)
    } catch (error) {
        ms = new Date() - start

        //记录异常日志
        logUtil.logError(ctx, error, ms)
    }
})


// error handler
onerror(app)

// middlewares
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(staticServer(__dirname + '/public', {
    // maxage: 365 * 24 * 60 * 60,//浏览器缓存时间
    maxage: 60
}))
app.use(views(path.join(__dirname, '/views'), {
    options: { settings: { views: path.join(__dirname, 'views') } },
    map: { 'html': 'ejs' },
    extension: 'html'
}))


app.use(index.routes(), index.allowedMethods())

app.use(async(ctx) => {
    if (ctx.status === 404) {
        await ctx.render('404')
    }

})
app.on('error', function(err, ctx) {
    logUtil.writeErr('server error', err)
})

module.exports = app.listen(port, () => {
    logUtil.writeInfo(`Listening on http://localhost:${port}`)
})
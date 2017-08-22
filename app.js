const Koa = require('koa')

const app = new Koa()


const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const static = require('koa-static')
const path = require('path')

const logUtil = require('./models/log4js/log_utils')

const config = require('./config')
const index = require('./routes/index')

const port = process.env.PORT || config.port

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
app.use(static(__dirname + '/public', {
    // maxage: 365 * 24 * 60 * 60,//浏览器缓存时间

}))
app.use(views(path.join(__dirname, '/views'), {
    options: { settings: { views: path.join(__dirname, 'views') } },
    map: { 'ejs': 'ejs' },
    extension: 'ejs'
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
    console.log(`Listening on http://localhost:${port}`)
})
'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:05:09
 */
const router = require('koa-router')()
var qrcodeutil = require('../models/qrcode/util')

var configUtil = require('../service/config')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
const logUtil = require('../models/log4js/log_utils')
var orderutil = require('../service/order')

router.use(async(ctx, next) => {

    // if (!ctx.session.user) {
    //     await ctx.redirect('/admin/')
    // } else {
    await next()
        // }
})

router.all('/', async(ctx, next) => {
    ctx.state = {
        title: '订单管理'
    }
    await ctx.render('order/info')
})

router.all('/input', async(ctx, next) => {
    ctx.state = {
        title: '订单录入'
    }
    await ctx.render('order/input')
})
router.all('/search', async(ctx, next) => {
    ctx.state = {
        title: '订单搜索'
    }
    await ctx.render('order/search', ctx.state)
})

/**
 * 获取pid 的记录
 */
router.all('/pid_data', async function(ctx, next) {
    var res = {
        total: 0,
        rows: []
    }
    try {
        var limit = ctx.query.limit || ctx.request.body.limit || null
        var offset = ctx.query.offset || ctx.request.body.offset || 0
        var search = ctx.query.search || ctx.request.body.search || ''
        var pid = ctx.query.pid || ctx.request.body.pid || ''
        var sortName = ctx.query.sortName || ctx.request.body.sortName || 'index'
        var sortOrder = ctx.query.sortOrder || ctx.request.body.sortOrder || 'esc'
        var option = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search: search,
            sortName: sortName,
            sortOrder: sortOrder,
            pid: pid
        }
        if (pid == '') { return ctx.body = res }

        res = await orderutil.fetchprolog(option)
        if (res.code == 'ok') {
            res = {
                total: res.total,
                rows: res.data
            }
        } else {
            console.log(res.message)
            res = {
                total: 0,
                rows: []
            }
        }
    } catch (error) {
        console.log(error)
    } finally {
        ctx.body = res
    }

})

router.all('/exit', async(ctx, next) => {
    ctx.session = ''
    ctx.body = ctx.session
})

/**
 * 获取所有订单
 */
router.all('/data', async(ctx, next) => {
    var res = {
        total: 0,
        rows: []
    }
    try {
        var limit = ctx.query.limit || ctx.request.body.limit || null
        var offset = ctx.query.offset || ctx.request.body.offset || 0
        var search = ctx.query.search || ctx.request.body.search || ''
        var sortName = ctx.query.sortName || ctx.request.body.sortName || 'regtime'
        var sortOrder = ctx.query.sortOrder || ctx.request.body.sortOrder || 'desc'
        var option = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search: search,
            sortName: sortName,
            sortOrder: sortOrder
        }
        res = await orderutil.fetchproall(option)
        if (res.code == 'ok') {
            res = {
                total: res.total,
                rows: res.data
            }
        } else {
            console.log(res.message)
            res = {
                total: 0,
                rows: []
            }
        }
    } catch (error) {
        console.log(error)
    } finally {
        ctx.body = res
    }

})

/**
 * 获取所有订单id
 */
router.all('/pidlist', async(ctx, next) => {
    var res = []
    try {
        res = await orderutil.fetchpidlist()
    } catch (error) {
        console.log(error)
    }
    ctx.body = res
})

/**
 * GET二维码
 * 
 */
router.all('/qrcode', async(ctx, next) => {
    var confg = configUtil.getconf()
    var url = ''
    let pid = ctx.query.pid || ctx.request.body.pid
    let width = ctx.query.width || ctx.request.body.width
    let height = ctx.query.height || ctx.request.body.height
    if (!pid) {
        ctx.body = '非法访问'
        return
    }
    url = confg.host || ('http://' + ctx.host);
    url += '/scanqr/qrform?t=' + pid

    ctx.set({
        'Content-Type': 'image/png'
    })
    try {
        ctx.body = await qrcodeutil.createQr(url, {
            text: "编号：" + pid,
            width: width,
            height: height
        })
    } catch (error) {
        ctx.body = error.message
    }

})


/**
 * 请求配置的生产类别
 */
router.get('/beltline', async(ctx, next) => {
    var res = {
        item: [],
        data: {}
    }
    res.data = await orderutil.fetchbeltlineitem()
    res.item = Object.keys(res.data)
    ctx.body = res
})

/**
 * 表单校验
 */
router.get('/check/:conn', async(ctx, next) => {
    var conn = ctx.params.conn
    var res = ''
    switch (conn) {
        case 'pid':
            let id = ctx.query.Pid
            res = await orderutil.verifyPid(id)
            break
        default:
            res = false
    }
    ctx.body = { 'valid': res }
})

/**
 * 
 */
router.post('/submit', async(ctx, next) => {
    var req = ctx.request.body
    req.Pid = req.Pid.trim()
    ctx.body = await orderutil.submit(req)
})

/**
 * 
 * 
 */
router.post('/edit', async(ctx, next) => {
    var res = {
        code: 'ok'
    }
    var req = ctx.request.body
    res = await orderutil.updateorder(req)
    ctx.body = res
})

/**
 * 删除订单路由
 */
router.post('/delet', async(ctx, next) => {
    var list = ctx.request.body.pidlist
    var res = {
            code: 'ok'
        }
        // if (ctx.session.user) {
    if (true) {
        if (list) {
            await orderutil.deletorder(list)

        } else {
            res = {
                code: 'error',
                message: '参数错误'
            }
        }
    } else {
        res = {
            code: 'error',
            message: '对不起，你没有登录或登录信息已过期，请重新登录'
        }
    }

    ctx.body = res
})
exports = module.exports = router
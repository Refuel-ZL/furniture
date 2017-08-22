'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-22 14:42:39
 */
var users = require('./users')
const router = require('koa-router')()

router.use('/user', users.routes(), users.allowedMethods())

router.get('/', async(ctx, next) => {
    // ctx.body = 'Hello World'
    ctx.state = {
        title: 'Koa2'
    }
    await ctx.render('index', ctx.state)
})
router.get('/welcome', async function(ctx, next) {
    ctx.state = {
        title: 'koa2 title'
    };

    await ctx.render('index', ctx.state);
})
module.exports = router
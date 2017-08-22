'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-22 14:42:44
 */
const router = require('koa-router')()

router.get('/', async function(ctx, next) {
    ctx.body = 'this a users response!'
})

module.exports = router
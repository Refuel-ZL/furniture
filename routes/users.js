/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 09:53:09 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-22 11:37:04
 */
const router = require('koa-router')()

router.get('/', async function(ctx, next) {
    ctx.body = 'this a users response!'
})

module.exports = router
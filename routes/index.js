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
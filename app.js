const Koa = require('koa');
const app = new Koa();

app.use(async ctx => ctx.body = ({msg: 'hello world'}));

app.listen(3000, () => console.log('Server Started...'));
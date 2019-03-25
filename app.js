//importing middle ware
const Koa = require('koa');
//json pretty printing
const json = require('koa-json'); 
//routing for url requests
const KoaRouter = require('koa-router');
//node middle ware to access files 
const path = require('path');
//embedded java script for templating
const render = require('koa-ejs');
//serves static assests (css, images)
const serve = require('koa-static');
//parses request objects 
const bodyParser = require('koa-bodyparser');

//intialize objects 
const app = new Koa();
const router = new KoaRouter();

//replace with DB
const tasks = ['Eat veggies', 'Go to gym', 'Sleep on time'];

//use required middle wares
app.use(json());
app.use(bodyParser());
app.use(serve('styles'));

//simple route
//app.use(async ctx => ctx.body = ({msg: 'hello karthik'}));

//Render object with options
render(app, {
    root: path.join(__dirname, 'views'),
    //defalut layout for all pages
    layout: 'layout',
    //the extention that denotes ejs templates (can be .ejs)
    viewExt: 'html',
    cache: false,
    debug: true
});


//Routes
router.get('/', index);
router.post('/', addTask);

//function to render the index page 
async function index(ctx) {
    await ctx.render('index', {
        title: 'Todo Page', 
        tasks: tasks
    });
}

async function addTask(ctx) {
    const body = ctx.request.body;
    tasks.push(body.task);
    ctx.redirect('/');
}
//test route
router.get('/test',ctx => (ctx.body = 'hello test'));

//intialize router to use routes and allow REST methods
app.use(router.routes()).use(router.allowedMethods());

//specify port to start app on
app.listen(3000, () => console.log('Server Started...'));
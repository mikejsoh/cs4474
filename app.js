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
//easier date library 
var {DateTime} = require('luxon');
//local task object
const Task = require('./task');

//intialize objects 
const app = new Koa();
const router = new KoaRouter();

//replace with DB
var tasks = new Map();
var taskLog = new Map();

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
    debug: false
});


//Routes
router.get('/', index);
router.post('/', addTask);
router.put('/', updateTask);

//function to render the index page 
async function index(ctx) {
    //update tasks every time page is refreshed 
    tasks.forEach((value, key) =>{
        if(value.isExpired())
        {
            console.log(key + "expired")
            value.setCompleted(false);
            taskLog.set(key, value);
            tasks.delete(key);
        }
        else
        {
            console.log(key + "not expired")
        }
    })    
    await ctx.render('index', {
        title: 'Todo Page', 
        tasks: tasks
    });
}

//function to add tasks
async function addTask(ctx) {
    const body = ctx.request.body;
    if(tasks.has(body.taskName))
    {
        console.log("task already exsists");       
    }
    else if(DateTime.fromISO(body.dueDate).endOf("day") < DateTime.local())
    {
        console.log("due date has passed");
    }
    else
    {
        tasks.set(body.taskName, new Task(body.taskName, body.description, body.exp, body.reward, body.dueDate, false));
    }
    ctx.redirect('/');
}

//
async function updateTask(ctx){
    const body = ctx.request.body;
    if(tasks.has(body.taskName))
    {
        console.log("task already exsists");       
    }
    else if(DateTime.fromISO(body.dueDate) < DateTime.local())
    {
        console.log("due date has passed");
    }
    else
    {
        tasks.set(body.taskName, new Task(body.taskName, body.description, body.exp, body.reward, body.dueDate, false));
    }
    ctx.redirect('/');
}

//test route
router.get('/test',ctx => (ctx.body = 'hello test'));

//intialize router to use routes and allow REST methods
app.use(router.routes()).use(router.allowedMethods());

//specify port to start app on
app.listen(3000, () => console.log('Server Started...'));
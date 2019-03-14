//import needed libraries 
const koa = require('koa');
const json = require('koa-json');
const koaRouter = require('koa-router');
const koaEjs = require('koa-ejs');
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');

//Reading a file
let rawdata = fs.readFileSync('test.json');
let subject = JSON.parse(rawdata);
console.log(subject);

//Appending to a JSON file 
    //*Keeps appending so commented out*
/*
subject.tasks.push({name:"migos", age:70});
let newSubject = JSON.stringify(subject);
fs.writeFileSync('test.json', newSubject);
*/


//initialize app as instance of koa 
const app = new koa();
//initialize router 
const router = new koaRouter();

//Pretty print JSON middleware
app.use(json());
//BodyParser Middleware
app.use(bodyParser());

//Ejs templating options, injects views into layout.html
koaEjs(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug: false
});

//Route mapping 
router.get('/', index);
router.post('/', addTask);

router.get('/char', showChar);
router.get('/reward', showReward);

//Router functions
	//Show Index.html
async function index(ctx){
    await ctx.render('index', {
        title: 'All my Tasks:',
        addTaskStatus: ' ',
        user: ' '
    });
};

    //Add Task
async function addTask(ctx) {
    const body = ctx.request.body;
    console.log(body.taskName);
    var postTaskName = body.taskName;
    if (postTaskName = "a") {
        await ctx.render('index', {
            title: 'All my Tasks:',
            addTaskStatus: 'Ladies and Gentlemen, we got him',
            user: 'true'
        });
    }
};

	//Show Char.html
async function showChar(ctx){
    await ctx.render('char');
};	
	
	//Show Reward.html
async function showReward(ctx){
    await ctx.render('reward');
};

//for testing purposes
router.get('/test', ctx => (ctx.body = 'Hello World'));

//Router Middle ware, lets app use routes and allows get post method on routes
app.use(router.routes()).use(router.allowedMethods());

//make the app listen to port 3000 and log message 
app.listen(3000, () => console.log('Server Started ...'));
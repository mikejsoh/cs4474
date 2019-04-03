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

//Functions
    //Checking Date validity
function isValidDate(inputDate) {

    var date = new Date();
    date.setFullYear(year, month - 1, day);
    // month - 1 since the month index is 0-based (0 = January)

    if ( (date.getFullYear() == year) && (date.getMonth() == month + 1) && (date.getDate() == day) )
    return true;

    return false;
}

    //Checking if Date is past current date
function pastDueDate(inputDate) {

    var now = new Date();
    
    //Date is in the future
    if (inputDate < now) {
        return false;
    }
    return false;
}

//Route mapping 
router.get('/', index);
router.post('/', addTask);
router.get('/char', showChar);
router.get('/reward', showReward);
router.get('/reset', reset);

// Task Routes
router.get('/task/edit/:id', editTaskDetails);  // Edit Task Form
router.get('/task/:id', showTaskDetails);       // Task Details
router.post('/task/:id', updateTask);           // Task Update Post Method
router.get('/task/delete/:id', deleteTask);     // Task Delete Method
//---------------------------------------------------
//Router functions
	//Show Index.html
async function index(ctx){
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    var charCreated = true;
    if (subject.Character === undefined || subject.Character.length == 0) {
        charCreated = false;
    }
    
    await ctx.render('index', {
        title: "Tasks",
        userCreated: charCreated,
        tasks: subject.IncompleteTasks
    });
};

/*
async function fakeaddTask(ctx) {
    const body = ctx.request.body;
    console.log(body.taskName);
    var postTaskName = body.taskName;
    
    
    
    if (postTaskName = "a") {
        await ctx.render('index', {
            title: 'All my Tasks:',
            addTaskStatus: 'Ladies and Gentlemen, we got him',
            user: 'true',
            tasks: subject.IncompleteTasks
        });
    }
};
*/

//Adding Task Form Functionality
//Task has 6 elements: 
//0. Task Title     1. Task Description     2. Task EXP
//3. Reward Title   4. Reward Description   5. Task Due Date
async function addTask(ctx) {
    const body = ctx.request.body;
    var postTaskTitle = body.taskTitle;
    var postTaskDescription = body.taskDescription;
    var postTaskEXP = body.taskEXP;
    var postTaskRewardTitle = body.taskRewardTitle;
    var postTaskRewardDescription = body.taskRewardDescription;
    var postTaskDueDate = body.taskDueDate;
    
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

    let postTaskID = subject.TaskIDCounter + 1; // grabs last task id from json file
    subject.TaskIDCounter = postTaskID;         // updates the task id counter
   
    let postRewardID = subject.RewardIDCounter + 1;
    subject.RewardIDCounter = postTaskID;         // updates the reward id counter
   
    //Creating JSON object that is being appended into local JSON object
    var taskObj = {};
    taskObj["TaskID"] = postTaskID;
    taskObj["TaskTitle"] = postTaskTitle;
    taskObj["TaskDescription"] = postTaskDescription;
    taskObj["TaskEXP"] = postTaskEXP;
    taskObj["TaskRewardTitle"] = postTaskRewardTitle;
    taskObj["TaskRewardDescription"] = postTaskRewardDescription;
    taskObj["TaskDueDate"] = postTaskDueDate;
    
    var rewardObj = {};
    rewardObj["RewardID"] = postRewardID;
    rewardObj["RewardTitle"] = postTaskRewardTitle;
    rewardObj["RewardDescription"] = postTaskRewardDescription;

    //Appending taskObj + rewardObj to a local JSON object and then writing local object into JSON file
    subject.IncompleteTasks.push(taskObj);
    subject.UnearnedRewards.push(rewardObj);
    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);

    await ctx.render('index', {
        title: "Tasks",
        userCreated: true,
        tasks: subject.IncompleteTasks
    });

    //ctx.redirect('/');

};

async function showTaskDetails(ctx) {
    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);

    await ctx.render('showTaskDetails', {
        title: "Task Detail",
        task: task
    });
}

async function editTaskDetails(ctx) {
    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);

    await ctx.render('taskedit', {
        title: "Edit Task",
        task: task
    });
}

async function updateTask(ctx) {
    const body = ctx.request.body;
    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);
    var incompleteTasks = subject.IncompleteTasks;
    const unearnedRewards = subject.UnearnedRewards;
    
    for (var i = 0; i < incompleteTasks.length; ++i) {
        if (incompleteTasks[i].TaskID == task_id) {
            incompleteTasks[i].TaskTitle = body.taskTitle;
            incompleteTasks[i].TaskDescription = body.taskDescription;
            incompleteTasks[i].TaskEXP = body.taskEXP
            incompleteTasks[i].TaskRewardTitle = body.taskRewardTitle
            incompleteTasks[i].TaskRewardDescription = body.taskRewardDescription
            incompleteTasks[i].TaskDueDate = body.taskDueDate;
        }
    }

    for (let i = 0; i < unearnedRewards.length; ++i) {
        // Task and Reward 1:1 relationship so ID's will be the same
        if (unearnedRewards[i].RewardID == task_id) { 
            unearnedRewards[i].RewardTitle = body.taskRewardTitle;
            unearnedRewards[i].RewardDescription = body.taskRewardDescription;
        }
    }

            let newSubject = JSON.stringify(subject, null, 4);
            fs.writeFileSync('test.json', newSubject);

    ctx.redirect('/task/' + task_id);
}

async function claimReward(ctx) {

}

async function deleteTask(ctx) {
    const incompleteTasks = subject.IncompleteTasks;
    const unearnedRewards = subject.UnearnedRewards;
    const task_id = ctx.params.id;
    const taskIndex = incompleteTasks.findIndex(x => x.TaskID == task_id);
    incompleteTasks.splice(taskIndex, 1);
    unearnedRewards.splice(taskIndex, 1);
    
    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);

    ctx.redirect('/');
}


//Show Char.html
async function showChar(ctx){
    await ctx.render('char', {
        title: "Character"
    });
};	
	
	//Show Reward.html
async function showReward(ctx) {
    await ctx.render('reward', {
        title: "Rewards",
        unearnedRewards: subject.UnearnedRewards,
        earnedRewards: subject.EarnedRewards,
        claimedRewards: subject.ClaimedRewards
    });
};

    //Reset Everything except character
async function reset(ctx) {
    
    //Reset all Tasks and Rewards
    fs.writeFileSync('test.json', JSON.stringify({"IncompleteTasks":[],"CompleteTasks":[],"FailedTasks":[],"UnearnedRewards":[],"EarnedRewards":[],"ClaimedRewards":[],"FailedRewards":[],"Character":[],"TaskNumber":0, "TaskIDCounter": 0, "RewardIDCounter": 0}, null, 4));
    
    //Just re-render index
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    var charCreated = false;
    
    await ctx.render('index', {
        title: "Tasks",
        userCreated: charCreated,
        tasks: subject.IncompleteTasks
    });
};


//for testing purposes
router.get('/test', ctx => (ctx.body = 'Hello World'));

//Router Middle ware, lets app use routes and allows get post method on routes
app.use(router.routes()).use(router.allowedMethods());

//make the app listen to port 3000 and log message 
app.listen(3000, () => console.log('Server Started ...'));
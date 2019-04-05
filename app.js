//import needed libraries 
const koa = require('koa');
const json = require('koa-json');
const koaRouter = require('koa-router');
const koaEjs = require('koa-ejs');
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');

//initialize app as instance of koa 
const app = new koa();
//initialize router 
const router = new koaRouter();

//Pretty print JSON middleware
app.use(json());
//BodyParser Middleware
app.use(bodyParser());

app.use(serve(__dirname + '/public'));

//Ejs templating options, injects views into layout.html
koaEjs(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug: false
});

//Functions
//Task Due Date Expired Check

var minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(function() {
    console.log("I am doing my 1 minutes check");
    var now = new Date();
    
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    
    var listOfTasks = subject.IncompleteTasks;
    var arrayLength = listOfTasks.length;
    
    for (var i = 0; i < subject.IncompleteTasks.length; i++) {
        var inputTask = subject.IncompleteTasks[i]; 
        var inputString = inputTask["TaskDueDate"];
        var inputArr = inputString.split("/"); //Assume date stored as string "2000/01/20"
        var inputDate = new Date(parseInt(inputArr[0], 10), parseInt(inputArr[1], 10) - 1, parseInt(inputArr[2], 10))
        
        var reward_description = inputTask["TaskRewardDescription"] //Obtain Task's Reward Description
        if (inputDate < now) { //InputDate is in the past
            console.log("Date is in the past");
            
            subject.IncompleteTasks.splice(i,1); //remove from incomplete tasks
            subject.FailedTasks.push(inputTask); //push onto failed tasks
            
            const rewardIndex = subject.UnearnedRewards.findIndex(x => x.RewardDescription == reward_description);
            let reward = subject.UnearnedRewards[rewardIndex];

              
            subject.UnearnedRewards.splice(rewardIndex, 1);   //remove from unearned rewards
            subject.FailedRewards.push(reward); //push onto failed rewards
            
            i--; //Since the index that was just removed was the current one, need to check the same index in the next iteration of loop
             
            if (subject.IncompleteTasks.length == 0) {//If Task list is now empty after removal of a task
                break;}
        }
    }
    
    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject); 
}, the_interval);

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
router.post('/task/claim/:id', claimTask);       // Claim Task Method

// Reward Routes
router.post('/reward/claim/:id', claimReward);  // Claim Reward Method
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

    ctx.redirect('/');
}

/**
 * Generic array sorting
 *
 * @param property
 * @returns {Function}
 */
var sortByProperty = function (property) {
    return function (x, y) {
        return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
    };
};

async function claimReward(ctx) {
    const reward_id = ctx.params.id;
    const rewardIndex = subject.EarnedRewards.findIndex(x => x.RewardID == reward_id);
    let reward = subject.EarnedRewards[rewardIndex];

    subject.ClaimedRewards.push(reward);            // append to ClaimedRewards[]
    subject.EarnedRewards.splice(rewardIndex, 1);   // delete from EarnedRewards[]
    subject.ClaimedRewards.sort(sortByProperty('RewardID')); // sort array by RewardID
    

    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);

    ctx.redirect('/reward');
}

async function claimTask(ctx) {
    const task_id = ctx.params.id;
    const taskIndex = subject.IncompleteTasks.findIndex(x => x.TaskID == task_id);
    let task = subject.IncompleteTasks[taskIndex];

    // Task and Reward 1:1 relationship so ID's will be the same
    const rewardIndex = subject.UnearnedRewards.findIndex(reward => reward.RewardID == task_id);
    let reward = subject.UnearnedRewards[rewardIndex];

    // Move Task from IncompleteTask[] to CompleteTask[]
    subject.CompleteTasks.push(task);
    subject.IncompleteTasks.splice(taskIndex, 1);

    // Move Reward from UnearnedRewards[] to EarnedRewards[]
    subject.EarnedRewards.push(reward);
    subject.UnearnedRewards.splice(rewardIndex, 1);

    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);

    ctx.redirect('/');
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
        title: "Character",
        completedTasks: subject.CompleteTasks,
        claimedRewards: subject.ClaimedRewards,
        missedTasks: subject.FailedTasks
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
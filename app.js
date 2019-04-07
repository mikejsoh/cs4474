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
//Returns False (if tasks have not expired) or True (there is a task that expired)
function TaskExpiredCheck() {
    var now = new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate())
    
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    var taskExpired = false;
    
    for (var i = 0; i < subject.IncompleteTasks.length; i++) {
        var inputTask = subject.IncompleteTasks[i]; 
        var inputString = inputTask["TaskDueDate"];
        var inputArr = inputString.split("/"); //Assume date stored as string "2000/01/20"
        var inputDate = new Date(parseInt(inputArr[0], 10), parseInt(inputArr[1], 10) - 1, parseInt(inputArr[2], 10))
        
        var reward_description = inputTask["TaskRewardDescription"] //Obtain Task's Reward Description
        if (inputDate < now) { //InputDate is in the past
            taskExpired = true;
            subject.Character["HP"] = subject.Character["HP"] - inputTask["TaskEXP"]; //Take away HP value based on EXP value
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
    return taskExpired;
}

//Route mapping 
router.get('/', index);
router.post('/', addTask);
router.get('/char', showChar);
router.get('/reward', showReward);
router.get('/reset', reset);
router.get('/gameOver', showGameOver);

router.post('/charCreate', createChar);

// Task Routes
router.get('/task/edit/:id', editTaskDetails);  // Edit Task Form
router.get('/task/:id', showTaskDetails);       // Task Details
router.post('/task/:id', updateTask);           // Task Update Post Method
router.get('/task/delete/:id', deleteTask);     // Task Delete Method
router.post('/task/claim/:id', claimTask);       // Claim Task Method

// Reward Routes
router.post('/reward/claim/:id', claimReward);  // Claim Reward Method
//---------------------------------------------------

	//Show Index.html
async function index(ctx){
    var rawdata = fs.readFileSync('test.json');
    var subject = JSON.parse(rawdata);
    var charCreated = true;
    
    //Check if a Character object is empty
    if (Object.entries(subject.Character).length === 0 && subject.Character.constructor === Object) {
        charCreated = false;}
   
    //Checking if any tasks have expired
    var taskExpiredBoolInitial = TaskExpiredCheck();
    if (taskExpiredBoolInitial === true) {
        //Reload the JSON object data after TaskExpiredCheck() has modified it. 
        rawdata = fs.readFileSync('test.json');
        subject = JSON.parse(rawdata);
        
        if (subject.Character["HP"] > 0 ) {//If HP Value greater than 0, can keep playing the game
            ctx.redirect('/');} //Need to redirect because need to reload/update the subject object after changes 
        else { //If HP Value equal or is less than 0, alert player and do a reset
            ctx.redirect('/gameOver');
        }
    }
    

    // Finds all tasks due today
    var todayDate = new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate());
    var todayTasks = subject.IncompleteTasks.filter(function (task) {
        var taskDateArray = task.TaskDueDate.split("/"); //Assume date stored as string "2000/01/20"
        var taskDate = new Date(parseInt(taskDateArray[0], 10), parseInt(taskDateArray[1], 10) - 1, parseInt(taskDateArray[2], 10));
        
        return taskDate.getTime() == todayDate.getTime();
    });
    
    // Finds all tasks due in the next 3 days
    var nextThreeDaysTasks = subject.IncompleteTasks.filter(function (task) {
        var taskDateArray = task.TaskDueDate.split("/"); //Assume date stored as string "2000/01/20"
        var taskDate = new Date(parseInt(taskDateArray[0], 10), parseInt(taskDateArray[1], 10) - 1, parseInt(taskDateArray[2], 10));
        var next3DaysDate = addDays(todayDate,3);

        return (taskDate.getTime() > todayDate.getTime()) && (taskDate.getTime() <= next3DaysDate);
    });

    // Finds all other remaining tasks
    var allOtherTasks = subject.IncompleteTasks.filter(function (task) {
        var taskDateArray = task.TaskDueDate.split("/"); //Assume date stored as string "2000/01/20"
        var taskDate = new Date(parseInt(taskDateArray[0], 10), parseInt(taskDateArray[1], 10) - 1, parseInt(taskDateArray[2], 10));
        var next3DaysDate = addDays(todayDate,3);

        return taskDate.getTime() > next3DaysDate;
    });
    
    // Render index page
    await ctx.render('index', {
        title: "Tasks",
        userCreated: charCreated,
        character: subject.Character,
        incompleteTasks: subject.IncompleteTasks,
        todayTasks: todayTasks,
        nextThreeDaysTasks: nextThreeDaysTasks,
        allOtherTasks: allOtherTasks
    }); 
};

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

//Adding Task Form Functionality
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
    
    //Manipulate Date so that it fits the TaskExpiry Function
    var dateArr = body.taskDueDate.split("/");
    var newDateArr = [ dateArr[2], dateArr[0], dateArr[1] ];
    postTaskDueDate = newDateArr.join("/");
   
    //Creating JSON object that is being appended into local JSON object
    var taskObj = {};
    taskObj["TaskID"] = postTaskID;
    taskObj["TaskTitle"] = postTaskTitle;
    taskObj["TaskDescription"] = postTaskDescription;
    taskObj["TaskEXP"] = parseInt(postTaskEXP, 10);
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

    ctx.redirect('/');
};

async function showTaskDetails(ctx) {
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);

    await ctx.render('showTaskDetails', {
        title: "Task Detail",
        task: task
    });
}

async function editTaskDetails(ctx) {
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);

    await ctx.render('taskedit', {
        title: "Edit Task",
        task: task
    });
}

async function updateTask(ctx) {
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

    const body = ctx.request.body;
    const task_id = ctx.params.id;
    const task = subject.IncompleteTasks.find(x => x.TaskID == task_id);
    var incompleteTasks = subject.IncompleteTasks;
    const unearnedRewards = subject.UnearnedRewards;
    
    for (var i = 0; i < incompleteTasks.length; ++i) {
        if (incompleteTasks[i].TaskID == task_id) {
            incompleteTasks[i].TaskTitle = body.taskTitle;
            incompleteTasks[i].TaskDescription = body.taskDescription;
            incompleteTasks[i].TaskEXP = parseInt(postTaskEXP, 10);
            incompleteTasks[i].TaskRewardTitle = body.taskRewardTitle;
            incompleteTasks[i].TaskRewardDescription = body.taskRewardDescription;
            //incompleteTasks[i].TaskDueDate = body.taskDueDate;
            
            //Manipulate Date so that it fits the TaskExpiry Function
            var dateArr = body.taskDueDate.split("/");
            var newDateArr = [ dateArr[2], dateArr[0], dateArr[1] ];
            var postTaskDueDate = newDateArr.join("/");

            incompleteTasks[i].TaskDueDate = postTaskDueDate;
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
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    
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
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

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
    
    // Gaining EXP based on the Task's EXP Value
    subject.Character["EXP"] = subject.Character["EXP"] + task["TaskEXP"];
    
    //Check if Leveled UP; if leveled up change EXP and HP
    if (subject.Character["EXP"] >= (10 + 20 * (subject.Character["Level"] - 1))) {
        subject.Character["Level"] += 1;
        subject.Character["EXP"] = 0;
        subject.Character["HP"] = 100 - (10 * (subject.Character["Level"] - 1));
        subject.Character["Image"] = "level" + subject.Character["Level"] + ".png";
    }

    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);

    ctx.redirect('/');
}

async function deleteTask(ctx) {
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

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
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    
    await ctx.render('char', {
        title: "Character",
        character: subject.Character,
        completedTasks: subject.CompleteTasks,
        claimedRewards: subject.ClaimedRewards,
        missedTasks: subject.FailedTasks
    });
};	
	
	//Show Reward.html
async function showReward(ctx) {
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);

    await ctx.render('reward', {
        title: "Rewards",
        character: subject.Character,
        unearnedRewards: subject.UnearnedRewards,
        earnedRewards: subject.EarnedRewards,
        claimedRewards: subject.ClaimedRewards
    });
};
    //Show GameOver
async function showGameOver(ctx) {
    await ctx.render('gameOver', {});
};

    //Reset Everything 
async function reset(ctx) {
    
    //Reset all Tasks and Rewards
    fs.writeFileSync('test.json', JSON.stringify({"IncompleteTasks":[],"CompleteTasks":[],"FailedTasks":[],"UnearnedRewards":[],"EarnedRewards":[],"ClaimedRewards":[],"FailedRewards":[],"Character":{},"TaskNumber":0, "TaskIDCounter": 0, "RewardIDCounter": 0}, null, 4));
        
    ctx.redirect('/');
};

//Backend Functionality for Create Character Modal
async function createChar(ctx) {
    const body = ctx.request.body;
    var postCharName = body.charName;
        
    //Read test.json and add Character Object (with user's inputted name) into JSON
    let rawdata = fs.readFileSync('test.json');
    let subject = JSON.parse(rawdata);
    
    var charObj = {};
    charObj["Name"] = postCharName;
    charObj["HP"] = 100;
    charObj["EXP"] = 0;
    charObj["Level"] = 1;
    charObj["Image"] = "level" + charObj["Level"] + ".png";
    
    subject.Character = charObj;
    
    let newSubject = JSON.stringify(subject, null, 4);
    fs.writeFileSync('test.json', newSubject);
    
    //Redirect to Homepage
    ctx.redirect('/');
};


//for testing purposes
router.get('/test', ctx => (ctx.body = 'Hello World'));

//Router Middle ware, lets app use routes and allows get post method on routes
app.use(router.routes()).use(router.allowedMethods());

//make the app listen to port 3000 and log message 
app.listen(3000, () => console.log('Server Started ...'));
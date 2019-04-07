var {DateTime} = require('luxon');

class Task {

    constructor(name, description, exp, reward, dueDate, repeat)
    {
        let _name = name;//string key for map
        let _description = description;//string
        let _exp = exp;//int 
        let _reward = reward;// reward object
        let _dueDate = DateTime.fromISO(dueDate).endOf("day"); //luxon datetime object or null otherwise
        let _repeat = repeat; //array of bool representing the days of the week or null if no repeat
        let _completed = null;//true if completed , false if expired, null if in progress

       
        this.isExpired = function(){
            //function to check expiry of tasks
            let now = DateTime.local();
            if(_dueDate >= now)
            {return false;}
            else
            {return true;}
        } 

        //setters
        this.setName = function(newName)
        {
            _name = newName;
        }
        this.setCompleted = function(newCompleted)
        {
            _completed = newCompleted;
        }
        this.setDescription = function(newDescription){
            _reward = newDescription;
        }
        
        this.setExp = function(newExp){
            _exp =  newExp;
        }

        this.setReward = function(newReward){
            _reward = newReward;
        }

        this.setDueDate = function(newDueDate){
            _dueDate = DateTime.fromISO(newDueDate).endOf("day");
        }

        this.setRepeat = function(newRepeat){
            _reward = newRepeat;
        }

        
        //getters
        this.getName = function()
        {
            return _name;
        }
        this.getCompleted = function()
        {
            return _completed;
        }
        this.getDescription = function(){
            return _description;
        }

        this.getExp = function(){
            return _exp;
        }

        this.getReward = function(){
            return _reward;
        }

        this.getDueDate = function(){
            return _dueDate;
        }

        this.getRepeat = function(){
            return _repeat;
        }
    }
}

module.exports = Task;
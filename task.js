class Task {

    constructor(description, exp, reward, dueDate, repeat)
    {

        let _description = description;
        let _exp = exp;
        let _reward = reward;
        let _dueDate = dueDate;
        let _repeat = repeat;

        this.complete = function(){
            //function for when user completes the task
        }

        this.isExpired = function(){
            //function to check expiry of tasks
        } 

        //setters
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
            _dueDate = newDueDate;
        }

        this.setRepeat = function(newRepeat){
            _reward = newRepeat;
        }

        
        //getters
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
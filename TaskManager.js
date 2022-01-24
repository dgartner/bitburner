export class TaskManager 
{
    constructor(ns) 
    {
        this.ns = ns;
        this.myTasks = new Array();
    }

    push(task)
    {
        this.validateTask(task);
        this.myTasks.push(task);
        this.myTasks.sort(sortByEndTime);
    }

    validateTask(task)
    {
        if(isNaN(task.moneyMultiplier))
        {
            this.ns.alert("moneyMultiplier is NaN");
        }
    }

    getTasks()
    {
        for(var i = 0; i < this.myTasks.length; i++)
        {
            let task = this.myTasks[i];
            if(task.endTime < this.ns.getTimeSinceLastAug())
            {
                //remove first item from the list.
                this.myTasks.shift();
                i--;
            }
        }
        return this.myTasks;
    }
}

function sortByEndTime(a, b)
{
    return a.endTime - b.endTime;
}
export class TaskManager 
{
    constructor(ns) 
    {
        this.ns = ns;
        this.myTasks = new Array();
    }

    push(task)
    {
        //this.ns.tprint(task);
        //this.ns.tprint("Pushing Task" + task);
        this.myTasks.push(task);
        //this.ns.tprint(this.myTasks);
    }

    getAllTasks()
    {
        ////this.ns.tprint("Sorting tasklist: " + this.tasklist);
        //this.tasklist = this.tasklist.sort(sortByEndTime);
        //this.ns.tprint("Check for tasks to remove " + this.myTasks.length);
        this.myTasks.sort(sortByEndTime);
        for(var i = 0; i < this.myTasks.length; i++)
        {
            let task = this.myTasks[i];
            if(task.endTime < this.ns.getTimeSinceLastAug())
            {
                //remove first item from the list.
                this.myTasks.shift();
                i--;

                //this.ns.tprint(this.ns.getTimeSinceLastAug() + ": " + task.endTime);
            }
        }
        return this.myTasks;
    }

    getTasks(server)
    {
        let templist = [];
        let tasks = this.getAllTasks();
        for(let i = 0; i < this.myTasks.length; i++)
        {
            if(this.myTasks[i].serverName == server)
            {
                templist.push(this.myTasks[i]);
            }
        }
        return templist;
    }
}

function sortByEndTime(a, b)
{
    //this.ns.tprint("Sorting: " + a.endTime + " " + b.endTime);
    return a.endTime - b.endTime;
}
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
        //this.ns.tprint("Pushing Task");
        this.myTasks.push(task);
        this.ns.tprint("All logged tasks");
        this.ns.tprint(this.ns.getTimeSinceLastAug());
        this.ns.tprint(this.myTasks);
        this.ns.tprint("-------------------------");
    }

    getTasks()
    {
        ////this.ns.tprint("Sorting tasklist: " + this.tasklist);
        //this.tasklist = this.tasklist.sort(sortByEndTime);
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
}
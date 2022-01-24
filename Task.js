export class Task{
    constructor(hostname, targetName, script, secEffect, moneyMultiplier, endTime, threads)
    {
        this.hostname = hostname;
        this.targetName = targetName;
        this.script = script;
        this.secEffect = secEffect;
        this.moneyMultiplier = moneyMultiplier;
        this.endTime = endTime;
        this.threads = threads;
    }

    getWeakenThreads()
    {
        let threads = 0;
        if(this.script == "weaken.js")
        {
            threads = this.threads;
        }
        return threads;
    }

    getGrowThreads()
    {
        let threads = 0;
        if(this.script == "grow.js")
        {
            threads = this.threads;
        }
        return threads;
    }

    getHackThreads()
    {
        let threads = 0;
        if(this.script == "hack.js")
        {
            threads = this.threads;
        }
        return threads;
    }
}
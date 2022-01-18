export class Task{
    constructor(serverName, script, secEffect, moneyMultiplier, endTime, threads)
    {
        this.serverName = serverName;
        this.script = script;
        this.secEffect = secEffect;
        this.moneyMultiplier = moneyMultiplier;
        this.endTime = endTime;
        this.threads = threads;
    }
}
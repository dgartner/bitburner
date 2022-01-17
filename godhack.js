import { Crawler } from "./crawler";

/** @param {NS} ns **/
export async function main(ns) {
    let crawler = new Crawler(ns);
    let tm = new TaskManager(ns);
    let analyzer = new Analyzer(ns, tm);
    await crawler.run();
    crawler.nukeAll();

    let servers = crawler.getHackworthyServers();

    //TODO sort servers somehow.

    while(true)
    {
        for(let i = 0; i < servers.length; i++)
        {
            let server = servers[i];
            analyzer.weaken(server);
            analyzer.grow(server);
            analyzer.hack(server);
        }
        await ns.sleep(1);
    }
}

class Analyzer 
{
    constructor(ns, tm) 
    {
        this.ns = ns;
        this.tm = tm;
        this.homeServer = ns.getServer(ns.getHostname());
        this.cores = this.homeServer.cpuCores;
    }

    weaken(server)
    {
        let scriptName = "weaken.js";
        let endTime = this.ns.getWeakenTime(server.hostname);
        let threads = this.getWeakenThreads(server);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = 0 - this.ns.weakenAnalyze(threads, this.cores);
        let moneyMultiplier = 1;
        if(threads > 0)
        {
            this.ns.exec(scriptName, this.ns.getHostname(), threads);
            this.tm.push(new Task(server.hostname, scriptName, secEffect, moneyMultiplier, endTime, threads))
        }
    }

    grow(server)
    {
        let scriptName = "grow.js";
        let endTime = this.ns.getGrowTime(server.hostname);
        let threads = this.getGrowThreads(server);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = this.ns.growthAnalyzeSecurity(threads);
        let moneyMultiplier = 1; //use HackingFormulas.growPercent(server.hostname, threads, ns.getPlayer(), this.cores);
        if(threads > 0)
        {
            this.ns.exec(scriptName, this.ns.getHostname(), threads);
            this.tm.push(new Task(server.hostname, scriptName, secEffect, moneyMultiplier, endTime, threads))
        }
    }

    hack(server)
    {
        let scriptName = "hack.js";
        let endTime = this.ns.getHackTime(server.hostname);
        let threads = this.getHackThreads(server);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = this.ns.hackAnalyzeSecurity(threads);
        let moneyMultiplier = this.ns.hackAnalyze(server.hostname) * threads * this.ns.hackAnalyzeChance(server.hostname);
        if(threads > 0)
        {
            this.ns.exec(scriptName, this.ns.getHostname(), threads);
            this.tm.push(new Task(server.hostname, scriptName, secEffect, moneyMultiplier, endTime, threads))
        }
    }

    getMaxThreads(script)
    {
        let remainingRam = this.homeServer.maxRam - this.homeServer.ramUsed;
        let scriptRam = this.ns.getScriptRam(script, this.homeServer.hostname);
        return Math.floor(remainingRam/scriptRam);
    }
    

    getWeakenThreads(server) 
    {
        let endTime = this.ns.getWeakenTime(server.hostname);
        let secLevel = this.getSecLevelAtTime(server, endTime);
        let secDelta = secLevel - server.minDifficulty;
        let stWeakenEffect = this.ns.weakenAnalyze(1, this.cores);
        return Math.floor(secDelta / stWeakenEffect);
    }

    getGrowThreads(server)
    {
        let growThreads = 0;
        let endTime = this.ns.getGrowTime(server.hostname);
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server.hostname, endTime);
        if(effectiveMoneyPercentage < 1)
        {
            let growthPercent = 1 / effectiveMoneyPercentage;
            growThreads = this.ns.growthAnalyze(sever.hostname, growthPercent, this.cores);
        }
        return Math.floor(growThreads);        
    }

    getHackThreads(server)
    {
        let targetHackPercentage = 0.25;
        let endTime = this.ns.getHackTime(server.hostname);
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server.hostname, endTime);
        let hackThreads = 0;
        if(effectiveMoneyPercentage > 0.98)
        {
            let hackDollars = server.moneyMax * targetHackPercentage;
            hackThreads = this.ns.hackAnalyzeThreads(server.hostname, hackDollars);
        }
        return Math.floor(hackThreads);        
    }

    getSecLevelAtTime(server, time) 
    {
        let secLevel = server.hackDifficulty;
        let tasks = this.tm.getTasks();
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            if(task.serverName == server.hostname)
            {
                if(task.endTime < time)
                {
                    secLevel += task.secEffect;
                }
                if(secLevel < server.minDifficulty)
                {
                    secLevel = server.minDifficulty;
                }
            }
        }
        return secLevel;
    }

    getMoneyPercentAtTime(server, time)
    {
        let money = server.moneyAvailable;
        let tasks = this.tm.getTasks();
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            if(task.serverName == server.hostname)
            {
                if(task.endTime < time)
                {
                    money *= task.moneyMultiplier;
                }
                if(money > server.moneyMax)
                {
                    money = moneyMax;
                }
            }
        }
        return money / server.moneyMax;
    }
}

function sortByEndTime(a, b)
{
    return b - a;
}

class TaskManager 
{
    constructor(ns) 
    {
        this.ns = ns;
        this.tasklist = new Array();
    }

    push(task)
    {
        this.tasklist.push(task);
    }

    getTasks()
    {
        this.tasklist.sort(sortByEndTime);
        for(var i = 0; i < this.tasklist.length; i++)
        {
            let task = this.tasklist[i];
            if(task.endTime < this.ns.getTimeSinceLastAug())
            {
                //remove first item from the list.
                this.tasklist = this.tasklist.shift();
                i--;
            }
            else
            {
                break;
            }
        }
        return this.tasklist;
    }
}

class Task{
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
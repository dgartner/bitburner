import { Task } from "./Task";

export class Analyzer 
{
    constructor(ns, tm) 
    {
        this.ns = ns;
        this.tm = tm;
        this.homeServer = ns.getHostname();
        this.cores = this.ns.getServer(this.homeServer).cpuCores;
        this.pid = 0;
    }

    isSaturated(server)
    {
        let wt = this.getWeakenThreads(server);
        let gt = this.getGrowThreads(server);
        let ht = this.getHackThreads(server);
        let isSaturated = false;
        if(wt == 0 && gt == 0 && ht == 0)
        {
            isSaturated = true;
        }
        return isSaturated;
    }

    weaken(server)
    {
        //this.ns.tprint("Trying weaken on " + server);
        let scriptName = "weaken.js";
        let endTime = this.ns.getWeakenTime(server) + this.ns.getTimeSinceLastAug();
        let threads = this.getWeakenThreads(server);
        //this.ns.tprintf("  Ideal threads = %d", threads);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = 0 - this.ns.weakenAnalyze(threads, this.cores);
        let moneyMultiplier = 1;
        if(threads > 0)
        {
            this.ns.print(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            this.ns.exec(scriptName, this.homeServer, threads, server, this.pid++);
            this.tm.push(new Task(server, scriptName, secEffect, moneyMultiplier, endTime, threads));
        }
    }

    grow(server)
    {
        let scriptName = "grow.js";
        let endTime = this.ns.getGrowTime(server) + this.ns.getTimeSinceLastAug();
        let threads = this.getGrowThreads(server);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = this.ns.growthAnalyzeSecurity(threads);
        let growthPercent = 1;
        while(this.ns.growthAnalyze(server, growthPercent, this.cores) < threads)
        {
            growthPercent ++;
        }
        let moneyMultiplier = 1 + (growthPercent/100); //use HackingFormulas.growPercent(server, threads, ns.getPlayer(), this.cores);
        if(threads > 0)
        {
            this.ns.print(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            this.ns.exec(scriptName, this.homeServer, threads, server, this.pid++);
            this.tm.push(new Task(server, scriptName, secEffect, moneyMultiplier, endTime, threads));
        }
    }

    hack(server)
    {
        let scriptName = "hack.js";
        let endTime = this.ns.getHackTime(server) + this.ns.getTimeSinceLastAug();
        let threads = this.getHackThreads(server);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = this.ns.hackAnalyzeSecurity(threads);
        let moneyMultiplier = this.ns.hackAnalyze(server) * threads * this.ns.hackAnalyzeChance(server);
        if(threads > 0)
        {
            this.ns.print(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            this.ns.exec(scriptName, this.homeServer, threads, server, this.pid++);
            this.tm.push(new Task(server, scriptName, secEffect, moneyMultiplier, endTime, threads));
        }
    }

    getMaxThreads(script)
    {
        let homeServ = this.ns.getServer(this.homeServer);
        let remainingRam = homeServ.maxRam - homeServ.ramUsed;
        //this.ns.tprintf("    %f used out of %f", this.homeServer.ramUsed, this.homeServer.maxRam);
        let scriptRam = this.ns.getScriptRam(script, this.homeServer);
        //this.ns.tprintf("    Enough ram for %d %s threads", Math.floor(remainingRam/scriptRam), script);
        return Math.floor(remainingRam/scriptRam);
    }
    

    getWeakenThreads(server) 
    {
        let endTime = this.ns.getWeakenTime(server) + this.ns.getTimeSinceLastAug();
        let secLevel = this.getSecLevelAtTime(server, endTime);
        let secDelta = secLevel - this.ns.getServerMinSecurityLevel(server)
        let stWeakenEffect = this.ns.weakenAnalyze(1, this.cores);
        // this.ns.tprint("  SecLevel: " + this.ns.getServerSecurityLevel(server));
        // this.ns.tprint("  predicted SecLevel: " + secLevel);
        // this.ns.tprint("  SecDelta pred: " + secDelta);
        // this.ns.tprint("  singleThread weaken: " + stWeakenEffect);
        // this.ns.tprint("  threads: " + Math.floor(secDelta / stWeakenEffect));
        return Math.floor(secDelta / stWeakenEffect);
    }

    getGrowThreads(server)
    {
        let growThreads = 0;
        let endTime = this.ns.getGrowTime(server) + this.ns.getTimeSinceLastAug();
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server, endTime);
        if(effectiveMoneyPercentage < 1)
        {
            let growthPercent = 1 / effectiveMoneyPercentage;
            growThreads = this.ns.growthAnalyze(server, growthPercent, this.cores);
        }
        return Math.floor(growThreads);
    }

    getHackThreads(server)
    {
        let serv = this.ns.getServer(server);
        let targetHackPercentage = 0.25;
        let endTime = this.ns.getHackTime(server) + this.ns.getTimeSinceLastAug();
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server, endTime);
        let hackThreads = 0;
        if(effectiveMoneyPercentage > 0.98)
        {
            let hackDollars = serv.moneyMax * targetHackPercentage;
            hackThreads = this.ns.hackAnalyzeThreads(server, hackDollars);
        }
        return Math.floor(hackThreads);        
    }

    getSecLevelAtTime(server, time) 
    {
        let serv = this.ns.getServer(server);
        let secLevel = this.ns.getServerSecurityLevel(server);
        let tasks = this.tm.getTasks();
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            if(task.serverName == server)
            {
                //this.ns.tprint(task);
                if(task.endTime < time)
                {
                    secLevel += task.secEffect;
                }
                if(secLevel < serv.minDifficulty)
                {
                    secLevel = serv.minDifficulty;
                }
            }
        }
        return secLevel;
    }

    getMoneyPercentAtTime(server, time)
    {
        let serv = this.ns.getServer(server);
        let money = serv.moneyAvailable;
        let tasks = this.tm.getTasks();
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            if(task.serverName == server)
            {
                if(task.endTime < time)
                {
                    money *= task.moneyMultiplier;
                }
                if(money > serv.moneyMax)
                {
                    money = moneyMax;
                }
            }
        }
        return money / serv.moneyMax;
    }
}

function sortByEndTime(a, b)
{
    //this.ns.tprint("Sorting: " + a.endTime + " " + b.endTime);
    return b.endTime - a.endTime;
}
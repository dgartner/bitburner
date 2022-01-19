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
        
	    this.ns.disableLog("ALL");
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
        let secDelta = this.getSecLevelAtTime(server, endTime) - this.ns.getServerMinSecurityLevel(server);
        //this.ns.tprintf("  Ideal threads = %d", threads);
        threads = Math.min(this.getMaxThreads(scriptName), threads);
        let secEffect = 0 - this.ns.weakenAnalyze(threads, this.cores);
        let moneyMultiplier = 1;
        if(threads > 0)
        {
            this.ns.tprint(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            //this.ns.tprint(this.ns.sprintf("SecDelta: %0.2f -> %0.2f", secDelta, secDelta - secEffect));
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
        let moneyBefore = this.getMoneyPercentAtTime(server, endTime)*100;
        let moneyAfter = this.getMoneyPercentAtTime(server, endTime)*100*moneyMultiplier;
        if(threads > 0)
        {
            this.ns.tprint(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            //this.ns.tprint(this.ns.sprintf("Money: %3.2f%% -> %3.2f%%", moneyBefore, moneyAfter));
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
        let moneyBefore = this.getMoneyPercentAtTime(server, endTime)*100;
        let moneyAfter = this.getMoneyPercentAtTime(server, endTime)*100*moneyMultiplier;
        if(threads > 0)
        {
            this.ns.tprint(this.ns.sprintf("Spawning %d %s threads on %s", threads, scriptName, server));
            //this.ns.tprint(this.ns.sprintf("Money: %3.2f%% -> %3.2f%%", moneyBefore, moneyAfter));
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
        this.ns.print(this.tm.getTasks(server));
        let secDelta = secLevel - this.ns.getServerMinSecurityLevel(server);
        let stWeakenEffect = this.ns.weakenAnalyze(1, this.cores);
        //this.ns.tprint("  predicted SecLevel: " + secLevel);
        //this.ns.tprint("  SecDelta pred: " + secDelta);
        //this.ns.tprint("  singleThread weaken: " + stWeakenEffect);
        //this.ns.tprint("  threads: " + Math.floor(secDelta / stWeakenEffect));
        let threads = Math.floor(secDelta / stWeakenEffect);
        if(threads > 0)
        {
            // this.ns.tprint("-----weaken---");
            // this.ns.tprint("  SecDelta at endTime: " + secDelta);
            // this.ns.tprint("  Requesting " + Math.floor(secDelta / stWeakenEffect) + " threads");
        }
        return threads;
    }

    getGrowThreads(server)
    {
        let growThreads = 0;
        let endTime = this.ns.getGrowTime(server) + this.ns.getTimeSinceLastAug();
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server, endTime);
        let growthPercent = 0;
        if(effectiveMoneyPercentage < 1)
        {
            growthPercent = 1 / effectiveMoneyPercentage;
            growThreads = Math.max(this.ns.growthAnalyze(server, growthPercent, this.cores), 1);
        }
        if(growThreads > 0)
        {
            // this.ns.tprint("-----grow-----");
            // this.ns.tprint("  Money at endTime: " + effectiveMoneyPercentage);
            // this.ns.tprint("  Requesting " + growThreads + " threads to grow " + growthPercent);
        }
        return Math.ceil(growThreads);
    }

    getHackThreads(server)
    {
        let serv = this.ns.getServer(server);
        let targetHackPercentage = 0.05;
        let endTime = this.ns.getHackTime(server) + this.ns.getTimeSinceLastAug();
        let effectiveMoneyPercentage = this.getMoneyPercentAtTime(server, endTime);
        let hackThreads = 0;
        let hackDollars = 0;
        if(effectiveMoneyPercentage > 0.98)
        {
            hackDollars = serv.moneyMax * targetHackPercentage;
            hackThreads = this.ns.hackAnalyzeThreads(server, hackDollars);
        }
        if(hackThreads > 0)
        {
            // this.ns.tprint("-----hack-----");
            // this.ns.tprint("  Money at endTime: " + effectiveMoneyPercentage);
            // this.ns.tprint("  Requesting " + hackThreads + " threads");
            // this.ns.tprint("  Money after hack " + (((serv.moneyMax * effectiveMoneyPercentage) - hackDollars)/serv.moneyMax));
        }
        return Math.ceil(hackThreads);
    }

    getSecLevelAtTime(server, time) 
    {
        let serv = this.ns.getServer(server);
        let secLevel = this.ns.getServerSecurityLevel(server);
        let tasks = this.tm.getTasks(server);
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
        let tasks = this.tm.getTasks(server);
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
                    money = serv.moneyMax;
                }
            }
        }
        //this.ns.tprint("Server: " + server);
        //this.ns.tprint("  Money: " + money);
        //this.ns.tprint("  Max  : " + serv.moneyMax);
        //this.ns.tprint("  %Full: " + (money / serv.moneyMax));
        return money / serv.moneyMax;
    }

    reportAll(servers)
    {
        this.ns.clearLog();
        let tasks = this.tm.getTasks();
        this.ns.print(tasks);
        servers.forEach(server => this.report(server));
        tasks.forEach(task => this.ns.print(task))
    }

    report(server)
    {
        let tasks = this.tm.getTasks(server);
        //tasks.forEach(task => this.ns.print(task));
        let wt = 0;
        let gt = 0;
        let ht = 0;
        let minSecurity = this.ns.getServerMinSecurityLevel(server);
        let currentSecurity = this.ns.getServerSecurityLevel(server);
        let securityDelta = currentSecurity - minSecurity;
        let predictedDelta = securityDelta;
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            wt += task.getWeakenThreads();
            gt += task.getGrowThreads();
            ht += task.getHackThreads();
            predictedDelta += task.secEffect;

            //this.ns.tprintf("  TIndex: %d -- W: %d -- G: %d -- H: %d", i, wt, gt, ht);
            
        }
        let currentMoney = this.ns.getServerMoneyAvailable(server) / 1000000;
        let maxMoney = this.ns.getServerMaxMoney(server) / 1000000;
        let percentFull = (currentMoney / maxMoney) * 100;

        this.ns.print(server);
        this.ns.print(
            this.ns.sprintf("  W: %d -- G: %d -- H: %d", wt, gt, ht) + 
            this.ns.sprintf(":: Money: %.2f mil / %.2f mil -- %3.2f%%", currentMoney, maxMoney, percentFull) +
            this.ns.sprintf(":: Sec: %02.2f -- Pred: %02.2f", securityDelta, predictedDelta)
            );
    }
}

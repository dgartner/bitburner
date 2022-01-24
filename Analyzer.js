import { Task } from "./Task";
import { Crawler } from "./crawler";
import { ServerModel } from "./ServerModel";
//AnalyzerV8
export class Analyzer 
{
    constructor(ns, tm, crawler) 
    {
        this.ns = ns;
        this.tm = tm;
        this.homeServer = ns.getHostname();
        this.cores = this.ns.getServer(this.homeServer).cpuCores;
        this.pid = 0;
        
        this.crawler = crawler;

	    this.ns.disableLog("ALL");
    }

    tryToRun(server)
    {
        let anyTasksRun = false;
        if(this.weaken(server) ||
            this.grow(server) ||
            this.hack(server))
            {
                anyTasksRun = true;
            }
        return anyTasksRun;
    }

    /** 
     * @param {ServerModel} target 
    */
    weaken(target)
    {
        let anyTasksRun = false;
        let endTime = this.ns.getWeakenTime(target.getHostname()) + this.getCurrentTime();
        let predictedSecLevel = this.getSecLevelAtTime(target, endTime);
        let predictedSecDelta = predictedSecLevel - target.getMinSecurity();

        let botnet = this.crawler.getControlableServerList();
        for(let i = 0; i < botnet.length; i++)
        {
            if(predictedSecDelta < 0.1) break;
            let bot = botnet[i];
            let task = bot.weaken(target, predictedSecDelta);
            if(task != null)
            {
                predictedSecDelta += task.secEffect;
                this.tm.push(task);
                anyTasksRun = true;
            }
        }
        return anyTasksRun;
    }

    grow(target)
    {
        let anyTasksRun = false;
        let endTime = this.ns.getGrowTime(target.getHostname()) + this.ns.getTimeSinceLastAug();
        let predictedMoney = this.getMoneyPercentAtTime(target, endTime);
        let targetGrowth = 1/predictedMoney;

        let botnet = this.crawler.getControlableServerList();
        for(let i = 0; i < botnet.length; i++)
        {
            if(targetGrowth <= 1.04) break;
            let bot = botnet[i];
            let task = bot.grow(target, targetGrowth);
            if(task != null)
            {
                this.tm.push(task);
                let predictedMoney = this.getMoneyPercentAtTime(target, endTime + 1);
                targetGrowth = 1/predictedMoney;
                anyTasksRun = true;
            }
        }
        return anyTasksRun;
    }

    hack(server)
    {
        let anyTasksRun = false;
        let endTime = this.ns.getHackTime(server.getHostname()) + this.ns.getTimeSinceLastAug();
        let predictedMoneyPercent = this.getMoneyPercentAtTime(server, endTime);
        let minMoneyPercent = 0.85;
        let targetHackPercent = (predictedMoneyPercent - minMoneyPercent);

        let botnet = this.crawler.getControlableServerList();
        for(let i = 0; i < botnet.length; i++)
        {
            if(targetHackPercent < 0) break;
            let bot = botnet[i];
            let task = bot.hack(server, targetHackPercent, predictedMoneyPercent);
            if(task != null)
            {
                predictedMoneyPercent *= 1 + task.moneyMultiplier;
                targetHackPercent += task.moneyMultiplier;
                this.tm.push(task);
                anyTasksRun = true;
            }
        }
        return anyTasksRun;
    }

    getSecLevelAtTime(server, time) 
    {
        let secLevel = server.getCurrentSecurity();
        let tasks = this.tm.getTasks(server);
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            //this.ns.tprint(task);
            if(task.endTime < time)
            {
                secLevel += task.secEffect;
            }
        }
        return secLevel;
    }

    getSecModifierAtTime(server, time)
    {
        let secModifier = 0;
        let tasks = this.tm.getTasks(server);
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            secModifier += task.secEffect;
        }
        return secModifier;
    }

    /**
     * 
     * @param {ServerModel} server 
     * @param {number} time 
     * @returns {number}
     */

    reportAll(servers)
    {
        this.ns.clearLog();
        this.ns.print(" Weaken |  Grow  |  Hack  |   Max $  |   % $m  |Pred % $m |   Sec  |Pred Sec|  Time   | Server");
        this.ns.print("________________________________________________________________________________________________");
        servers.forEach(server => this.report(server));
    }

    report(server)
    {
        let tasks = this.tm.getTasks(server);
        let wt = 0;
        let gt = 0;
        let ht = 0;
        let securityDelta = server.getSecurityDelta();
        let predictedDelta = securityDelta;
        let percentModifier = 0;
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            wt += task.getWeakenThreads();
            gt += task.getGrowThreads();
            ht += task.getHackThreads();
            predictedDelta += task.secEffect;
            percentModifier += task.moneyMultiplier;
        }
        let currentMoney = server.getCurrentMoney() / 1000000;
        let maxMoney = server.getMaxMoney() / 1000000;
        let percentFull = (currentMoney / maxMoney) * 100;
        let predictedPercentFull = percentFull + percentModifier;
        
        let taskEndTime = 0;
        if(tasks.length > 0)
        {
            taskEndTime = (tasks[0].endTime - this.ns.getTimeSinceLastAug())/1000;
        }

        this.ns.print(
            this.ns.sprintf("%7d |%7d |%7d |", wt, gt, ht) + 
            this.ns.sprintf(" %8.2f | %6.2f%% | %6.2f%% |", maxMoney, percentFull, predictedPercentFull) +
            this.ns.sprintf(" %6.2f | %6.2f |", securityDelta, predictedDelta) +
            this.ns.sprintf(" %7.0f | %s", taskEndTime, server.getHostname())
            );
    }

    getCurrentTime() { return this.ns.getTimeSinceLastAug(); }
}

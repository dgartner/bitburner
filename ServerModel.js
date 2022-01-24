import { Task } from "./Task";
import { TaskManager } from "./TaskManager";
//SMV9

const WEAKEN_SCRIPT = "weaken.js";
const GROW_SCRIPT = "grow.js";
const HACK_SCRIPT = "hack.js";

const HACK_IF_OVER = 0.95;
const HACK_DOWN_TO = 0.75;
const MAX_GROW_THREADS = 1000000;
const MIN_HACK_SUCCESS_CHANCE = 0.50;
const HOME_RESERVE_RAM = 5;

export class ServerModel {
    /**
     * 
     * @param {NS} ns 
     * @param {string} name 
     */
    constructor(ns, name) {
        this.ns = ns;
        this.name = name;

        let serv = ns.getServer(name);
        this.moneyMax = serv.moneyMax;
        this.ramMax = serv.maxRam;
        this.secMin = serv.minDifficulty;
        this.requiredHackLevel = serv.requiredHackingSkill;
        this.weakenID = 0;
        this.growID = 0;
        this.hackID = 0;
        this.tm = new TaskManager(this.ns);
    }

    /** @return {boolean} */
    hasAdminRights() { return this.ns.getServer(this.name).hasAdminRights; }

    /** @returns {boolean} */
    isNukeable() {
        let server = this.ns.getServer(this.name);
        let openPorts = server.openPortCount;
        let openPortsRequired = server.numOpenPortsRequired;
        return openPorts >= openPortsRequired;
    }

    nuke() { this.ns.nuke(this.name); }

    /** @returns {String} */
    getHostname() { return this.name; }

    /** @returns {number} */
    getMaxMoney() { return this.moneyMax; }

    /** @returns {Number} */
    getCurrentMoney() { return this.ns.getServerMoneyAvailable(this.name); }

    /** @returns {Number} */
    getMoneyPercent() { return this.getCurrentMoney() / this.getMaxMoney(); }

    /** @returns {Number} */
    getMinSecurity() { return this.secMin; }

    /** @returns {Number} */
    getCurrentSecurity() { return this.ns.getServerSecurityLevel(this.name); }

    /** @returns {Number} */
    getSecurityDelta() { return this.getCurrentSecurity() - this.getMinSecurity(); }

    /** @returns {Number} */
    getNumberOfCores() { return this.ns.getServer(this.name).cpuCores; }

    /** @returns {Number} */
    getMaxRam() 
    { 
        if(this.getHostname() == "home")
        {
            return this.ns.getServerMaxRam(this.name) - HOME_RESERVE_RAM;
        }
        return this.ns.getServerMaxRam(this.name);
    }

    /** @returns {Number} */
    getUsedRam() { return this.ns.getServerUsedRam(this.name); }

    /** @returns {Number} */
    getRemainingRam() { return this.getMaxRam() - this.getUsedRam(); }

    getWeakenTime() { return this.ns.getWeakenTime(this.name); }

    getRequiredHackLevel() { return this.requiredHackLevel; }

    getScriptRam(scriptName) { return this.ns.getScriptRam(scriptName, this.getHostname()); }

    getMaxThreads(scriptName) { return Math.floor(this.getRemainingRam() / this.getScriptRam(scriptName)); }

    getSecModifierAtTime(time) 
    { 
        let weakenThreads = this.getThreadsAtTime(WEAKEN_SCRIPT, time);
        let secMod = -this.ns.weakenAnalyze(weakenThreads, this.getNumberOfCores());
        return secMod;
    }

    getSecDeltaAtTime(endTime) 
    { 
        let secDelta = this.getSecurityDelta();
        let secMod = this.getSecModifierAtTime(endTime);
        return secDelta + secMod;
    }

    getThreadsAtTime(script, time) {
        let threads = 0;
        let tasks = this.tm.getTasks();
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            if (task.script == script) {
                threads += task.threads;
            }
        }
        return threads;
    }

    getMoneyPercentAtTime(time) {
        let startingPercent = this.getCurrentMoney() / this.getMaxMoney();
        let maxMultiplier = 1 / startingPercent;
        let tasks = this.tm.getTasks();
        let multiplier = 1;
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            if (task.endTime < time + 1) {
                multiplier += task.moneyMultiplier;
            }
            if(startingPercent * multiplier > 1)
            {
                multiplier = 1 / startingPercent;
            }
        }
        return startingPercent * multiplier;
    }

    hasAvailableRam(server) { return server.getRemainingRam > 1.8; }

    getWeakenSecEffect(threads) { return -this.ns.weakenAnalyze(threads, this.getNumberOfCores()); }
    getGrowSecEffect(threads) { return this.ns.growthAnalyzeSecurity(threads, this.getNumberOfCores()); }
    getHackSecEffect(threads) { return this.ns.hackAnalyzeSecurity(threads, this.getNumberOfCores()); }

    getWeakenTime() 
    { 
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            return this.ns.formulas.hacking.weakenTime(this.ns.getServer(this.getHostname()), this.ns.getPlayer());
        }
        else
        {
            return this.ns.getWeakenTime(this.name);
        }
    }

    getHackTime() 
    { 
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            return this.ns.formulas.hacking.hackTime(this.ns.getServer(this.getHostname()), this.ns.getPlayer());
        }
        else
        {
            return this.ns.getHackTime(this.name);
        }
    }
            
    getGrowTime() 
    { 
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            return this.ns.formulas.hacking.growTime(this.ns.getServer(this.getHostname()), this.ns.getPlayer());
        }
        else
        {
            return this.ns.getGrowTime(this.name);
        }
    }

    getServerObj()
    {
        return this.ns.getServer(this.getHostname());
    }

    getIdealGrowThreads(predictedMoneyPercent) 
    {
        let newPredictedMoneyPercent = Math.min(predictedMoneyPercent, 1);
        if(newPredictedMoneyPercent <= 0)
        {
            return 1;
        }
        let percentToGrow = 1 / newPredictedMoneyPercent;
        let threads = this.ns.growthAnalyze(this.getHostname(), percentToGrow, this.getNumberOfCores());
        return Math.min(threads, MAX_GROW_THREADS);
    }

    getHackChance()
    {
        let successChance = 0;
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            successChance = this.ns.formulas.hacking.hackChance(this.getServerObj(), this.ns.getPlayer());
        }
        else
        {
            successChance = this.ns.hackAnalyzeChance(this.getHostname());
        }
        return successChance;
    }

    getDollarsStolenPerThread()
    {
        let hackChance = this.getHackChance();
        let maxMoney = this.getMaxMoney();
        let percentMoneyStolen = this.ns.hackAnalyze(this.getHostname());
    
        let dollarsPerHackThread = maxMoney * percentMoneyStolen * hackChance;
        return dollarsPerHackThread;    
    }

    getDollarsStolenPerSecond()
    {
        let hackTime = this.getHackTime();
        return this.getDollarsStolenPerThread() / hackTime;
    }

    getIdealHackThreads(predictedMoneyPercent) 
    {
        let percentPerSuccessfulThread = 0;
        let successChance = this.getHackChance();
        if(successChance < MIN_HACK_SUCCESS_CHANCE)
        {
            return 0;
        }
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            percentPerSuccessfulThread = this.ns.formulas.hacking.hackPercent(this.getServerObj(), this.ns.getPlayer());
        }
        else
        {
            percentPerSuccessfulThread = this.ns.hackAnalyze(this.getHostname());
        }

        let percentPerThread = percentPerSuccessfulThread * successChance;
        let percentDelta = predictedMoneyPercent - HACK_DOWN_TO;
        return Math.floor(percentDelta / percentPerThread);

    }

    getGrowMoneyMultiplier(threads)
    {
        let growPercent = 1;
        if (this.ns.fileExists("Formulas.exe", "home")) 
        {
            growPercent = this.ns.formulas.hacking.growPercent(this.getServerObj(), threads, this.ns.getPlayer(), this.getNumberOfCores());
        }
        else
        {
            while(this.ns.growthAnalyze(this.getHostname(), growPercent, this.getNumberOfCores()) < threads)
            {
                growPercent += 0.001;
            }
        }
        return growPercent - 1;
    }

    getType(obj)
    {
        if(typeof obj == 'object')
        {
            return Object.prototype.toString.call(obj);
        }
        else
        {
            return typeof obj;
        }
    }

    getHackMoneyMultiplier(threads)
    {
        return -this.ns.hackAnalyze(this.getHostname()) * threads;
    }

    weaken(botnet) {
        let scriptName = WEAKEN_SCRIPT;
        let endTime = this.getWeakenTime() + this.ns.getTimeSinceLastAug();
        let predictedSecDelta = this.getSecDeltaAtTime(endTime);

        let weakenSecEffect = this.getWeakenSecEffect(1);
        //let bots = new Array(botnet);
        botnet.filter(this.hasAvailableRam);
        let moneyMultiplier = 0;

        //botnet is the list of servers doing the hacking
        //this is the server being hacked
        for (let i = 0; i < botnet.length; i++) {
            if (predictedSecDelta < Math.abs(weakenSecEffect)) break;

            let bot = botnet[i];
            let maxThreads = bot.getMaxThreads(scriptName);
            let idealthreadCount = Math.floor(Math.abs(predictedSecDelta) / Math.abs(weakenSecEffect));
            let threads = Math.min(maxThreads, idealthreadCount);
            if (threads > 0) {
                let secEffect = this.getWeakenSecEffect(threads);
                this.ns.exec(scriptName, bot.getHostname(), threads, this.getHostname(), secEffect, this.weakenID++);
                this.tm.push(new Task(bot.getHostname(), this.getHostname(), scriptName, secEffect, moneyMultiplier, endTime, threads));
                predictedSecDelta += secEffect;
            }
        }
    }

    grow(botnet) {
        let scriptName = GROW_SCRIPT;
        let endTime = this.getGrowTime() + this.ns.getTimeSinceLastAug();

        botnet.filter(this.hasAvailableRam);

        let predictedMoneyPercent = this.getMoneyPercentAtTime(endTime);

        for (let i = 0; i < botnet.length; i++) {
            if (predictedMoneyPercent >= 0.97) break;

            let bot = botnet[i];
            let maxThreads = bot.getMaxThreads(GROW_SCRIPT);
            let idealthreadCount = this.getIdealGrowThreads(predictedMoneyPercent);
            let threads = Math.min(maxThreads, idealthreadCount);
            if (threads > 0) {
                let secEffect = this.getGrowSecEffect(threads);
                let moneyMultiplier = this.getGrowMoneyMultiplier(threads);
                this.ns.exec(scriptName, bot.getHostname(), threads, this.getHostname(), this.growID++);
                this.tm.push(new Task(bot.getHostname(), this.getHostname(), scriptName, secEffect, moneyMultiplier, endTime, threads));
                predictedMoneyPercent = this.getMoneyPercentAtTime(endTime + 1);
                break;
            }
        }
    }

    hack(botnet) {
        let scriptName = HACK_SCRIPT;
        let endTime = this.getHackTime() + this.ns.getTimeSinceLastAug();

        botnet.filter(this.hasAvailableRam);

        let predictedMoneyPercent = this.getMoneyPercentAtTime(endTime);

        for (let i = 0; i < botnet.length; i++) {
            let idealthreadCount = this.getIdealHackThreads(predictedMoneyPercent);
            if (predictedMoneyPercent < HACK_IF_OVER) break;
            if (idealthreadCount <= 0) break;

            let bot = botnet[i];
            let maxThreads = bot.getMaxThreads(HACK_SCRIPT);
            let threads = Math.min(maxThreads, idealthreadCount);
            if (threads > 0) {
                let secEffect = this.getHackSecEffect(threads);
                let moneyMultiplier = this.getHackMoneyMultiplier(threads);
                this.ns.exec(scriptName, bot.getHostname(), threads, this.getHostname(), this.hackID++);
                this.tm.push(new Task(bot.getHostname(), this.getHostname(), scriptName, secEffect, moneyMultiplier, endTime, threads));
                predictedMoneyPercent = this.getMoneyPercentAtTime(endTime + 1);
            }
        }
    }

    report(server)
    {
        let tasks = this.tm.getTasks();
        let wt = 0;
        let gt = 0;
        let ht = 0;
        let securityDelta = this.getSecurityDelta();
        let predictedDelta = this.getSecDeltaAtTime(Number.MAX_VALUE);
        let predictedPercentFull = this.getMoneyPercentAtTime(Number.MAX_VALUE) * 100;
        for(let i = 0; i < tasks.length; i++)
        {
            let task = tasks[i];
            wt += task.getWeakenThreads();
            gt += task.getGrowThreads();
            ht += task.getHackThreads();
        }
        let currentMoney = this.getCurrentMoney() / 1000000;
        let maxMoney = this.getMaxMoney() / 1000000;
        let percentFull = (currentMoney / maxMoney) * 100;
        
        let taskEndTime = 0;
        if(tasks.length > 0)
        {
            taskEndTime = (tasks[0].endTime - this.ns.getTimeSinceLastAug())/1000;
        }

        this.ns.print(
            this.ns.sprintf("%7d |%7d |%7d |", wt, gt, ht) + 
            this.ns.sprintf(" %8.2f | %6.2f%% | %6.2f%% |", maxMoney, percentFull, predictedPercentFull) +
            this.ns.sprintf(" %6.2f | %6.2f |", securityDelta, predictedDelta) +
            this.ns.sprintf(" %5.2f%% |", this.getHackChance()*100) + 
            this.ns.sprintf(" %7.0f | %s", taskEndTime, this.getHostname())
            );
    }
}
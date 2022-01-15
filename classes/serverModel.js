var gns;

export class Server {
    constructor(ns, name){
        this.ns = ns;
        this.name = name;
        this.secMin = ns.getServerMinSecurityLevel(this.name);
        this.moneyMac = ns.getServerMaxRam(this.name);
        this.activeTasks = [];
        this.cores = 1;
        this.homeCores = 3;
        gns = ns;
    }

    get RamMax(name) { return ns.getServerMaxRam(name); }
    get RamRemaining(name) { return this.ramMax - this.ns.getServerRam(name); }

    get SecMin() { return this.secMin; }
    get SecDelta() { return ns.getServerSecurityLevel(this.name) - this.secMin; }

    get MaxThreads(scriptname, host)
    {
        return this.RamRemaining(host) / this.ns.getScriptRam(scriptname, "home");
    }

    get currentTime() { return this.ns.getTimeSinceLastAug(); }

    get SecDeltaPredicted(endTime)
    {
        var predictedSecDelta = this.SecDelta();
        for( var i = 0; i < this.activeTasks.length; i++)
        {
            var task = this.activeTasks[i];
            if(task.endTime < endTime)
            {
                predictedSecDelta += task.secEffect;
            }
        }
        return predictedSecDelta;
    }

    Weaken(host, cores) {
        var secPerThread = this.ns.weakenAnalyze(1,cores);
        var weakenEndTime = this.ns.getWeakenTime(host) + currentTime;
        var secDelta = this.SecDeltaPredicted(weakenEndTime);
        var idealWeakenThreads = secDelta / secPerThread;
        var weakenThreads = Math.min(idealWeakenThreads, this.MaxThreads("weaken.js", "home"));
        var sacEffect = this.ns.weakenAnalyze(weakenThreads, cores);

        this.ns.exec("weaken.js", host, weakenThreads, WeakenIdMaker());
        var task = new Task(this.name, "weaken", -sacEffect, 0, weakenEndTime, weakenThreads);
        return task;
    }

    GetWeakenThreads(cores)
    {
        var secPerThread = this.ns.weakenAnalyze(1,cores);
        var weakenEndTime = this.ns.getWeakenTime(this.name) + currentTime;
        var secDelta = this.SecDeltaPredicted(weakenEndTime);
        return secDelta / secPerThread;
    }

    * WeakenIdMaker() {
        var index = 0;
        while (true)
            yield index++;
    }
}

class TaskManager {
    constructor(ns) {
        this.ns = ns;
        this.tasklist = [];
    }

    push(task)
    {
        this.tasklist.push(task);
        for(var i = 0; i < this.tasklist.length; i++)
        {
            if(isComplete(this.tasklist[i]))
            {
                
            }
        }
    }
}

class Task{
    constructor(server, script, secEffect, moneyEffect, endTime, threads)
    {
        this.server = server;
        this.script = script;
        this.secEffect = secEffect;
        this.moneyEffect = moneyEffect;
        this.endTime = endTime;
        this.threads = threads;
        this.startTime = gns.getTimeSinceLastAug();
    }

    constructor(server, script, threads);
    {
        this.server = server;
        this.script = script;
        this.threads = threads;

    }
}
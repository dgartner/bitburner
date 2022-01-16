const home = "home";
const HACKER_SCRIPT = "hack.js";
const WEAKEN_SCRIPT = "weaken.js";
const GROW_SCRIPT = "grow.js";

const EXE_BRUTE_SSH = "BruteSSH.exe";
const EXE_FTP_CRACK = "FTPCrack.exe";

const AGENT_READY = "ready";
const AGENT_HACK = "hacking";
const AGENT_GROW = "growing";
const AGENT_WEAK = "weaking";

const AGENT_STATUS_LIST = [AGENT_READY, AGENT_HACK, AGENT_GROW, AGENT_WEAK];
const FIRST_NAMES = ["Smith", "Sammy", "Terry", "Linda", "Jenni", "John", "Jake", "Jackson", "Andrew", "Tyler", "Kevin", "David", "Jessica", "Matthew", "Alyssa", "Juniper", "Kayla", "Ryan", "Stevie", "Evalyn", "Kris", "Noelle", "Susie", "Thomas"];   
const LAST_NAMES = ["Smithson", "Grover", "Stenn", "Brakken", "Sinner", "Farce", "Drummer", "Steward", "Seventhson", "Lyrre", "Trescent", "Canters", "Ik-thu", "Vorpal", "Barranor", "Storm", "Sky", "Winters", "Steel", "Carver"];

const FIRST_NAME_LENGTH = FIRST_NAMES.length;
const LAST_NAME_LENGTH = LAST_NAMES.length;

const AGENT_COST = 1.8;

const ARMY_FIELD_REPORT_PORT = 1;
const AGENT_DROPPOINT = 2;

class Agent
{
    constructor(name, homeworld, status, readyTime)
    {
        this.name = name;
        this.homeworld = homeworld;
        this.readyTime = readyTime;

        // Set detault status
        if (!status)
            status = AGENT_READY;

        this.status = status;
    }

    startOperation(readyTime)
    {
        this.readyTime = readyTime;
    }

    getReadyTime()
    {
        return this.readyTime;
    }

    readyUp()
    {
        this.status = AGENT_READY;
    }

    setStatus(status)
    {
        this.status = status;
    }

    getHomeworld()
    {
        return this.homeworld;
    }

    getName()
    {
        return this.name;
    }

    getStatus()
    {
        return this.status;
    }
}

async function buildHomeworlInfrastructure(ns, homeworld)
{
        // Prepare with infernal arms
        await ns.scp(HACKER_SCRIPT, homeworld);
        await ns.scp(WEAKEN_SCRIPT, homeworld);
        await ns.scp(GROW_SCRIPT, homeworld);
}

class Army
{
    // I think the agents list might be useless here
    constructor(ns, agents)
    {
        this.ns = ns;

        this.agents = agents;
        this.operationCount = 0;
    }

    getAgents()
    {
        return this.agents;
    }

    getNextOperationId()
    {
        return this.operationCount++;
    }

    getFieldReport()
    {
        let report = new Array();
        report[AGENT_READY] = new Array();
        report[AGENT_HACK] = new Array();
        report[AGENT_GROW] = new Array();
        report[AGENT_WEAK] = new Array();

        let rawData = this.ns.peek(ARMY_FIELD_REPORT_PORT);
        let reportData = JSON.parse(rawData);

        let reportKeys = Object.keys(reportData);
        for (var i = 0; i < reportKeys.length; i++)
        {
            let reportItem = reportData[i];

            let name = reportItem['name'];
            let homeworld = reportItem['homeworld'];
            let status = reportItem['status'];

            let currentTime = ns.getTimeSinceLastAug();

            let agent = new Agent(name, homeworld, status, currentTime);
            
            report[status].push(agent);
        }

        let agentsReady = report[AGENT_READY];
        let agentsHacking = report[AGENT_HACK];
        let agentsGrowing = report[AGENT_GROW];
        let agentsWeakening = report[AGENT_WEAK];

        let reportSummary = "\nAgent Summary: ";
        reportSummary = reportSummary + "\n\tReady";
        for (var i = 0; i < agentsReady.length; i++)
        {
            let agent = agentsReady[i];
            reportSummary = reportSummary + "\n\t\t" + agent.getName() + " (" + agent.getHomeworld() + ")";
        }

        reportSummary = reportSummary + "\n\tHacking";
        for (var i = 0; i < agentsHacking.length; i++)
        {
            let agent = agentsHacking[i];
            reportSummary = reportSummary + "\n\t\t" + agent.getName() + " (" + agent.getHomeworld() + ")";
        }

        reportSummary = reportSummary + "\n\tGrowing";
        for (var i = 0; i < agentsGrowing.length; i++)
        {
            let agent = agentsGrowing[i];
            reportSummary = reportSummary + "\n\t\t" + agent.getName() + " (" + agent.getHomeworld() + ")";
        }

        reportSummary = reportSummary + "\n\tWeakening";
        for (var i = 0; i < agentsWeakening.length; i++)
        {
            let agent = agentsWeakening[i];
            reportSummary = reportSummary + "\n\t\t" + agent.getName() + " (" + agent.getHomeworld() + ")";
        }

        this.ns.tprint(reportSummary);

        return reportSummary;
    }

    // Discontinued in favor of filters
    getAvailableAgents()
    {
        let availableAgents = new Array();

        for (var i = 0; i < this.agents.length; i++)
        {
            let agent = this.agents[0];

            let agentStatus = agent.getStatus();

            if (agentStatus == AGENT_READY)
                availableAgents.push(agent);
        }

        this.ns.tprint("There are " + availableAgents.length + " agents at the ready.");

        return availableAgents;
    }
}

class Operation
{
    constructor(target, action)
    {
        this.target = target;
        this.action = action;
    }

    getTarget()
    {
        return this.target;
    }

    getAction()
    {
        return this.action;
    }
}

async function raiseArmy(ns, realms)
{
    ns.tprint("Preparing my legions.");

    let agentList = new Array();
    let agentCount = 0;

    for (var homeworldId = 0; homeworldId < realms.length; homeworldId++)
    {
        ns.tprint("\tSearching for homeworlds in sector " + homeworldId);

        let homeworldName = realms[homeworldId];
        ns.tprint("\tIdentified suitable homeworld...");
        ns.tprint("\t\tHomeworld Name: " + homeworldName);

        let maxOverhead = ns.getServerMaxRam(homeworldName);
        let currentOverhead = ns.getServerUsedRam(homeworldName);
        let availableOverhead = maxOverhead - currentOverhead;
        
        let homeworldCapacity = Math.floor(availableOverhead / AGENT_COST);
        ns.tprint("\t\tMaximum Overhead: " + maxOverhead);
        ns.tprint("\t\tCurrent Overhead: " + currentOverhead);
        ns.tprint("\t\tAvailable Overhread: " + availableOverhead);
        ns.tprint("\t\tHomeworld capacity: " + homeworldCapacity);

        // let homeworld = new Homeworld(ns, homeworldName, homeworldId, homeworldCapacity);

        ns.tprint("\t\tBuilding infrastructure...");
        await buildHomeworlInfrastructure(ns, homeworldName);

        ns.tprint("\t\tCommissioning agents...");
        let agents = commisionAgents(ns, homeworldName, homeworldCapacity);

        ns.tprint("\t\tAdding agents to army...");
        for (var k = 0; k < agents.length; k++)
        {
            let agent = agents[k];
            ns.tprint("\t\t\tAgent " + k + ": " + agent.getName());

            agentList[agentCount++] = agent;
        }

        // ns.tprint("\t\tDeploying legion...");
        // let legion = new Legion(ns, homeworld, agents);
        // await legion.enscribeAgentStatus();
        ns.tprint("\Homeworld recruitment complete.");
    }

    // TODO No longer using field reports.
    // ns.tprint("\nSubmitting initial field report...");
    // let fieldReport = JSON.stringify(agentList);
    // await ns.clearPort(ARMY_FIELD_REPORT_PORT);
    // await ns.writePort(ARMY_FIELD_REPORT_PORT, fieldReport);

    let army = new Army(ns, agentList);
    return army;
}

function commisionAgents(ns, homeworld, count)
{
    let agents = Array(count);
    for (var i = 0; i < count; i++)
    {
        let agentName = findAgent();

        let agent = new Agent(agentName, homeworld, AGENT_READY, ns.getTimeSinceLastAug());
        agents[i] = agent;
    }

    return agents;
}

// TODO Agent manager with unique names
    // Concern: Need to handle names running out

function findAgent()
{
    let firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAME_LENGTH)];
    let lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAME_LENGTH)];

    let name = firstName + " " + lastName;

    return name;
}

/** @param {NS} ns **/
export async function main(ns) 
{
    ns.tprint("It begins.");
    let myRealms = ns.getPurchasedServers();

    let depth = ns.args[0];
    if (!depth)
    {
        ns.tprint("Using default depth (1)");
        depth = 1;
    }

    let protectedRealm = ns.args[1];
    
    if(protectedRealm)
        myRealms.push(protectedRealm);

    ns.tprint("Raising an army");
    let army = await raiseArmy(ns, myRealms);

    ns.tprint("Army size: " + army.getAgents().length);

    let targetSet = runScan(ns, myRealms, depth);
    let targetList = setToList(targetSet);

    ns.tprint("Test main loop");
    await mainLoop(ns, targetList, army);
}

// TODO VERY TODO
function determineNextOps(targetList)
{
    let ops = new Operation("n00dles", AGENT_WEAK);
    return ops;
}

function agentReadyFilter(agent)
{
    return agent.getReadyTime() <= this;
}

function agentNotReadyFilter(agent)
{
    return agent.getReadyTime() > this;
}

function isAgentReady(agent, currentTime)
{
    return agent.getReadyTime() >= currentTime;
}

function agentSort(left, right)
{
    return left.getReadyTime() - right.getReadyTime();
}

async function mainLoop(ns, targetList, army)
{
    var loopCount = 0;

    while(true)
    {
        ns.tprint("Planning...");
        let currentTime = ns.getTimeSinceLastAug();

        ns.tprint("\tCurrent Time: " + currentTime);
        
        let agents = army.getAgents();
        ns.tprint("\tTotal Agents: " + agents.length);
        for (var i = 0; i < agents.length; i++)
        {
            ns.tprint("Agent time: " + agents[i].getReadyTime());
        }

        let availableAgents = agents.filter(agentReadyFilter, currentTime);
        ns.tprint("Available Agents: " + availableAgents.length);

        for(var i = 0; i < availableAgents.length; i++)
        {
            let agent = availableAgents[i];
        
            ns.tprint("Agent start");
            let operation = determineNextOps(targetList);

            let action = operation.getAction();
            let target = operation.getTarget();

            let operationId = army.getNextOperationId();

            let agentHomeworld = agent.getHomeworld();

            let scriptName = "theFuck.js";
            switch(action)
            {
                case AGENT_HACK:
                    scriptName = HACKER_SCRIPT;
                break;
                case AGENT_GROW:
                    scriptName = GROW_SCRIPT;
                break;
                case AGENT_WEAK:
                    scriptName = WEAKEN_SCRIPT;
                break;
                default: 
                    ns.tprint("The fuck?");
            }

            ns.tprint("Operation Details");
            ns.tprint("\tAgent: " + agent.getName() + " (" + agent.getHomeworld() + ")");
            ns.tprint("\tAction: " + action + " (" + scriptName + ")");
            ns.tprint("\tTarget: " + target)

            agent.setStatus(action);
            ns.exec(scriptName, agentHomeworld, 1, target, AGENT_DROPPOINT, operationId);
            ns.tprint("Executed!");

            await ns.sleep(100);
            let operationTime = await ns.readPort(AGENT_DROPPOINT);
            ns.tprint("\tDuration: " + operationTime);
            agent.startOperation(currentTime + operationTime);
        }

        ns.tprint("Iteration " + loopCount++ + " complete");
        
        // TODO - Remove DEBUG
        if (loopCount > 5)
            break;

        await ns.sleep(1 * 1000);
    }

    ns.tprint("Current time" + ns.getTimeSinceLastAug());
    let agents = army.getAgents();
    ns.tprint("\tTotal Agents: " + agents.length);
    for (var i = 0; i < agents.length; i++)
    {
        ns.tprint("Agent time: " + agents[i].getReadyTime());
    }
    
    let availableAgents = agents.filter(agentReadyFilter, ns.getTimeSinceLastAug());
    ns.tprint("Available Agents: " + availableAgents.length);

}

function portCheck(ns, server)
{
    let target = server.hostname;

    if (ns.fileExists(EXE_BRUTE_SSH, home))
    {
        if(!server.sshPortOpen)
        {
            ns.tprint("[" + target + "] Opening SSH Port...");
            ns.brutessh(target);
        }
    }

    if(ns.fileExists(EXE_FTP_CRACK, home))
    {
        if(!server.ftpPortOpen)
        {
            ns.tprint("[" + target + "] Opening FTP Port...");
            ns.ftpPortOpen(target);
        }
    }
}

function determineAction(ns, target)
{
    let server = ns.getServer(target);

    portCheck(ns, server);
    
    let difficulty = server.hackDifficulty - server.minDifficulty;
    let moneyPercent = server.moneyMax / server.moneyAvailable;
    
    // TODO This is a wild shot in the dark
    let action = AGENT_READY;
    if (difficulty > 10)
        action = AGENT_WEAK;
    else if (moneyPercent > 0.85)
        action = AGENT_HACK;
    else 
        action = AGENT_GROW;
    
    return action;
}

function setToList(mySet)
{
    let returnArray = new Array();
    let iter = mySet.values();

    while(true)
    {
        let item = iter.next();
        let value = item.value;
        let done = item.done;

        returnArray.push(value);

        if(done)
            break;
    }

    return returnArray;
}

function runScan(ns, myRealms, depth)
{
    let targets = new Set();

    var startingPoint = new Set();
    startingPoint.add(home);

    for (var i = 0; i < depth; i++)
    {
        let newTargets = findTargets(ns, startingPoint, myRealms);

        let newTargetIter = newTargets.values();
        while(true)
        {
            let item = newTargetIter.next();
            let value = item.value;
            let done = item.done;

            targets.add(value);
            startingPoint.add(value);

            if (done)
                break;
        }
    }

    ns.tprint("Target List");
    let targetIter = targets.values();
    while(true)
    {
        let item = targetIter.next();
        let value = item.value;
        let done = item.done;

        ns.tprint("\t" + value);

        if(done)
            break;
    }

    return targets;
}

function findTargets(ns, startingPoints, myRealms)
{
    let targets = new Set();

    ns.tprint("Scanning mode activated.");
    ns.tprint("\tNumber of starting points: " + startingPoints.size);
    let iter = startingPoints.values();

    while(true)
    {
        let item = iter.next();

        let startingPoint = item.value;
        ns.tprint("\tScanning " + startingPoint);

        // Add starting point to list if applicable
        if(!myRealms.includes(startingPoint))
            targets.add(startingPoint);

        var scanResults = ns.scan(startingPoint);
        for (var k = 0; k < scanResults.length; k++)
        {
            var target = scanResults[k];

            if(!myRealms.includes(target))
            {
                if(!targets.has(target))
                {
                    ns.tprint("\t\tFound " + target);
                    targets.add(target);
                }                
            }    
        }

        if(item.done)
            break;
    }

    return targets;
}
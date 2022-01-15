const home = "home";
const hackerScript = "hack.js";
const weakenScript = "weaken.js";
const growScript = "grow.js";

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

const AGENT_COST = 1.75;

const ARMY_FIELD_REPORT_PORT = 1;

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
}

async function buildHomeworlInfrastructure(ns, homeworld)
{
        // Prepare with infernal arms
        await ns.scp(hackerScript, value);
        await ns.scp(weakenScript, value);
        await ns.scp(growScript, value);
}

class Army
{
    // I think the agents list might be useless here
    constructor(ns, agents)
    {
        this.ns = ns;

        this.agentCount = 0;
        this.agents = agents;
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

    getAvailableAgents()
    {
        let availableAgents = new Array();

        let rawData = this.ns.peek(ARMY_FIELD_REPORT_PORT);
        let reportData = JSON.parse(rawData);

        let reportKeys = Object.keys(reportData);
        for (var i = 0; i < reportKeys.length; i++)
        {
            let reportItem = reportData[i];

            let name = reportItem['name'];
            let homeworld = reportItem['homeworld'];
            let status = reportItem['status'];

            if (status == AGENT_READY)
            {
                let agent = new Agent(name, homeworld, status);
                availableAgents.push(agent);
            }
        }

        this.ns.tprint("There are " + availableAgents.length + " agents at the ready.");

        return availableAgents;
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
        ns.tprint("\t\tHomeworld capacity: " + homeworldCapacity);

        // let homeworld = new Homeworld(ns, homeworldName, homeworldId, homeworldCapacity);

        ns.tprint("\t\tBuilding infrastructure...");
        buildHomeworlInfrastructure(ns, homeworldName);

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

    ns.tprint("\nSubmitting initial field report...");
    let fieldReport = JSON.stringify(agentList);

    await ns.clearPort(ARMY_FIELD_REPORT_PORT);
    await ns.writePort(ARMY_FIELD_REPORT_PORT, fieldReport);

    let army = new Army(ns, agentList);
    return army;
}

function commisionAgents(ns, homeworld, count)
{
    ns.tprint("Enter");
    let agents = Array(count);
    for (var i = 0; i < count; i++)
    {
        ns.tprint("loop: " + i);
        let agentName = findAgent();

        let agent = new Agent(agentName, homeworld);
        agents[i] = agent;
    }

    ns.tprint("Exit");
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

    ns.tprint("Preparing my legions");
    let army = await raiseArmy(ns, myRealms);

    army.getFieldReport();

    let targetList = runScan(ns, myRealms, depth);

    let availableAgents = army.getAvailableAgents();
}

function mainLoop(ns, targetSet, army)
{
    let availableAgents = army.getAvailableAgents();
    let targetList = setToList(targetSet);

    for (var i = 0; i < targetList.length; i++)
    {
        let targetName = targetList[i];
        ns.tprint("Processing target: " + targetName);
        
        // Reset position if we're at the end
        if (i == targetList.length)
            i = 0;


        // TODO Have to update this to use the port comms for how long before agent is ready again
        let action = determineAction(targetName);

        // Call exec
        // Read port to get time
        // Set timer until agent is available



        if (action != AGENT_READY)
        {
            let agent = availableAgents.shift();

            // TODO Send agent off.
            // TODO Update Status
            // TODO Add logic to put agent back at the ready when their job is complete

            // TODO Can I run the same script with different parameter names?
                // Looks like only with different numbers of parameters
        }
        
    }

    let plannedActions = processTargets(ns, targetList);
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

async function processTargets(ns, targetList)
{
    let iter = targetList.values();

    

    
}

class Target
{
    constructor(name, action)
    {
        this.name = name;
        this.action = action;
    }

    getName()
    {
        return this.name;
    }

    getAction()
    {
        return this.action;
    }
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


function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
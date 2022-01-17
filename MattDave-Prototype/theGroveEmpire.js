const home = "home";
const HACKER_SCRIPT = "hack.js";
const WEAKEN_SCRIPT = "weaken.js";
const GROW_SCRIPT = "grow.js";

const EXE_BRUTE_SSH = "BruteSSH.exe";
const EXE_FTP_CRACK = "FTPCrack.exe";
const EXE_HTTP_HACK = "HTTPWorm.exe";
const EXE_SMTP_HACK = "relaySMTP.exe";
const EXE_SQL_HACK = "undefined";

const AGENT_READY = "ready";
const AGENT_HACK = "hacking";
const AGENT_GROW = "growing";
const AGENT_WEAK = "weaking";
const AGENT_NOT_APPLICABLE = "N/A";

const AGENT_STATUS_LIST = [AGENT_READY, AGENT_HACK, AGENT_GROW, AGENT_WEAK];
const FIRST_NAMES = ["Smith", "Sammy", "Terry", "Linda", "Jenni", "John", "Jake", "Jackson", "Andrew", "Tyler", "Kevin", "David", "Jessica", "Matthew", "Alyssa", "Juniper", "Kayla", "Ryan", "Stevie", "Evalyn", "Kris", "Noelle", "Susie", "Thomas"];   
const LAST_NAMES = ["Smithson", "Grover", "Stenn", "Brakken", "Sinner", "Farce", "Drummer", "Steward", "Seventhson", "Lyrre", "Trescent", "Canters", "Ik-thu", "Vorpal", "Barranor", "Storm", "Sky", "Winters", "Steel", "Carver"];

const FIRST_NAME_LENGTH = FIRST_NAMES.length;
const LAST_NAME_LENGTH = LAST_NAMES.length;

// TODO Minor optimization with hack scripts costing .05 less ram
const AGENT_COST = 1.75;

const ARMY_FIELD_REPORT_PORT = 1;
const AGENT_DROPPOINT = 2;
const NUM_THREADS = 1;

// TODO | currently 1 minutes
const OPERATION_MAX_RUNTIME = 1 * 60 * 1000; 
const OPERATION_HARD_STOP_RUNTIME = 10 * 60 * 1000

/** @param {NS} ns **/
export async function main(ns) 
{
    ns.print("It begins.");
    let myRealms = ns.getPurchasedServers();

    let depth = ns.args[0];
    if (!depth)
    {
        ns.print("Using default depth (1)");
        depth = 1;
    }

    let protectedRealm = ns.args[1];

    ns.print("Identifying targets...");
    let targetSet = runScan(ns, myRealms, depth);
    let targetList = setToList(targetSet);
    
    if(protectedRealm)
        myRealms.push(protectedRealm);

    ns.print("Raising an army");
    let army = await raiseArmy(ns, myRealms, targetList);

    ns.print("Army size: " + army.getAgents().length);



    let serverDataList = runServerAnalysis(ns, targetList, myRealms);
    ns.print("Server Data: " + JSON.stringify(serverDataList));

// Pretty sure this was just for testing
    // serverDataList.sort(sortServerByMaxMoney);
    // ns.print("\n\nSorted Server Data: " + JSON.stringify(serverDataList));

    ns.print("Test main loop");
    await mainLoop(ns, serverDataList, army, myRealms);
}

/** @param {NS} ns
 * @param {Array<ServerData>} targetList
 * @returns {Array<ServerData>}
 */
function prioritizeTargets(ns, targetList)
{
    ns.print("Target Count: " + targetList.length);
    let servers = targetList.filter(filterServersWithoutMoney);

    ns.print("Targets with Money: " + servers.length);

    // TODO Better sort, really now
    servers.sort(sortServerByMaxMoney);
    
    return servers;
}

/** @param {NS} ns
 * @param {String} target
 * @param {String} action
 */
function determineActionDuration(ns, target, action)
{
    let duration = null
    switch(action)
    {
        case AGENT_HACK:
            duration = ns.getHackTime(target);
        break;
        case AGENT_GROW:
            duration = ns.getGrowTime(target);
        break;
        case AGENT_WEAK:
            duration = ns.getWeakenTime(target);
        break;
    }

    return duration;
}

/** @param {ServerData} serverData */
function filterTargetsWithOngoingOperations(serverData)
{
    // Only return targets that aren't in the ongoing ops list that will be passed in
    return !this.includes(serverData.hostname);
}

/** @param {Operation} left
 * @param {Operation} right
 */
function sortByCompletionTime(left, right)
{
    return left.operationCompletion - right.operationCompletion;
}

/** @param {Operation} operation */
function filterByNotComplete(operation)
{
    return operation.operationCompletion > this;
}

/** @param {NS} ns
 * @param {Array<ServerData>} targetList
 * @param {Army} army
 * @param {Array<ServerData>} myRealms
 */
async function mainLoop(ns, targetList, army, myRealms)
{
    var loopCount = 0;
    var actionId = 0;

    let ongoingOperations = new Array();

    while(true)
    {
        ns.tprint(ns.sprintf("Outer loop count: %d", ++loopCount));

        ns.print("Planning...");
        let agents = army.getAgents();
        ns.print("\tAgent Data");
        // ns.tprint("\t\tTotal Agents: " + agents.length);

        ns.print("\tIdentifying operations in progress...");
        let curTime = ns.getTimeSinceLastAug();
        // let alreadyTargetted = new Array();
        // for (var i = 0; i < agents.length; i++)
        // {
        //     await ns.sleep(10);
        //     let agent = agents[i];

        //     // Only consider agents who are actually out in the field.
        //     if (agent.getReadyTime() > curTime)
        //     {
        //         let agentTarget = agent.getCurrentTarget();
        //         if (agentTarget)
        //         {
        //             if (!alreadyTargetted.includes(agentTarget))
        //             {
        //                 // ns.tprint("\t\tAlready targetting: " + agentTarget);
        //                 alreadyTargetted.push(agentTarget);
        //             }  
        //         }
        //     }
        // }

        // Filter out any targets with ongoing operations
        // let totalTargets = targetList.length;
        // let filteredTargetsList = targetList.filter(filterTargetsWithOngoingOperations, alreadyTargetted);
        
        // let availableTargets = totalTargets.length;
        // ns.tprint("\tTargets without Operations: " + availableTargets + " of " + totalTargets);

        let availableTargetNames = new Array();
        for (var i = 0; i < targetList.length; i++)
        {
            // ns.print("DEBUG (" + i + "): " + filteredTargetsList[i].getHostname());
            availableTargetNames.push(targetList[i].getHostname());
        }
            
        if (availableTargetNames.length == 0)
        {
            // TODO Add logic to give agents something to do here.
            ns.print("\t\t[TEMPORARY CODE] Waiting for available targets...");
            await ns.sleep(10 * 1000);
            continue;
        }

        ns.print("\tRefreshing target Data...");

        let unprocessedTargetList = runServerAnalysis(ns, availableTargetNames, myRealms);
        // ns.print("Unprocessed Targets: " + JSON.stringify(unprocessedTargetList));

        let prioritizedTargetList = prioritizeTargets(ns, unprocessedTargetList);
        // ns.print("Prioritized targets: " + JSON.stringify(prioritizedTargetList));

        // ns.tprint(JSON.stringify(prioritizedTargetList));
        let availableTargetsList = prioritizedTargetList.filter(filterUnavailableTargets);

        ongoingOperations.sort(sortByCompletionTime);
        ongoingOperations = ongoingOperations.filter(filterByNotComplete, ns.getTimeSinceLastAug());

        ns.print("Ongoing Assignments:");
        for (var i = 0; i < ongoingOperations.length; i++)
        {
            let ongoingOp = ongoingOperations[i];
            let completionTime = ongoingOp.getOperationCompletion();
            let remainingTime = completionTime - curTime;
            let remainingTimeMinutes = remainingTime / 1000 / 60;

            report = [];
            report['Target'] = ongoingOp.getTarget();
            report['Agents Assigned'] = ongoingOp.getAgentsRequired();
            report['Remaining Time'] = remainingTimeMinutes;

            ns.print(ns.sprintf("Operation Report: %s", JSON.stringify(report)));
        }

        let curTargets = new Array();
        for (var i = 0; i < ongoingOperations.length; i++)
            curTargets.push(ongoingOperations[i].getTarget());

        // Restart if no available targets
        if (curTargets.length == targetList.length)
        {
            ns.print("Waiting 60 seconds for new targets...");
            await ns.sleep(60 * 1000);
            continue;
        }

        // Find next operation. If none available in the time allowed, add a minute to the time allowed
        let currentOperation = null;
        let currentMaxOperationDuration = OPERATION_MAX_RUNTIME;
        while(true)
        {


            for (var i = 0; i < availableTargetsList.length; i++)
            {
                let currentTarget = availableTargetsList[i];

                // Skip if target is already undergoing an op
                if (curTargets.includes(currentTarget))
                    continue;

                let checkOperation = determineActionForServer(ns, currentTarget);

                // ns.tprint("Checking operation: " + JSON.stringify(checkOperation));

                if (checkOperation.getOperationDuration() <= currentMaxOperationDuration)
                {
                    currentOperation = checkOperation;
                    // ns.tprint("\nValid operation found.");
                    break;
                }
            }

            // Add a minute to the allowable time if no operations were found.
            if (!currentOperation)
            {
                currentMaxOperationDuration = currentMaxOperationDuration + (60 * 1000);

                if (currentMaxOperationDuration > OPERATION_HARD_STOP_RUNTIME)
                {
                    ns.print("Will not allow operations to exceed 10 minutes. Sleeping for 1 minute then restarting.");
                    await ns.sleep(60 * 1000);
                    break;
                }
            }
            else
                break;

            // Safety sleep
            await ns.sleep(1000);
        }
        
        if (!currentOperation)
        {
            ns.print("Forcing a reload after 1 minute");
            await ns.sleep(60 * 1000);
            continue;
        }
        
        ongoingOperations.push(currentOperation);

        let agentsRequiredForOps = currentOperation.getAgentsRequired();
        let agentsCommittedToOps = 0;
        
        // Work an op to completion
        while(agentsCommittedToOps < agentsRequiredForOps)
        {
 


            let currentTime = ns.getTimeSinceLastAug();
            // ns.print("\tCurrent Time: " + currentTime);

            let availableAgents = agents.filter(agentReadyFilter, currentTime);
            // ns.print("\t\tAvailable Agents: " + availableAgents.length);

            for(var i = 0; i < availableAgents.length; i++)
            {
                // It is necessary to throttle the script
                // 10 seems to work fine
                let delay = 2;

                // ns.print("Delaying " + delay + "ms");
                await ns.sleep(delay);
                
                // DEBUG log
                // ns.print("\tDEBUG: Agent start");

                currentTime = ns.getTimeSinceLastAug();
                // ns.print("\tCurrent Time: " + currentTime);

                let agent = availableAgents[i];
                let agentName = agent.getName();
                let agentHomeworld = agent.getHomeworld();
            
                let operationTarget = currentOperation.getTarget();
                let operationAction = currentOperation.getAction();
                let operationScript = currentOperation.getActionScript();
                let operationDuration = determineActionDuration(ns, operationTarget, operationAction);
                let operationTimeInSeconds = operationDuration / 60;
                let operationCompletionTime = currentTime + operationDuration;
                let operationActionId = actionId++;

                agentsCommittedToOps++;

                ns.print("\tOperation Details");
                ns.print("\t\tAgent: " + agentName + " (" + agentHomeworld + ")");
                ns.print("\t\tAgents Committed (" + agentsCommittedToOps + " of " + agentsRequiredForOps + ")");
                ns.print("\t\tTarget: " + operationTarget);
                // ns.print("\t\tAction (ID " + operationActionId + "): " + operationAction + " (" + operationScript + ")");
                ns.print(ns.sprintf("\t\tDuration in seconds: %d (Completion time: %d)", operationTimeInSeconds, operationCompletionTime));
            
                ns.exec(operationScript, agentHomeworld, NUM_THREADS, operationTarget, operationActionId);

                // The time difference between calculating completion time and this code /probably/ won't matter.
                agent.assignFieldWork(operationTarget, operationCompletionTime);

                // ns.print("Agent Deployed!");

                

                // Skip wait if we have fulfilled the current op
                if (agentsCommittedToOps >= agentsRequiredForOps)
                {
                    ns.print("Operation completely underway!");
                    break;
                }
            } 

            // Skip wait if we have fulfilled the current op
            if (agentsCommittedToOps >= agentsRequiredForOps)
            {
                ns.print("Operation completely underway!");
                break;
            }

            let sleepTime = 5;
            ns.print("Waiting " + sleepTime + " seconds for new agents to become available.");
            await ns.sleep(sleepTime * 1000);
        }

        ns.print("Operation fulfilled, identifying next operation");
    }
        

}

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

    /** @param {String} target
     * @param {Number} readyTime
     */
    assignFieldWork(target, readyTime)
    {
        this.target = target;
        this.readyTime = readyTime;
    }

    /** @returns {String} */
    getCurrentTarget() { return this.target; };

    /** @param {Number} readyTime */
    setReadyTime(readyTime) { this.readyTime = readyTime; }

    /** @returns {Number} */
    getReadyTime() { return this.readyTime; }

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

/** @param {ServerData} */
function filterUnavailableTargets(serverData)
{
    return serverData.hasAdminRights;
}

/** @param {String} */
function filterInvalidHosts(hostname)
{
    let returnValue = false;
    if(hostname)
        returnValue = true;

    return returnValue;
}

/** @param {ServerData} server */
function filterServersWithoutMoney(server)
{
    return server.getCurrentMoney != 0;
}

/** @param {ServerData} left
 * @param {ServerData} right
 */
function sortServerByMaxMoney(left, right)
{
    return right.maxMoney - left.maxMoney;
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

    /** @returns {Agent} */
    getAgents() { return this.agents; }

    /** @returns {Number} */
    getNextOperationId() { return this.operationCount++; }

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

        this.ns.print(reportSummary);

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

        this.ns.print("There are " + availableAgents.length + " agents at the ready.");

        return availableAgents;
    }
}

/** @param {NS} ns
 * @param {ServerData} serverData
 * @returns {Operation}
 */
function determineActionForServer(ns, serverData)
{
    let operation = null;
    
    if (!serverData.isHackable)
    {
        operation = new Operation(serverData.getHostname(), AGENT_NOT_APPLICABLE, 0, 0);
    }
    else if (serverData.getCurrentMoney() == 0)
    {
        // Ignore anything without money
        operation = new Operation(serverData.getHostname(), AGENT_NOT_APPLICABLE, 0, 0);
    }
    else
    {
        // First check security
        // TODO Actual weakening logic
        let securityDelta = serverData.getCurrentSecurity() - serverData.getMinSecurity();
        if (securityDelta > 5) // Super TODO, also magic number :)
        {
            // Brief testing shows threadcount scales linearly so that's nice.
            let threadCount = 1;
            let coreCount = 1; // TODO Eventually we'll need to get the number of core's we're running on.
            let weakenAnalysis = ns.weakenAnalyze(threadCount, coreCount);

            if (weakenAnalysis == 0)
            {
                ns.print("[" + serverData.getHostname() + "] Weaken ineffective, skipping this for now.");
                operation = new Operation(serverData.getHostname(), AGENT_NOT_APPLICABLE, 0, 0);
            }
            else
            {
                let requiredWeakenCount = Math.floor(securityDelta / weakenAnalysis)
                let operationDuration = ns.getWeakenTime(serverData.getHostname());
                operation = new Operation(serverData.getHostname(), AGENT_WEAK, requiredWeakenCount, operationDuration);
            }
        }
        else
        {
            // Security is good, hack or grow
            // TODO Hack Threshold
            let badHackThreshold = 0.9;
            let badHackTarget = 0.1;

            let currentMoneyPercent = (serverData.getCurrentMoney() / serverData.getMaxMoney());

            // If Hack
            if (currentMoneyPercent >= badHackTarget)
            {
                let hackAnalysis = ns.hackAnalyze(serverData.getHostname());
                let hackChance = ns.hackAnalyzeChance(serverData.getHostname());

                if (hackAnalysis == 0)
                {
                    ns.print("[" + serverData.getHostname() + "] Hack ineffective, skipping for now.");
                    operation = new Operation(serverData.getHostname(), AGENT_NOT_APPLICABLE, 0, 0);
                }
                else
                {
                    let targetMoneyAmount = badHackTarget * serverData.getMaxMoney();
                    let hackThreadsRequired = Math.floor(ns.hackAnalyzeThreads(serverData.getHostname(), targetMoneyAmount));
                    let operationDuration = ns.getHackTime(serverData.getHostname());

                    operation = new Operation(serverData.getHostname(), AGENT_HACK, hackThreadsRequired, operationDuration);
                }   
            }
            else // Else Grow
            {
                // TODO Need to update with number of cores

                let growthPercentNeeded = (badHackThreshold / currentMoneyPercent);

                let growAttacksRequired = 1;
                // Safety Check
                if (growthPercentNeeded > 1)
                    growAttacksRequired = Math.ceil(ns.growthAnalyze(serverData.getHostname(), growthPercentNeeded));

                let operationDuration = ns.getGrowTime(serverData.getHostname());

                operation = new Operation(serverData.getHostname(), AGENT_GROW, growAttacksRequired, operationDuration);
            }
        }
    }

    return operation;
}

class Operation
{
    constructor(target, action, agentsRequired, operationDuration, operationCompletion)
    {
        this.target = target;
        this.action = action;
        this.agentsRequired = agentsRequired;
        this.operationDuration = operationDuration;
        this.operationCompletion = operationCompletion;
    }

    /** @return {Number} */
    getOperationCompletion() { return this.operationCompletion; }

    /** @return {Number} */
    getOperationDuration() { return this.operationDuration; }

    /** @return {String} */
    getTarget() { return this.target; }

    /** @return {String} */
    getAction() { return this.action; }

    /** @return {String} */
    getActionScript() 
    {
        let scriptName = null
        switch(this.action)
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
        }

        return scriptName;
    }

    /** @return {number} */
    getAgentsRequired() { return this.agentsRequired; }
}

async function raiseArmy(ns, realms, additionalHosts)
{
    ns.print("Preparing my legions.");

    let agentList = new Array();
    let agentCount = 0;

    let hosts = new Array();
    for (var i = 0; i < realms.length; i++)
    {
        let realmName = realms[i];

        if (!hosts.includes(realmName))
            hosts.push(realmName);
    }

    for (var i = 0; i < additionalHosts.length; i++)
    {
        let realmName = additionalHosts[i];

        if (!hosts.includes(realmName))
            hosts.push(realmName);
    }

    let filteredHosts = hosts.filter(filterInvalidHosts);

    for (var homeworldId = 0; homeworldId < filteredHosts.length; homeworldId++)
    {
        ns.print("\tSearching for homeworlds in sector " + homeworldId);

        let homeworldName = filteredHosts[homeworldId];
        ns.print("\tIdentified suitable homeworld...");
        ns.print("\t\tHomeworld Name: " + homeworldName);

        // Leave home alone
        if (homeworldName == home)
            continue;        

        let maxOverhead = ns.getServerMaxRam(homeworldName);
        let currentOverhead = ns.getServerUsedRam(homeworldName);
        let availableOverhead = maxOverhead - currentOverhead;
        
        let homeworldCapacity = Math.floor(availableOverhead / AGENT_COST);
        ns.print("\t\tMaximum Overhead: " + maxOverhead);
        ns.print("\t\tCurrent Overhead: " + currentOverhead);
        ns.print("\t\tAvailable Overhread: " + availableOverhead);
        ns.print("\t\tHomeworld capacity: " + homeworldCapacity);

        // let homeworld = new Homeworld(ns, homeworldName, homeworldId, homeworldCapacity);

        ns.print("\t\tBuilding infrastructure...");
        await buildHomeworlInfrastructure(ns, homeworldName);

        ns.print("\t\tCommissioning agents...");
        // await ns.sleep(5);
        let agents = commisionAgents(ns, homeworldName, homeworldCapacity);

        ns.print("\t\tAdding agents to army...");
        for (var k = 0; k < agents.length; k++)
        {
            let agent = agents[k];
            ns.print("\t\t\tAgent " + k + ": " + agent.getName());

            agentList[agentCount++] = agent;
        }

        // ns.print("\t\tDeploying legion...");
        // let legion = new Legion(ns, homeworld, agents);
        // await legion.enscribeAgentStatus();
        ns.print("\Homeworld recruitment complete.");
    }

    // TODO No longer using field reports.
    // ns.print("\nSubmitting initial field report...");
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

// TODO VERY TODO
function determineNextOps(targetList)
{
    let ops = new Operation("n00dles", AGENT_WEAK);
    return ops;
}

/** @param {Agent} agent */
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

class ServerData
{
    constructor(hostname, isHackable, hasAdminRights, maxMoney, currentMoney, minSecurity, currentSecurity)
    {
        this.hostname = hostname;
        this.isHackable = isHackable;
        this.hasAdminRights = hasAdminRights;
        this.maxMoney = maxMoney;
        this.currentMoney = currentMoney;
        this.minSecurity = minSecurity;
        this.currentSecurity = currentSecurity;
    }

    /** @return {boolean} */
    hasAdminRights() { return this.hasAdminRights; }
    
    /** @returns {String} */
    getHostname() { return this.hostname; }

    /** @returns {boolean} */
    isHackable() { return this.isHackable; }

    /** @returns {number} */
    getMaxMoney() { return this.maxMoney; }

    /** @returns {Number} */
    getCurrentMoney() { return this.currentMoney; }

    /** @returns {Number} */
    getMinSecurity() { return this.minSecurity; }

    /** @returns {Number} */
    getCurrentSecurity() { return this.currentSecurity; }
}

/** @param {NS} ns 
 * @returns {Array<ServerData>} **/
function runServerAnalysis(ns, serverNameList, myRealms)
{
    let serverDataList = new Array();

    ns.print("Server analysis...");
    for (var i = 0; i < serverNameList.length; i++)
    {
        let serverName = serverNameList[i];
        ns.print("\tServer Name: " + serverName);

        if (myRealms.includes(serverName))
        {
            ns.print("\t\tServer is mine, skipping analysis");
            continue;
        }
        else
        {
            let server = ns.getServer(serverName);

            ns.print("\t\tRunning server prep");
            let updateNeeded = portCheck(ns, "\t\t\t", server);

            if(updateNeeded)
                server = ns.getServer(serverName);

            ns.print("\t\tServer Stats");
            let serverData = runAnalysis(ns, "\t\t\t", server);

            serverDataList.push(serverData);
        }
    }

    return serverDataList;
}

/** @param {NS} ns 
 * @param {Server} server 
 * @returns {ServerData} **/
function runAnalysis(ns, logPrefix, server)
{
    let isHackable = server.openPortCount >= server.openPortCount;
    ns.print(logPrefix + "Is Hackable: " + isHackable);

    let hasAdminRights = server.hasAdminRights;
    ns.print(logPrefix + "Has Admin Rights: " + hasAdminRights);

    let maxMoney = server.moneyMax;
    ns.print(logPrefix + "Max Money: " + maxMoney);

    let currentMoney = server.moneyAvailable;
    ns.print(logPrefix + "Current Money: " + currentMoney);

    let minSecurity = server.minDifficulty;
    ns.print(logPrefix + "Min Security: " + minSecurity);

    let currentSecurity = server.hackDifficulty;
    ns.print(logPrefix + "Current Security: " + currentSecurity);

    let serverData = new ServerData(server.hostname, isHackable, hasAdminRights, maxMoney, currentMoney, minSecurity, currentSecurity);
    return serverData;
}

/** @param {NS} ns 
 * @param {Server} server **/
function portCheck(ns, logPrefix, server)
{
    let target = server.hostname;
    let openPorts = server.openPortCount;

    let updateNeeded = false;

    if (ns.fileExists(EXE_BRUTE_SSH, home))
    {
        if(!server.sshPortOpen)
        {
            ns.print(logPrefix + "Opening SSH Port...");
            ns.brutessh(target);

            openPorts++;

            updateNeeded = true;
        }
    }

    if(ns.fileExists(EXE_FTP_CRACK, home))
    {
        if(!server.ftpPortOpen)
        {
            ns.print(logPrefix + "Opening FTP Port...");
            ns.ftpcrack(target);

            openPorts++;

            updateNeeded = true;
        }
    }

    if (ns.fileExists(EXE_HTTP_HACK, home))
    {
        if (!server.httpPortOpen)
        {
            ns.print(logPrefix + "Opening HTTP Port...");
            ns.httpworm(target);

            openPorts++;

            updateNeeded = true;
        }
    }

    if (ns.fileExists(EXE_SMTP_HACK, home))
    {
        if (!server.smtpPortOpen)
        {
            ns.print(logPrefix + "Opening SMTP Port...");
            ns.relaysmtp(target);

            openPorts++;

            updateNeeded = true;
        }
    }

    if (ns.fileExists(EXE_SQL_HACK, home))
    {
        if (!server.sqlPortOpen)
        {
            ns.print(logPrefix + "Opening SQL Port...");
            ns.sqlinject(target);

            openPorts++;

            updateNeeded = true;
        }
    }

    if (!server.hasAdminRights && (openPorts >= server.numOpenPortsRequired))
    {
        ns.print(logPrefix + "Gaining Admin Rights...");
        ns.nuke(target);

        updateNeeded = true;
    }

    return updateNeeded;
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

    ns.print("Target List");
    let targetIter = targets.values();
    while(true)
    {
        let item = targetIter.next();
        let value = item.value;
        let done = item.done;

        ns.print("\t" + value);

        if(done)
            break;
    }

    return targets;
}

function findTargets(ns, startingPoints, myRealms)
{
    let targets = new Set();

    ns.print("Scanning mode activated.");
    ns.print("\tNumber of starting points: " + startingPoints.size);
    let iter = startingPoints.values();

    while(true)
    {
        let item = iter.next();

        let startingPoint = item.value;
        ns.print("\tScanning " + startingPoint);

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
                    ns.print("\t\tFound " + target);
                    targets.add(target);
                }                
            }    
        }

        if(item.done)
            break;
    }

    return targets;
}
const home = "home";
const HACKER_SCRIPT = "/v2/hack.js";
const WEAKEN_SCRIPT = "/v2/weaken.js";
const GROW_SCRIPT = "/v2/grow.js";

const EXE_BRUTE_SSH = "BruteSSH.exe";
const EXE_FTP_CRACK = "FTPCrack.exe";
const EXE_HTTP_HACK = "HTTPWorm.exe";
const EXE_SMTP_HACK = "relaySMTP.exe";
const EXE_SQL_HACK = "SQLInject.exe";

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

// TODO | currently 5 minutes
const OPERATION_MAX_RUNTIME = 5 * 60 * 1000; 
const OPERATION_HARD_STOP_RUNTIME_IN_MINUTES = 60

/** @param {NS} ns **/
export async function main(ns) 
{
    ns.print("It begins.");
    let myRealms = ns.getPurchasedServers();

    myRealms.push(home);

    // Setup agencies to run my scripts
    let agencies = new Array();
    for (var i = 0; i < myRealms.length; i++)
    {
        let homeworld = myRealms[i];

        let maxRam = ns.getServerMaxRam(homeworld);
        let capacity = Math.floor(maxRam / AGENT_COST);

        // Save some room in home
        if (homeworld == home)
            capacity = capacity - 100;

        let agency = new Agency(ns, homeworld, capacity, AGENT_COST);
        agencies.push(agency);
    }


    // Scan for targets
    let depth = ns.args[0];
    if (!depth)
    {
        ns.print("Using default depth (1)");
        depth = 1;
    }

    ns.print("Identifying targets...");
    let targetSet = runScan(ns, myRealms, depth);
    let targetList = setToList(targetSet);

    let serverDataList = runServerAnalysis(ns, targetList, myRealms);
    ns.print("Server Data: " + JSON.stringify(serverDataList));

    for (var i = 0; i < serverDataList.length; i++)
    {
        let serverData = serverDataList[i];

        let hasAdminRights = serverData.hasAdminRights;

        let isHackable = serverData.isHackable;
        if (hasAdminRights && isHackable)
        {
            let homeworld = serverData.getHostname();

            if (myRealms.includes(homeworld))
                continue;

            let maxRam = ns.getServerMaxRam(homeworld);
            let capacity = Math.floor(maxRam / AGENT_COST);

            let agency = new Agency(ns, homeworld, capacity, AGENT_COST);
            ns.print(ns.sprintf("Adding %s to my agencies", JSON.stringify(agency)));

            agencies.push(agency);
        }
    }

    for (var i = 0; i < agencies.length; i++)
    {
        let homeworld = agencies[i].getHomeworld();
        await buildInfrastructure(ns, homeworld);
    }
    
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("sleep");
    // ns.disableLog("prioritizeTargets");

    ns.print("Main loop");
    await mainLoop(ns, serverDataList, agencies, myRealms);
}

/** @param {ServerData} serverData */
function mapServerDataToHostname(serverData)
{
    return serverData.getHostname();
}

/** @param {ServerData} serverData */
function filterTargetsWithoutOngoingOperations(serverData)
{
    return !this.includes(serverData.getHostname());
}

/** @param {NS} ns
 * @param {Array<ServerData>} targetList
 * @param {Array<Agency>} agencies
 */
async function mainLoop(ns, targetList, agencies, myRealms)
{
    var loopCount = 0;
    var actionId = 0;


    let targetListHostnames = targetList.map(mapServerDataToHostname);

    while(true)
    {

        ns.print("\tRefreshing target Data...");

        let unprocessedTargetList = runServerAnalysis(ns, targetListHostnames, myRealms);
        // ns.print("Unprocessed Targets: " + JSON.stringify(unprocessedTargetList));

        let prioritizedTargetList = prioritizeTargets(ns, unprocessedTargetList);
        // ns.print("Prioritized targets: " + JSON.stringify(prioritizedTargetList));

        // ns.tprint(JSON.stringify(prioritizedTargetList));
        let availableTargetsList = prioritizedTargetList.filter(filterUnavailableTargets);

        // Get current hitlist
        let targetsWithOngoingOperations = new Array();
        for (var i = 0; i < agencies.length; i++)
            targetsWithOngoingOperations = targetsWithOngoingOperations.concat(agencies[i].getActiveTargetList());

        // Find targets that do not already have ongoing operations
        let openTargets = availableTargetsList.filter(filterTargetsWithoutOngoingOperations, targetsWithOngoingOperations);

        if (openTargets.length == 0)
        {
            ns.print("No available targets. Waiting 1 minute then trying again.");
            await ns.sleep(60 * 1000);
            continue;
        }

        // ns.tprint("Open targets: " + JSON.stringify(openTargets));

        // Find next operation. If none available in the time allowed, add a minute to the time allowed
        let currentOperation = null;
        let currentMaxOperationDuration = OPERATION_MAX_RUNTIME;
        while(true)
        {
            // Delay 10ms at the start of each check to prevent 'infinite loops" that the game checks for
            await ns.sleep(1);

            for (var i = 0; i < openTargets.length; i++)
            {
                let currentTarget = openTargets[i];

                // Now that we have a target, determine the operation type
                let checkOperation = await determineActionForServer(ns, currentTarget);

                // Skip targets without a recommended action
                if (checkOperation.getAction() == AGENT_NOT_APPLICABLE)
                    continue;

                // Unsure why I need this check...
                if (checkOperation.getAgentsRequired() == null || checkOperation.getAgentsRequired() == 0)
                    continue;

                // Now that we have an operation type, determine if duration is acceptable.
                if (checkOperation.getOperationDuration() <= currentMaxOperationDuration)
                {
                    ns.print("Found operation: " + JSON.stringify(checkOperation));
                    currentOperation = checkOperation;
                    break;
                }
            }

            // If no valid operation were found, add a minute to the allowable time
            if (!currentOperation)
            {
                let currentMaxOperationDurationInMinutes = currentMaxOperationDuration / 1000 / 60;

                ns.print(ns.sprintf("No operation found under %d minutes. Researting the search with +15 minutes to the max", currentMaxOperationDurationInMinutes));

                currentMaxOperationDuration = currentMaxOperationDuration + (15 * 60 * 1000);
                await ns.sleep(10 * 1000);
            }
            else
                break;
        }

        // Another safety check I'm hacking in...
        if (currentOperation == null)
            continue;
 
        let agentsRequiredForOps = currentOperation.getAgentsRequired();
        if (agentsRequiredForOps == null || isNaN(agentsRequiredForOps) || agentsRequiredForOps == 0)

        ns.print("Operation Target: " + currentOperation.getTarget());
        ns.print("Operation script: " + currentOperation.getActionScript());
        ns.print("Agents required: " + agentsRequiredForOps);
        
        // Work an op to completion
        while(agentsRequiredForOps > 0)
        {
            for (var i = 0; i < agencies.length; i++)
            {
                let agency = agencies[i];
                // ns.tprint("Agency: " + agency.getHomeworld());

                let availableAgents = agency.getAvailableAgents();
                // ns.tprint("Available agents: " + availableAgents);

                // ns.tprint("Main loop agent count: " + availableAgents);
                // ns.tprint(ns.sprintf("\n\tAgency: %s\n\tAvailable Agents: %d", agency.getHomeworld(), availableAgents));

                // If no available agencies, move on to the next agency
                if (availableAgents == null || isNaN(availableAgents) || availableAgents == null || availableAgents == 0)
                    continue;

                // Only take as many agents as needed
                if (availableAgents > agentsRequiredForOps)
                    availableAgents = agentsRequiredForOps;
               
                let scriptName = currentOperation.getActionScript();
                let target = currentOperation.getTarget();
                let operationDuration = currentOperation.getOperationDuration();

                let operationCompletion = operationDuration + ns.getTimeSinceLastAug();

                // ns.print(ns.sprintf("\nAgent Homeworld: %s\nScript Name: %s\nTarget: %s\nAgent Count: %d\nDuration: %d\nCompletion: %d", agency.getHomeworld(), scriptName, target, availableAgents, operationDuration, operationCompletion));
                

                let operationDurationSeconds = (operationDuration / 1000) % 60;
                let operationDurationMinutes = Math.round((operationDuration / 1000 / 60) % 60);
                let operationDurationHours = Math.round((operationDuration / 1000 / 60 / 60));
                let operationRuntimeString = ns.sprintf("%dh %dm %ds", operationDurationHours, operationDurationMinutes, operationDurationSeconds);
                let agentsDeployed = agency.deployAgents(scriptName, target, availableAgents, operationCompletion, actionId++, operationRuntimeString);

                // Update agents requried count
                agentsRequiredForOps = agentsRequiredForOps - agentsDeployed;
                ns.print("Agents remaining: " + agentsRequiredForOps);
                
                // Exit loop if enough agents have been found.
                if (agentsRequiredForOps == 0)
                    break;

                // Another 10ms delay to satisfy the game
                await ns.sleep(10);
            }

            // If we still need agents at this point, we just need to wait for existing agents to free up.
            if (agentsRequiredForOps > 0)
            {
                ns.print(ns.sprintf("Still need %d agents. Waiting 10 seconds for existing operation to complete.", agentsRequiredForOps));
                await ns.sleep(10 * 1000);
            }
        }

        ns.print("Operation fulfilled, identifying next operation");
    }
        

}

/** @param {NS} ns
 * @param {Array<ServerData>} targetList
 * @returns {Array<ServerData>}
 */
function prioritizeTargets(ns, targetList)
{
    // ns.print("Target Count: " + targetList.length);
    let servers = targetList.filter(filterServersWithoutMoney);

    // ns.print("Targets with Money: " + servers.length);

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

/** @param {NS} ns
 * @param {String} homeworld
 */
async function buildInfrastructure(ns, homeworld)
{
        // Prepare with infernal arms
        await ns.scp(HACKER_SCRIPT, homeworld);
        await ns.scp(WEAKEN_SCRIPT, homeworld);
        await ns.scp(GROW_SCRIPT, homeworld);
}


/** @param {NS} ns
 * @param {ServerData} serverData
 * @returns {Operation}
 */
function determineActionForServer(ns, serverData)
{
    let operation = null;
    let coreCount = serverData.getNumberOfCores();
    
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
                    growAttacksRequired = Math.ceil(ns.growthAnalyze(serverData.getHostname(), growthPercentNeeded, coreCount));

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

// async function raiseArmy(ns, realms, additionalHosts)
// {
//     ns.print("Preparing my legions.");

//     let agentList = new Array();
//     let agentCount = 0;

//     let hosts = new Array();
//     for (var i = 0; i < realms.length; i++)
//     {
//         let realmName = realms[i];

//         if (!hosts.includes(realmName))
//             hosts.push(realmName);
//     }

//     for (var i = 0; i < additionalHosts.length; i++)
//     {
//         let realmName = additionalHosts[i];

//         if (!hosts.includes(realmName))
//             hosts.push(realmName);
//     }

//     let filteredHosts = hosts.filter(filterInvalidHosts);

//     for (var homeworldId = 0; homeworldId < filteredHosts.length; homeworldId++)
//     {
//         ns.print("\tSearching for homeworlds in sector " + homeworldId);

//         let homeworldName = filteredHosts[homeworldId];
//         ns.print("\tIdentified suitable homeworld...");
//         ns.print("\t\tHomeworld Name: " + homeworldName);

//         // // Leave home alone
//         // if (homeworldName == home)
//         //     continue;        

//         let maxOverhead = ns.getServerMaxRam(homeworldName);
//         let currentOverhead = ns.getServerUsedRam(homeworldName);
//         let availableOverhead = maxOverhead - currentOverhead;
        
//         let homeworldCapacity = Math.floor(availableOverhead / AGENT_COST);

//         if (homeworldName == home)
//             homeworldCapacity = homeworldCapacity - 50;

//         ns.print("\t\tMaximum Overhead: " + maxOverhead);
//         ns.print("\t\tCurrent Overhead: " + currentOverhead);
//         ns.print("\t\tAvailable Overhread: " + availableOverhead);
//         ns.print("\t\tHomeworld capacity: " + homeworldCapacity);

//         // let homeworld = new Homeworld(ns, homeworldName, homeworldId, homeworldCapacity);

//         ns.print("\t\tBuilding infrastructure...");
//         await buildHomeworlInfrastructure(ns, homeworldName);

//         ns.print("\t\tCommissioning agents...");
//         await ns.sleep(2);
//         let agents = commisionAgents(ns, homeworldName, homeworldCapacity);

//         ns.print("\t\tAdding agents to army...");
//         for (var k = 0; k < agents.length; k++)
//         {
//             let agent = agents[k];
//             ns.print("\t\t\tAgent " + k + ": " + agent.getName());

//             agentList[agentCount++] = agent;
//         }

//         // ns.print("\t\tDeploying legion...");
//         // let legion = new Legion(ns, homeworld, agents);
//         // await legion.enscribeAgentStatus();
//         ns.print("\Homeworld recruitment complete.");
//     }

//     // TODO No longer using field reports.
//     // ns.print("\nSubmitting initial field report...");
//     // let fieldReport = JSON.stringify(agentList);
//     // await ns.clearPort(ARMY_FIELD_REPORT_PORT);
//     // await ns.writePort(ARMY_FIELD_REPORT_PORT, fieldReport);

//     let army = new Army(ns, agentList);
//     return army;
// }

// function commisionAgents(ns, homeworld, count)
// {
//     let agents = Array(count);
//     for (var i = 0; i < count; i++)
//     {
//         let agentName = findAgent();

//         let agent = new Agent(agentName, homeworld, AGENT_READY, ns.getTimeSinceLastAug());
//         agents[i] = agent;
//     }

//     return agents;
// }

// TODO Agent manager with unique names
    // Concern: Need to handle names running out

// function findAgent()
// {
//     let firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAME_LENGTH)];
//     let lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAME_LENGTH)];

//     let name = firstName + " " + lastName;

//     return name;
// }


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



// async function determineAction(ns, target)
// {
//     let server = ns.getServer(target);

//     await portCheck(ns, server);
    
//     let difficulty = server.hackDifficulty - server.minDifficulty;
//     let moneyPercent = server.moneyMax / server.moneyAvailable;
    
//     // TODO This is a wild shot in the dark
//     let action = AGENT_READY;
//     if (difficulty > 10)
//         action = AGENT_WEAK;
//     else if (moneyPercent > 0.85)
//         action = AGENT_HACK;
//     else 
//         action = AGENT_GROW;
    
//     return action;
// }

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
    constructor(hostname, isHackable, hasAdminRights, maxMoney, currentMoney, minSecurity, currentSecurity, numberOfCores)
    {
        this.hostname = hostname;
        this.isHackable = isHackable;
        this.hasAdminRights = hasAdminRights;
        this.maxMoney = maxMoney;
        this.currentMoney = currentMoney;
        this.minSecurity = minSecurity;
        this.currentSecurity = currentSecurity;
        this.numberOfCores = numberOfCores;
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

    /** @returns {Number} */
    getNumberOfCores() { return this.numberOfCores; }
}

/** @param {NS} ns 
 * @returns {Array<ServerData>} **/
function runServerAnalysis(ns, serverNameList, myRealms)
{
    let serverDataList = new Array();

    // ns.print("Server analysis...");
    for (var i = 0; i < serverNameList.length; i++)
    {
        let serverName = serverNameList[i];
        // ns.print("\tServer Name: " + serverName);

        if (myRealms.includes(serverName))
        {
            // ns.print("\t\tServer is mine, skipping analysis");
            continue;
        }
        else
        {
            let server = ns.getServer(serverName);

            // ns.print("\t\tRunning server prep");
            let updateNeeded = portCheck(ns, "\t\t\t", server);

            if(updateNeeded)
                server = ns.getServer(serverName);

            // ns.print("\t\tServer Stats");
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
    // ns.print(logPrefix + "Is Hackable: " + isHackable);

    let hasAdminRights = server.hasAdminRights;
    // ns.print(logPrefix + "Has Admin Rights: " + hasAdminRights);

    let maxMoney = server.moneyMax;
    // ns.print(logPrefix + "Max Money: " + maxMoney);

    let currentMoney = server.moneyAvailable;
    // ns.print(logPrefix + "Current Money: " + currentMoney);

    let minSecurity = server.minDifficulty;
    // ns.print(logPrefix + "Min Security: " + minSecurity);

    let currentSecurity = server.hackDifficulty;
    // ns.print(logPrefix + "Current Security: " + currentSecurity);

    let numberOfCores = server.cpuCores;
    // ns.print(logPrefix + "Number of cores: " + numberOfCores);

    let serverData = new ServerData(server.hostname, isHackable, hasAdminRights, maxMoney, currentMoney, minSecurity, currentSecurity, numberOfCores);
    return serverData;
}

/** @param {NS} ns 
 * @param {Server} server **/
async function portCheck(ns, logPrefix, server)
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

            if (value == home)
                continue;

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




/**
 * Used to track ongoing operaitons
 */
class FieldWork
{
    /**
     * @param {Number} timestamp
     * @param {Number} agentCount
     */
    constructor(target, timestamp, agentCount)
    {
        this.target = target;
        this.timestamp = timestamp;
        this.agentCount = agentCount;
    }

    /** @returns {Number} */
    getTimestamp() { return this.timestamp; }

    /** @returns {String} */
    getTarget() { return this.target }
}


/**
 * Responsible for tracking the number of available agents in a homeworld.
 * Also tracks available agents, agents in the field, and when deployed 
 * agents will be available for a new assignment.
 */
class Agency
{
    /**
     * @param {NS} ns
     * @param {String} homeworld
     * @param {Number} capacity
     * @param {Number} agentCost
     */
    constructor(ns, homeworld, capacity, agentCost)
    {
        this.ns = ns;
        this.homeworld = homeworld;

        let maxRam = this.ns.getServerMaxRam(this.homeworld);
        let usedRam = this.ns.getServerUsedRam(this.homeworld);

        let availableRam = maxRam - usedRam;
        let availableAgentCount = Math.floor(availableRam / agentCost);

        this.availableAgents = availableAgentCount;

        this.agentCost = agentCost;
        this.ongoingOperations = new Array();
        this.operationCount = 0;
    }

    /** @returns {String} */
    getHomeworld() { return this.homeworld; }

    /**
     * @param {Number} agentCost
     * @returns {Number}
     */
    getAvailableAgents()
    {
        let maxRam = this.ns.getServerMaxRam(this.homeworld);
        let usedRam = this.ns.getServerUsedRam(this.homeworld);

        let availableRam = maxRam - usedRam;
        let availableAgentCount = Math.floor(availableRam / this.agentCost);

        this.availableAgents = availableAgentCount;

        if (this.homeworld == home)
            this.availableAgents = this.availableAgents - 50;

        return this.availableAgents;
    }

    /** @returns {Array<String>} */
    getActiveTargetList()
    {
        let timestamp = this.ns.getTimeSinceLastAug();

        this.ongoingOperations = this.ongoingOperations.filter(filterOngoingAssignments, timestamp);
        
        let activeTargets = this.ongoingOperations.map(mapOperationNames);
        return activeTargets;
    }

    /**
     * @param {String} scriptName
     * @param {String} target
     * @param {Number} numberOfAgents
     * @param {Number} completionTime
     * @param {Number} agentCost
     * 
     * @return {Number} committedAgents
     */
    deployAgents(scriptName, target, numberOfAgents, completionTime, globalOperationCount, runtimeReport)
    {
        this.operationCount = this.operationCount + 1;
        this.ns.print(this.ns.sprintf("\n\tHomeworld: %s\n\tCommence Operation #%d\n\tScript: %s\n\tTarget: %s\n\tNumber of Agents: %d\n\tCompletion Time: %d", this.homeworld, this.operationCount, scriptName, target, numberOfAgents, completionTime));

        // Add an extra 50ms to avoid potential timing issues
        completionTime = completionTime + 50;

        // Update available agent count
        this.getAvailableAgents();

        // Update available agents
        let actualNumberOfAgentsDeployed = Math.min(numberOfAgents, this.availableAgents);
        
        let operationCountReportLocal = this.ns.sprintf("%s Operation ID: %d", this.homeworld, this.operationCount);
        let operationCountGlobal = this.ns.sprintf("Global Operation ID: %d", globalOperationCount);
        let result = this.ns.exec(scriptName, this.homeworld, actualNumberOfAgentsDeployed, target, actualNumberOfAgentsDeployed, runtimeReport, operationCountReportLocal, operationCountGlobal);
        if (result != 0)
        {
            // Track newly deployed agents
            let fieldWork = new FieldWork(target, completionTime, actualNumberOfAgentsDeployed);
            this.ongoingOperations.push(fieldWork); 
        }
        else
        {
            this.ns.print(this.ns.sprintf("Failed to launch the operation %d", this.operationCount));
            return 0;
        }

        return actualNumberOfAgentsDeployed;
    }
}

/** @param {FieldWork} fieldWork */
function mapOperationNames(fieldWork)
{
    return fieldWork.target;
}

/** @param {FieldWork} fieldWork */
function filterCompletedAssignments(fieldWork)
{
    return fieldWork.timestamp <= this;
}

/** @param {FieldWork} fieldWork */
function filterOngoingAssignments(fieldWork)
{
    return fieldWork.timestamp > this;
}
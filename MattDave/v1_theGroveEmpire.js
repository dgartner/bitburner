const home = "home";
const hackerScript = "hack.js";
const weakenScript = "weaken.js";
const growScript = "grow.js";

const AGENT_READY = "ready"
const FIRST_NAMES = ["Smith", "Sammy", "Terry", "Linda", "Jenni", "John", "Jake", "Jackson", "Andrew", "Tyler", "Kevin", "David", "Jessica", "Matthew", "Alyssa", "Juniper", "Kayla", "Ryan", "Stevie", "Evalyn", "Kris", "Noelle", "Susie", "Thomas"];   
const LAST_NAMES = ["Smithson", "Grover", "Stenn", "Brakken", "Sinner", "Farce", "Drummer", "Steward", "Seventhson", "Lyrre", "Trescent", "Canters", "Ik-thu", "Vorpal", "Barranor", "Storm", "Sky", "Winters", "Steel", "Carver"];

const FIRST_NAME_LENGTH = FIRST_NAMES.length;
const LAST_NAME_LENGTH = LAST_NAMES.length;

const AGENT_COST = 1.75;

class Homeworld
{
    constructor(ns, name, id, capacity)
    {
        this.ns = ns;
        this.name = name;
        this.id = (id + 1);
        this.capacity = capacity
    }

    getName()
    {
        return this.name;
    }

    getId()
    {
        return this.id;
    }

    getCapacity()
    {
        return this.capacity;
    }

    async enscribeMessage(message)
    {
        this.ns.writePort(this.id, message);
    }

    async receiveMessage()
    {
        return this.ns.peek(this.id);
    }

    async receiveAndClearMessage()
    {
        return this.ns.readPort(this.id);
    }
}

class Legion
{
    constructor(ns, homeworld, agents)
    {
        this.ns = ns;
        this.homeworld = homeworld;
        this.agents = agents; 
    }

    async enscribeAgentStatus()
    {
        let initialStatus = JSON.stringify(this.agents);
        await this.homeworld.enscribeMessage(initialStatus); 
    }
   
    getAvailableAgents()
    {
        let message = this.homeworld.receiveMessage();
        
        this.ns.tprint("Available Agents: " + message);

        // var fieldReport = this.homeworld.receiveMessage();
        // let agentStatuses = fieldReport.split(",");

        // let executiveReport = new Array();
        // executiveReport[AGENT_READY] = 0;

        // let count = 0;
        // this.ns.tprint("Agent Status (" + homeName + ")");
        // statuses.forEach(function(value)
        // {
        //     this.ns.tprint("\tAgent 1: " + value);

        //     if (value)
        //         count++;
        // });

        // return count;
    }
}

// I'm not sure there's a point in this class
class Agent
{
    constructor(name)
    {
        this.name = name;
        this.status = AGENT_READY;
    }

    setStatus(status)
    {
        this.status = status;
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

async function raiseArmy(ns)
{
    ns.tprint("Preparing my legions.");
    let army = new Array();

    let realms = ns.getPurchasedServers();

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

        let homeworld = new Homeworld(ns, homeworldName, homeworldId, homeworldCapacity);

        ns.tprint("\t\tBuilding infrastructure...");
        buildHomeworlInfrastructure(ns, homeworldName);

        ns.tprint("\t\tCommissioning agents...");
        let agents = commisionAgents(ns, homeworldCapacity);

        for (var k = 0; k < agents.length; k++)
            ns.tprint("\t\t\tAgent " + k + ": " + agents[k].getName());

        ns.tprint("\t\tDeploying legion...");
        let legion = new Legion(ns, homeworld, agents);
        await legion.enscribeAgentStatus();

        army[homeworldId] = legion;
        ns.tprint("\tLegion established!");
    }

    return army;
}

function commisionAgents(ns, count)
{
    let agents = Array(count);
    for (var i = 0; i < count; i++)
    {
        let agent = findAgent();
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

    let agent = new Agent(name);

    return agent;
}

/** @param {NS} ns **/
export async function main(ns) 
{
    ns.tprint("It begins.");

    ns.tprint("Preparing my legions");
    let army = raiseArmy(ns);



}


function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
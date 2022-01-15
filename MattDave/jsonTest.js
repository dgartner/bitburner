/** @param {NS} ns **/
export async function main(ns) 
{
    testHomeworld(ns);
    
}


function testHomeworld(ns)
{
    let one = new Homeworld(ns, "Zen", 1);
    let two = new Homeworld(ns, "Shimmer", 2);

    let arr = [one, two];

    ns.tprint(JSON.stringify(arr, ["name", "id"]));
}

// Working
function basicTest(ns)
{
    let one = new objTest("Smith", 1);
    let two = new objTest("Shell", 2);

    let arr = [one, two];

    ns.tprint(JSON.stringify(arr));
}

class objTest
{
    constructor(name, value)
    {
        this.name = name;
        this.value = value;
    }
}

class Homeworld
{
    constructor(ns, name, id)
    {
        this.ns = ns;
        this.name = name;
        this.id = id;
    }

    enscribeMessage(message)
    {
        this.ns.writePort(this.id, message);
    }

    receiveMessage()
    {
        return this.ns.peek(this.id);
    }

    receiveAndClearMessage()
    {
        return this.ns.readPort(this.id);
    }

    getName()
    {
        return this.name;
    }

    getId()
    {
        return this.id;
    }
}

class Legion
{
    constructor(ns, homeworld, agentCount)
    {
        this.ns = ns;
        this.homeworld = homeworld;
        this.agentCount = agentCount;
        
        var initialStatus = AGENT_READY;
        for (var i = 1; i < agentCount; i++)
            initialStatus = initialStatus + "," + AGENT_READY;

        this.homeworld.enscribeMessage(initialStatus);  
    }

    getAvailableAgents()
    {
        var fieldReport = this.homeworld.receiveMessage();
        let agentStatuses = fieldReport.split(",");

        let executiveReport = new Array();
        executiveReport[AGENT_READY] = 0;

        let count = 0;
        this.ns.tprint("Agent Status (" + homeName + ")");
        statuses.forEach(function(value)
        {
            this.ns.tprint("\tAgent 1: " + value);

            if (value)
                count++;
        });

        return count;
    }
}
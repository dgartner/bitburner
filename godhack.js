import { Crawler } from "./crawler";

/** @param {NS} ns **/
export async function main(ns) {
    let crawler = new Crawler(ns);
    ns.disableLog("ALL");

    let sleepTimeMs = 500;
    let innerLoopTimeMs = 10000;
    let innerLoopCountThreshold = innerLoopTimeMs / sleepTimeMs;
    await crawler.run();
    let servers = crawler.getHackworthyServers();
    servers.sort(sortByMaxMoneyOverHackLevel);

    ns.tprint("Server Characteristics:")
    for (let i = 0; i < servers.length; i++) {
        let s = servers[i];
        ns.tprintf("%20s: $%5.2fbil - HackDiff: %4d - Sec:%3.2f/%3.2f - Quo:%f", s.getHostname(), s.getMaxMoney() / 1000000000, s.getRequiredHackLevel(), s.getCurrentSecurity(), s.getMinSecurity(), serverHackQuotient(s) / 1000000);
    }

    while (true) {
        await crawler.nukeAll();
        await crawler.copyBasicScripts();

        servers = crawler.getHackworthyServers();
        servers.sort(sortByMaxMoneyOverHackLevel);

        let botnet = crawler.getControlableServerList();
        botnet.sort();

        let innerLoopCount = 0;
        while (innerLoopCount < innerLoopCountThreshold) {
            innerLoopCount++;
            for (let i = 0; i < servers.length; i++) {
                let target = servers[i];
                target.weaken(botnet);
                target.grow(botnet);
                target.hack(botnet);
            }
            reportAll(ns, servers);
            await ns.sleep(sleepTimeMs);
        }
    }
}

function reportAll(ns, servers)
{
    ns.clearLog();
    ns.print(" Weaken |  Grow  |  Hack  |   Max $  |   % $m  |Pred % $m |   Sec  |Pred Sec| Hack %  |  Time   | Server");
    ns.print("________________________________________________________________________________________________");
    servers.forEach(server => server.report());
}

function sortByMaxMoneyOverHackLevel(left, right) {
    return (serverHackQuotient(right)) - (serverHackQuotient(left));
}

function serverHackQuotient(serv) {
    return serv.getDollarsStolenPerSecond();
    
    //return (serv.getMaxMoney() / (serv.getRequiredHackLevel() * serv.getMinSecurity()) * serv.getHackChance());
}

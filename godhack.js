import { Analyzer } from "./Analyzer";
import { Crawler } from "./crawler";
import { TaskManager } from "./TaskManager";

/** @param {NS} ns **/
export async function main(ns) {
    let crawler = new Crawler(ns);
    let tm = new TaskManager(ns);
    let analyzer = new Analyzer(ns, tm);
    await crawler.nukeAll();
    //await crawler.infestAll();

    let servers = crawler.getHackworthyServers();
    ns.tprint(servers);

    //TODO sort servers somehow.

    while(true)
    {
        for(let i = 0; i < servers.length; i++)
        {
            //ns.tprint("Working on " + servers[i]);
            let server = servers[i];
            if(analyzer.isSaturated(server))
            {
                //ns.tprint(server + " is saturated");
                continue;
            }
            //await ns.sleep(5000);
            analyzer.weaken(server);
            //await ns.sleep(5000);
            analyzer.grow(server);
            //await ns.sleep(5000);
            analyzer.hack(server);
            break;
        }
        analyzer.reportAll(servers);
        await ns.sleep(1000);
    }
}

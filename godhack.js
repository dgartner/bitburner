import { Analyzer } from "./Analyzer";
import { Crawler } from "./crawler";
import { TaskManager } from "./TaskManager";

/** @param {NS} ns **/
export async function main(ns) {
    let crawler = new Crawler(ns);
    let tm = new TaskManager(ns);
    let analyzer = new Analyzer(ns, tm);
    await crawler.nukeAll();
    await crawler.infestAll();

    let servers = crawler.getHackworthyServers();

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
            analyzer.weaken(server);
            analyzer.grow(server);
            analyzer.hack(server);
            break;
        }
        await ns.sleep(5);
    }
}

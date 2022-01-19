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

    let target = "joesguns";
    analyzer.weaken(target);
    analyzer.grow(target);
    analyzer.weaken(target);
    analyzer.grow(target);
    analyzer.weaken(target);
    analyzer.grow(target);
    analyzer.weaken(target);
    analyzer.grow(target);
    analyzer.weaken(target);
    analyzer.grow(target);
}
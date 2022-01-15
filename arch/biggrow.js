/** @param {NS} ns **/
export async function main(ns) {
	var host = ns.getHostname();
	var remainingRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	var growRam = 0.15; //ns.getScriptRam("grow.js");
	var growThreads = Math.floor(remainingRam / growRam);
	await ns.grow("foodnstuff", {threads: growThreads});
}
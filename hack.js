/** @param {NS} ns **/
export async function main(ns) {
	var host = ns.args[0];
	var free_ram = await ns.getServerMaxRam(host) - await ns.getServerUsedRam(host);
	var script_ram = await ns.getScriptRam("basic-hack.js");
	var num_instances = Math.floor(free_ram/script_ram);
	await ns.tprint(num_instances);
	if(num_instances > 0)
	{
		await ns.scp("basic-hack.js", ns.getHostname(), host);
		await ns.tprint("Successfull exe: " + await ns.exec("basic-hack.js", host, num_instances, host));
	}
	
}
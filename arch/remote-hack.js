/** @param {NS} ns **/
export async function main(ns) {
	var host = "home";
	var free_ram = await ns.getServerMaxRam(host) - await ns.getServerUsedRam(host);
	var script_ram = await ns.getScriptRam("basic-hack.js");
	var num_instances = Math.floor(free_ram/script_ram);
	await ns.tprint(num_instances);
	if(num_instances > 0)
	{
		await ns.tprint("Successfull exe: " + await ns.exec("basic-hack.js", host, num_instances, ns.args[0]));
	}
	
}
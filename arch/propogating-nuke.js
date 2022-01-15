/** @param {NS} ns **/
export async function main(ns) {
	var hosts = await ns.scan();
	hosts.forEach(await propogate_nuke)
}
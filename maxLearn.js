/** @param {NS} ns **/
export async function main(ns) {
	var targets = ["hong-fang-tea", "foodnstuff", "sigma-cosmetics", "joesguns"]
	var maxRam = ns.getServerMaxRam(ns.getHostname());// - ns.getScriptRam("phase2.js");
	var numTargets = targets.length;
	for(var i = 0; i < numTargets; i++)
	{
		ns.exec("smarthack.js", ns.getHostname(),  1, targets[i], maxRam/numTargets);
	}
}
var accessedTargets = [];

/** @param {NS} ns **/
export async function main(ns) {
	var accessedTargets = [];
	ns.tprint("Running crawler.js");
	accessedTargets.push(ns.getHostname());
	await recursiveScan(ns, ns.getHostname());
}

/** @param {NS} ns **/
async function recursiveScan(ns, target)
{
	var subTargets = ns.scan(target);
	//ns.tprint("Scanning from: " + target);
	
	for(let i = 0; i < subTargets.length; i++)
	{
		var sTarget = subTargets[i];
		if(accessedTargets.includes(sTarget)){
			continue;
		}
		else{
			accessedTargets.push(sTarget)
			await makeItHappen(ns, sTarget);
			await recursiveScan(ns, sTarget);
		}
	}
}

/** @param {NS} ns **/
async function makeItHappen(ns, target)
{
	if(nukeTarget(ns, target))
	{
		ns.exec("hack.js", ns.getHostname(), 1, target);
	}

	await ns.sleep(1);
}

/** @param {NS} ns **/
async function nukeTarget(ns, target)
{
	var openedPorts = 0;
	if (ns.fileExists("BruteSSH.exe", "home")) {
		ns.brutessh(target);
		openedPorts++;
	}
	if (ns.fileExists("FTPCrack.exe", "home")) {
		ns.ftpcrack(target);
		openedPorts++;
	}
	if (ns.fileExists("relaySMTP.exe", "home")) {
		ns.relaysmtp(target);
		openedPorts++;
	}
	if(ns.getServerNumPortsRequired(target) <= openedPorts){
		var result = ns.nuke(target) ? "SUCCESS" : "FAILURE";
		ns.tprint("Nuking " + target + ": " + result);
		return result == "SUCCESS";
	}
	return false;
}
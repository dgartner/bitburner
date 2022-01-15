var accessedTargets = [];
var targetServerFound = false;

/** @param {NS} ns **/
export async function main(ns) {
	ns.tprint("Running crawler.js");
	var targetServer = ns.args[0];
	targetServerFound = false;
	accessedTargets.push(ns.getHostname());
	await recursiveScan(ns, ns.getHostname(), targetServer);
}

/** @param {NS} ns **/
async function recursiveScan(ns, target, targetServer)
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
			if(sTarget == targetServer)
			{
				targetServerFound = true;
			}			
			if(targetServerFound)
			{
				ns.tprint(sTarget);
				return;
			}
			
			await recursiveScan(ns, sTarget);
		}
	}
}

/** @param {NS} ns **/
async function makeItHappen(ns, target)
{
	//ns.tprint("Nuking " + target);
	if(await nukeTarget(ns, target))
	{
		ns.tprint("Hacking " + target);
		ns.exec("hack.js", "home", 1, target);
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
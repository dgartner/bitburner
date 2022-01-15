/** @param {NS} ns **/
export async function main(ns) {
	await ns.sleep(100);
	var target = ns.args[0];
	var thisRam = ns.getScriptRam("smarthack.js");
	var maxRam = ns.args[1] - thisRam;
	var host = ns.getHostname();

	ns.disableLog("ALL");


	while(true) {
		if(!ns.isRunning("weaken.js", host, target, target))
		{
			var weakenRam = ns.getScriptRam("weaken.js");
			var hackRam = ns.getScriptRam("heck.js");
			var growRam = ns.getScriptRam("grow.js");
		 	var minSec = ns.getServerMinSecurityLevel(target);

			var weakenThreads = 0;
			var remainingRam = maxRam;
			var hackThreads = Math.min(getHackThreads(ns, target), Math.floor(remainingRam / hackRam));
			remainingRam = remainingRam - (hackThreads * hackRam);
			var growThreads = Math.floor(remainingRam / growRam);

			var newSec = ns.getServerSecurityLevel(target) + ns.growthAnalyzeSecurity(growThreads);

			while((newSec - ns.weakenAnalyze(weakenThreads) > minSec) && growThreads > 0)
			{
				weakenThreads++;
				growThreads--;
				newSec = ns.getServerSecurityLevel(target) + ns.growthAnalyzeSecurity(growThreads);
			}

			ns.print(sprintf("W:%d  H:%d  G:%d", weakenThreads, hackThreads, growThreads));
			if(weakenThreads > 0) {
				//ns.weaken(target, { threads: 5 });
				ns.exec("weaken.js", host, weakenThreads, target, target);
			}
			if(hackThreads > 0) {
				//ns.hack(target, { threads: 1 });
				ns.exec("heck.js", host, hackThreads, target, target);
			}
			if(growThreads > 0) {
				//ns.grow(target, { threads: 1 });
				ns.exec("grow.js", host, growThreads, target, target);
			}
			
		}
		await ns.sleep(100);
	}
}

/** @param {NS} ns **/
function areScriptsRunning(ns, target, host)
{
}

// /** @param {NS} ns **/
// function getWeakenThreads(ns, target) {
// 	var minSec = ns.getServerMinSecurityLevel(target);
// 	var curSec = ns.getServerSecurityLevel(target);

// 	ns.print("MinSec: " + minSec + " -- CurSec: " + curSec);
// 	var weakenThreads = 0;
// 	while(curSec - ns.weakenAnalyze(weakenThreads) > minSec)
// 	{
// 		weakenThreads++;
// 	}
// 	return weakenThreads;
// }

var hackMin = 0.70;
/** @param {NS} ns **/
function getHackThreads(ns, target) {
	var maxMoney = ns.getServerMaxMoney(target);
	var hackThreshold = 0.85;
	var curMoney = ns.getServerMoneyAvailable(target);
	var hackThreads = 0;
	var percentfull = (curMoney / maxMoney);

	if(curMoney > (maxMoney * hackMin)) {
		if(percentfull < 1.0) {
			hackMin = Math.min(hackMin+0.01, hackThreshold);
		}
		else {
			hackMin -= 0.01;
		}
	}
	ns.print(hackMin);

	var outString = ns.sprintf('%s has %d -- %2.2f%% of max', target, curMoney, percentfull * 100);
	ns.print(outString);
	//ns.print(target + " has " + Math.floor(curMoney) + ". " + Math.floor(percentfull) + "% of max");
	if(curMoney > maxMoney * hackThreshold)
	{
		var targetPercent = percentfull - hackMin;
		while(ns.hackAnalyze(target) * hackThreads < targetPercent)
		{
			hackThreads++;
		}
	}
	return hackThreads;	
}
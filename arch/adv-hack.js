/** @param {NS} ns **/
export async function main(ns) {
	await ns.tprint("Running basic-hack v1");
	var target = ns.args[0];
    var moneyThresh = await ns.getServerMaxMoney(target) * 0.75;
    var securityThresh = await ns.getServerMinSecurityLevel(target);

	var weakenScript = "weaken.js";
	var growScript = "grow.js";
	var hackScript = "heck.js";

	var wsRam = ns.getScriptRam(weakenScript);
	var gsRam = ns.getScriptRam(growScript);
	var hsRam = ns.getScriptRam(hackScript);

	var maxRam = ns.getServerMaxRam(ns.getHostname());
	
	while(true) 
	{
		var weakenThreads = 0;
		var securityLevel = await ns.getServerSecurityLevel(target);
		var securityDelta = securityLevel - securityThresh;
		var remainingRam = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());
		
		while(ns.weakenAnalyze(weakenThreads) < securityDelta)
		{
			weakenThreads += 1;
		}
		var weakenThreads = Math.min(weakenThreads, Math.floor(maxRam / wsRam));
		if(weakenThreads > 0)
		{
			ns.exec(weakenScript, ns.getHostname(), weakenThreads, target);
		}
		remainingRam = remainingRam - (weakenThreads * wsRam);

		if (ns.getServerMoneyAvailable(target) < moneyThresh) {
			var growThreads = Math.floor(remainingRam / gsRam);
			if(growThreads > 0)
			{
				ns.exec(growScript, ns.getHostname(), growThreads, target);
			}
			
		}
		else
		{			
			var hackThreads = Math.floor(remainingRam / hsRam);
			if(hackThreads > 0)
			{
				ns.exec(hackScript, ns.getHostname(), hackThreads, target);
			}
		}
		await ns.sleep(10000);
	}
}
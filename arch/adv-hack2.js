/** @param {NS} ns **/
export async function main(ns) {
	await ns.tprint("Running basic-hack v1");
	var target = ns.args[0];
	var moneyMax = await ns.getServerMaxMoney(target) * 0.90;
    var moneyThresh = await ns.getServerMaxMoney(target) * 0.75;
    var securityThresh = await ns.getServerMinSecurityLevel(target) + 5;

	var weakenScript = "weaken.js";
	var growScript = "grow.js";
	var hackScript = "heck.js";

	var wsRam = ns.getScriptRam(weakenScript);
	var gsRam = ns.getScriptRam(growScript);
	var hsRam = ns.getScriptRam(hackScript);

	var maxRam = ns.getServerMaxRam(ns.getHostname());
	
	while(true) 
	{
		var securityLevel = await ns.getServerSecurityLevel(target);
		var securityDelta = securityLevel - securityThresh;
		var remainingRam = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());

		var weakenThreads = getNeededWeakenThreads(ns);
		var growThreads = 0;
		var hackThreads = 0;

		var moneyPerHack = ns.hackAnalyze(target);
		hackThreads = (moneyMax - moneyThresh) / moneyPerHack;
		hackThreads = 
		

		if( * wsRam < remainingRam)
		{
			if(shouldGrow())
			{
				growThreads = Math.floor(remainingRam/gsRam);
				var secEffect = ns.growthAnalyzeSecurity(growThreads);
				getNeededWeakenThreads(ns, securityLevel + secEffect);
				var ramNeeded = wsRam*weakenThreads + gsRam*growThreads;

				
			}
			else //hack
			{
				do{
					var growThreads = Math.floor(remainingRam/gsRam);
					var secEffect = ns.growthAnalyzeSecurity(growThreads);
					getNeededWeakenThreads(ns, securityLevel + secEffect);
					var ramNeeded = wsRam*weakenThreads + gsRam*growThreads;
				} while(ramNeeded > remainingRam);
			}
		}








		
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

/** @param {NS} ns **/
function getHackThreads(ns, target)
{
	var singleHackMoney = await ns.hackAnalyze(target, );

}

/** @param {NS} ns **/
function shouldGrow(ns)
{
	return ns.getServerMoneyAvailable(target) < await ns.getServerMaxMoney(target) * 0.75;
}

/** @param {NS} ns **/
function getNeededWeakenThreads(ns, sec)
{
	var sec = await ns.getServerSecurityLevel(target);
	var secMin = await ns.getServerMinSecurityLevel(target);
	var weakenThreads = 0;
	var weakenEffect = ns.weakenAnalyze(weakenThreads + 1, 1);
	while((sec - weakenEffect) > secMin)
	{
		weakenThreads += 1;
	}
	return weakenThreads;
}

function getRamNeeded(ns, gt, wt)
{
	return (ns.getScriptRam(growScript) + ns.getScriptRam(wt));
}
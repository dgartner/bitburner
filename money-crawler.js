var accessedTargets = [];
var targetValues = []

/** @param {NS} ns **/
export async function main(ns) {
	accessedTargets = [];
	targetValues = [];
	ns.tprint("Running crawler.js");
	accessedTargets.push(ns.getHostname());
	await recursiveScan(ns, ns.getHostname());
	finish(ns);
}

/** @param {NS} ns **/
async function recursiveScan(ns, target)
{
	var subTargets = await ns.scan(target);
	//ns.tprint("Scanning from: " + target);
	
	for(let i = 0; i < subTargets.length; i++)
	{
		var sTarget = subTargets[i];
		if(accessedTargets.includes(sTarget)){
			continue;
		}
		else{
			accessedTargets.push(sTarget)
			if(ns.hasRootAccess(sTarget) && ns.getServerRequiredHackingLevel(target) < 200)
			{
				await makeItHappen(ns, sTarget);
			}
			await recursiveScan(ns, sTarget);
		}
	}
}

/** @param {NS} ns **/
async function makeItHappen(ns, target)
{
	var maxMoney = ns.getServerMaxMoney(target);
	var curMoney = ns.getServerMoneyAvailable(target);
	var percentfull = (curMoney / maxMoney) * 100;
	var hackLevel = ns.getServerRequiredHackingLevel(target);
	var level = ns.getServerMinSecurityLevel(target);
	var secPer = ns.getServerSecurityLevel(target) / level;

	var minMoney = 500 * 1000000;
	var maxHackNeeded = 1000;

	if(maxMoney >= minMoney && hackLevel <= maxHackNeeded)
	{
		targetValues.push([target, maxMoney, curMoney, percentfull]);
		ns.tprint("Target: " + target + " -- " + "Money:               " + maxMoney / 1000000);
		ns.tprint("Target: " + target + " -- " + "hackLevel:           " + hackLevel);
		ns.tprint("Target: " + target + " -- " + "min secLevel:        " + level);
		ns.tprint("Target: " + target + " -- " + "Security Percentage: " + secPer);
		ns.tprint("--------------------------------");
		//ns.tprint("  Max/level: " + );
		// ns.tprint("   Max: " + maxMoney);
		// ns.tprint("   Cur: " + curMoney);
		// ns.tprint(ns.sprintf("   Per: %2.2f%%", percentfull));
	}
	await ns.sleep(1);
}

/** @param {NS} ns **/
function finish(ns)
{
	var highestMaxTarget = "NONE";
	var highestMax = 0;
	var highestPercentTarget = "NONE";
	var highestPercent = 0;
	for(let i = 0; i < targetValues.length; i++)
	{
		var iTarget = targetValues[i][0];
		var iMax = targetValues[i][1];
		var iPercent = targetValues[i][3];
		if(iMax > highestMax)
		{
			highestMax = iMax;
			highestMaxTarget = iTarget;
		}
		if(iPercent > highestPercent)
		{
			highestPercent = iPercent;
			highestPercentTarget = iTarget;
		}
	}

	ns.tprint("Highest Max: " + highestMaxTarget + " at " + highestMax);
	ns.tprint("Highest Percent: " + highestPercentTarget + " at " + sprintf("%2.2f%%", highestPercent));
}
/** @param {NS} ns **/
export async function main(ns) {
	await ns.tprint("Running basic-hack v1");
	var target = ns.args[0];
    var moneyThresh = await ns.getServerMaxMoney(target) * 0.75;
    var securityThresh = await ns.getServerMinSecurityLevel(target) + 5;
	while(true) 
	{
		if (ns.getServerSecurityLevel(target) > securityThresh) {
			await ns.weaken(target);
		} else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
			await ns.grow(target);
		} else {
			await ns.hack(target);
		}
	}
}
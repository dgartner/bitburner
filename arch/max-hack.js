/** @param {NS} ns **/
export async function main(ns) {
	var target = ns.args[0];
	while(true) {
			if (await ns.getServerSecurityLevel(target) > securityThresh) {
				await ns.weaken(target);
			} else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
				await ns.grow(target);
			} else {
				await ns.hack(target);
			}
		}
}
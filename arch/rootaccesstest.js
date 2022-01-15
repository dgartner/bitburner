/** @param {NS} ns **/
export async function main(ns) {
	ns.tprint(ns.hasRootAccess(ns.args[0]));
}
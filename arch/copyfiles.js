/** @param {NS} ns **/
export async function main(ns) {
	var target = ns.args[0];
	await ns.scp("hack.js", "home", target);
	await ns.scp("hack-all.js", "home", target);
	await ns.scp("basic-hack.js", "home", target);
	await ns.scp("nuke-all.js", "home", target);
	await ns.scp("copyfiles.js", "home", target);
}
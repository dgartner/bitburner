/** @param {NS} ns **/
export async function main(ns) {
	await ns.exec("nuke-all.js", "home");
	await ns.exec("hack-all.js", "home");
	await ns.exec("remote-hack.js", "home", 1, "n00dles");
}
/** @param {NS} ns **/
export async function main(ns) {
	var targets = ns.scan();

	targets.forEach(function(target)
	{
		if (ns.fileExists("BruteSSH.exe", "home")) {
			ns.brutessh(target);
		}
		if (ns.fileExists("FTPCrack.exe", "home")) {
			ns.ftpcrack(target);
		}
		ns.nuke(target);
	})
}
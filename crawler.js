class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.accessedTargets = [this.hostname];
	}

	async run() {
		await this.recursiveScan(this.hostname);
	}

	/** @param {NS} ns **/
	async recursiveScan(target)
	{
		this.recurseDepth++;
		var subTargets = this.ns.scan(target);
		//ns.tprint("Scanning from: " + target);
		
		for(let i = 0; i < subTargets.length; i++)
		{
			var sTarget = subTargets[i];
			if(this.accessedTargets.includes(sTarget)){
				continue;
			}
			else{
				this.accessedTargets.push(sTarget)
				await this.doAction(sTarget);
				await this.recursiveScan(sTarget);
			}
		}
		this.recurseDepth--;
	}

	async doAction(target) {
		if(target == this.hostname)
		{
			return;
		}
		if(this.nukeTarget(target))
		{
			this.ns.exec("hack.js", this.hostname, 1, target);
		}
		await this.ns.sleep(1);
	}

	nukeTarget(target) {
		var openedPorts = 0;
		if (this.ns.fileExists("BruteSSH.exe", "home")) {
			this.ns.brutessh(target);
			openedPorts++;
		}
		if (this.ns.fileExists("FTPCrack.exe", "home")) {
			this.ns.ftpcrack(target);
			openedPorts++;
		}
		if (this.ns.fileExists("relaySMTP.exe", "home")) {
			this.ns.relaysmtp(target);
			openedPorts++;
		}
		if (this.ns.fileExists("HTTPWorm.exe", "home")) {
			this.ns.httpworm(target);
			openedPorts++;
		}
		if (this.ns.fileExists("SQLInject.exe", "home")) {
			this.ns.sqlinject(target);
			openedPorts++;
		}
		if(this.ns.getServerNumPortsRequired(target) <= openedPorts){
			var result = this.ns.nuke(target) ? "SUCCESS" : "FAILURE";
			this.ns.tprint("Nuking " + target + ": " + result);
			return result == "SUCCESS";
		}
		return false;
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
}
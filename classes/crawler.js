export class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.servers = [ns.getServer(this.hostname)];
	}

	async run() {
		await this.recursiveScan(this.servers[0]);
	}

	/** @param {NS} ns **/
	async recursiveScan(server)
	{
		this.recurseDepth++;
		var subTargets = this.ns.scan(server.hostname);
		//ns.tprint("Scanning from: " + target);
		
		for(let i = 0; i < subTargets.length; i++)
		{
			var sTarget = subTargets[i];
			var server = this.ns.getServer(sTarget);
			if(this.servers.includes(server))
			{
				continue;
			}
			else{
				this.servers.push(this.ns.getServer(server));
				await this.recursiveScan(server);
			}
		}
		this.recurseDepth--;
	}

	nukeAll()
	{
		this.servers.forEach(this.nukeServer(server));
	}

	nukeServer(server) {
		var openedPorts = 0;
		if (this.ns.fileExists("BruteSSH.exe", "home")) {
			this.ns.brutessh(server.hostname);
			openedPorts++;
		}
		if (this.ns.fileExists("FTPCrack.exe", "home")) {
			this.ns.ftpcrack(server.hostname);
			openedPorts++;
		}
		if (this.ns.fileExists("relaySMTP.exe", "home")) {
			this.ns.relaysmtp(server.hostname);
			openedPorts++;
		}
		if (this.ns.fileExists("HTTPWorm.exe", "home")) {
			this.ns.httpworm(server.hostname);
			openedPorts++;
		}
		if (this.ns.fileExists("SQLInject.exe", "home")) {
			this.ns.sqlinject(server.hostname);
			openedPorts++;
		}
		if(this.ns.getServerNumPortsRequired(server.hostname) <= openedPorts){
			var result = this.ns.nuke(server.hostname) ? "SUCCESS" : "FAILURE";
			this.ns.tprint("Nuking " + server.hostname + ": " + result);
			return result == "SUCCESS";
		}
		return false;
	}

	getServerList()
	{
		return this.servers;
	}

	getHackworthyServers()
	{
		let tempservers = [];
		for(let i = 0; i < this.servers.length; i++)
		{
			let server = this.servers[i];
			if(server.moneyMax > 0)
			{
				tempservers.push(server);
			}
		}
		return tempservers;
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
}
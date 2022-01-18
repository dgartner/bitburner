export class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.servers = [this.hostname];
	}

	async run() {
		await this.recursiveScan(this.hostname);
	}

	/** @param {NS} ns **/
	async recursiveScan(server)
	{
		this.recurseDepth++;
		var subTargets = this.ns.scan(server);
		//ns.tprint("Scanning from: " + target);
		
		for(let i = 0; i < subTargets.length; i++)
		{
			var sTarget = subTargets[i];
			var server = this.ns.getServer(sTarget);
			if(this.servers.includes(sTarget))
			{
				continue;
			}
			else{
				this.servers.push(sTarget);
				await this.recursiveScan(sTarget);
			}
		}
		this.recurseDepth--;
	}

	async nukeAll()
	{
		await this.run();
		this.servers.forEach(server => this.nukeServer(server));
	}

	nukeServer(server) {
		var openedPorts = 0;
		if (this.ns.fileExists("BruteSSH.exe", "home")) {
			this.ns.brutessh(server);
			openedPorts++;
		}
		if (this.ns.fileExists("FTPCrack.exe", "home")) {
			this.ns.ftpcrack(server);
			openedPorts++;
		}
		if (this.ns.fileExists("relaySMTP.exe", "home")) {
			this.ns.relaysmtp(server);
			openedPorts++;
		}
		if (this.ns.fileExists("HTTPWorm.exe", "home")) {
			this.ns.httpworm(server);
			openedPorts++;
		}
		if (this.ns.fileExists("SQLInject.exe", "home")) {
			this.ns.sqlinject(server);
			openedPorts++;
		}
		if(this.ns.getServerNumPortsRequired(server) <= openedPorts){
			var result = this.ns.nuke(server) ? "SUCCESS" : "FAILURE";
			this.ns.tprint("Nuking " + server + ": " + result);
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
			let server = this.ns.getServer(this.servers[i]);
			if(server.moneyMax > 0)
			{
				let hackThreshold = Math.max(this.ns.getPlayer().hacking * 0.25, 50);
				if(server.requiredHackingSkill < hackThreshold)
				{
					tempservers.push(server.hostname);
				}
			}
		}
		return tempservers;
	}

	async infestAll()
	{
		await this.run();
		for(let i = 0; i < this.servers.length; i++)
		{
			await this.infest(this.servers[i]);
		}
	}

	async infest(server)
	{
		let serv = this.ns.getServer(server);
		if(serv.hasAdminRights)
		{
			let threads = serv.maxRam / this.ns.getScriptRam("basic-hack.js");
			if(threads > 0)
			{		
				await this.ns.scp("basic-hack.js", server);
				this.ns.tprint("Basic Hacking " + server);
				this.ns.exec("basic-hack.js", server, threads, server);
			}
		}
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
	crawler.nukeAll();
	await crawler.run();
	await crawler.infestAll();
}
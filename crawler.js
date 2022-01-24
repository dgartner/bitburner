import { ServerModel } from "./ServerModel";

export class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.servers = [new ServerModel(ns, this.hostname)];
		this.servernames = [this.hostname];
		this.hitDuringScan = [];
	}

	async run() {
		this.hitDuringScan = [this.hostname];
		let purchasedServers = this.ns.getPurchasedServers();
		for(let i = 0; i < purchasedServers; i++)
		{
			let pserv = purchasedServers[i];
			if(!this.servernames.includes(pserv))
			{
				this.servernames.push(pserv);
				this.servers.push(new ServerModel(this.ns, pserv));
			}
		}
		this.servernames.push(purchasedServers);
		purchasedServers.forEach(pserv => this.servers.push(new ServerModel(this.ns, pserv)));
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
			var serverName = subTargets[i];
			var server = this.ns.getServer(serverName);
			if(!this.hitDuringScan.includes(serverName))
			{
				this.hitDuringScan.push(serverName);
				if(!this.servernames.includes(serverName))
				{
					this.servers.push(new ServerModel(this.ns, serverName));
					this.servernames.push(serverName);
				}
				await this.recursiveScan(serverName);
			}
		}
		this.recurseDepth--;
	}

	async killall()
	{
		await this.run();
		this.servers.forEach(server => this.ns.killall(server));
	}

	async nukeAll()
	{
		await this.run();
		this.servers.forEach(server => this.nukeServer(server));
	}

	nukeServer(server) {
		if (this.ns.fileExists("BruteSSH.exe", "home")) {
			this.ns.brutessh(server.getHostname());
		}
		if (this.ns.fileExists("FTPCrack.exe", "home")) {
			this.ns.ftpcrack(server.getHostname());
		}
		if (this.ns.fileExists("relaySMTP.exe", "home")) {
			this.ns.relaysmtp(server.getHostname());
		}
		if (this.ns.fileExists("HTTPWorm.exe", "home")) {
			this.ns.httpworm(server.getHostname());
		}
		if (this.ns.fileExists("SQLInject.exe", "home")) {
			this.ns.sqlinject(server.getHostname());
		}
		if(server.isNukeable()){
			server.nuke();
		}
		return false;
	}

	async copyBasicScripts()
	{
		for(let i = 0; i < this.servers.length; i++)
		{
			let server = this.servers[i];
			if(server.getHostname() == this.hostname) continue;
			await this.ns.scp("weaken.js", this.hostname, server.getHostname());
			await this.ns.scp("grow.js", this.hostname, server.getHostname());
			await this.ns.scp("hack.js", this.hostname, server.getHostname());
		}
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
			if(server.getMaxMoney() > 0)
			{
				let hackThreshold = Math.max(this.ns.getPlayer().hacking * 0.70, 50);
				if(server.getHostname() == "home") continue;
				//if(server.getHostname() == "n00dles") continue;
				if(server.getRequiredHackLevel() < hackThreshold 
				&& server.hasAdminRights())
				{
					tempservers.push(server);
				}
			}
		}
		return tempservers;
	}

	getControlableServerList()
	{
		return this.servers.filter(this.isControlable);
	}

	isControlable(server)
	{
		return server.hasAdminRights();
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
	ns.tprint(crawler.servernames);
}
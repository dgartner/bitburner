class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.accessedTargets = [this.hostname];
		this.recurseStack = [];
		this.pathsToTarget = [];
	}

	async run() {
		await this.recursiveScan(this.hostname);
	}

	/** @param {NS} ns **/
	async recursiveScan(target)
	{
		this.recurseDepth++;
		this.recurseStack.push(target);
		var subTargets = this.ns.scan(target);
		//ns.tprint("Scanning from: " + target);
		
		for(let i = 0; i < subTargets.length; i++)
		{
			var sTarget = subTargets[i];
			if(this.accessedTargets.includes(sTarget)){
				continue;
			}
			else{
				this.accessedTargets.push(sTarget);
				await this.recursiveScan(sTarget);
			}
			await this.ns.sleep(1);
		}
		this.recurseStack.pop();
		this.recurseDepth--;
	}

	getAllRootAccess()
	{
		var rootAccess = []
		for(let i = 1; i < this.accessedTargets.length; i++)
		{
			if(this.ns.hasRootAccess(this.accessedTargets[i]) && this.ns.getServerMaxMoney(this.accessedTargets[i]) > 0)
			{
				rootAccess.push(this.accessedTargets[i]);
			}
		}
		return rootAccess;
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
	var targets = crawler.getAllRootAccess();
	ns.tprint(targets);
	var maxRam = ns.getServerMaxRam(ns.getHostname());// - ns.getScriptRam("phase2.js");
	var maxTargets = Math.min(64, targets.length);
	for(var i = 0; i < targets.length; i++)
	{
		ns.tprint("Smarthacking " + targets[i]);
		ns.exec("smarthack.js", ns.getHostname(),  1, targets[i], maxRam/maxTargets);
	}
}
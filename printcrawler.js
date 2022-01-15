class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.accessedTargets = [this.hostname];
		this.recurseStack = [];
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
				this.accessedTargets.push(sTarget)
				await this.doAction(sTarget);
				await this.recursiveScan(sTarget);
			}
		}
		this.recurseStack.pop();
		this.recurseDepth--;
	}

	async doAction(target) {
		this.ns.tprint(this.recurseDepth + target);
		this.ns.tprint(this.recurseStack);
		await this.ns.sleep(1);
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
}
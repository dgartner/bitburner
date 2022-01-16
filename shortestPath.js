class Crawler {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.recurseDepth = 0;
		this.hostname = this.ns.getHostname();
		this.accessedTargets = [this.hostname];
		this.recurseStack = [];
		this.pathsToTarget = [];
		this.targetServer = ns.args[0];
	}

	async run() {
		this.ns.tprint("Looking for " + this.targetServer);
		await this.recursiveScan(this.hostname);
		this.finish();
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
			if(this.recurseStack.includes(sTarget)){
				continue;
			}
			else{
				this.accessedTargets.push(sTarget);
				if(sTarget == this.targetServer)
				{
					await this.doAction(sTarget);
					continue;
				}
				await this.recursiveScan(sTarget);
			}
		}
		this.recurseStack.pop();
		this.recurseDepth--;
	}

	async doAction(target) {
		this.ns.tprint(this.recurseStack);
		this.pathsToTarget.push(this.recurseStack);
		this.ns.tprint(this.pathsToTarget);
		await this.ns.sleep(1);
	}

	finish() {
		var minPathLength = 10000;
		var minPathIndex = 0;
		for( var i = 0; i < this.pathsToTarget.length; i++)
		{
			if(this.pathsToTarget[i].length < minPathLength)
			{
				minPathLength = this.pathsToTarget[i].length;
				minPathIndex = i;
			}
		}
		this.ns.tprint(this.pathsToTarget[minPathIndex]);
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	var crawler = new Crawler(ns);
	await crawler.run();
}
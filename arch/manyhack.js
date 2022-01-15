class ManyHacker {
	/** @param {NS} ns **/
	constructor(ns, targets) {
		this.ns = ns;
		this.targets = targets;
	}

	run() {
		while(true) {
			
			this.ns.sleep(10);
		}
	}

	get surplusSecurity(target) {
		return this.ns.getServerSecurityLevel(target) - this.ns.getServerMinSecurityLevel(target);
	}

	get hackRam () { return this.ns.getScriptRam("heck.js"); }
	get weakenRam() { return this.ns.getScriptRam("weaken.js"); }
	get growRam() { return this.ns.getScriptRam("grow.js"); }

	get remainingRam() { return this.ns.getServerMaxRam(this.ns.getHostname()) - this.ns.getServerUsedRam(this.ns.getHostname()); }
}
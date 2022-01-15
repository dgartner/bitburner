class Hacker {
	/** @param {NS} ns **/
	constructor(ns) {
		this.ns = ns;
		this.hostname = ns.getHostname();
		this.availableRam = ns.getServerMaxRam();
	}

	//build server priority list
	//for each server in the list
		//analyze security and run weaken
		//analyze money and hack down to 75% money
		//grow back to 100%

	getWeakenThreads(target)
	{
		var curSec = this.ns.getServerSecurityLevel(target);
		var minSec = this.ns.getServerMinSecurityLevel(target);
		

	}

	runWeaken()


}
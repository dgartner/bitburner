/** @param {NS} ns **/
export async function main(ns) {
	
	var hosts = await ns.scan();
	hosts.forEach(function(host)
	{
		if(host != "home")
		{
			ns.tprint("Running hack.js " + host + ": " + ns.exec("hack.js", ns.getHostname(), 1, host));
		}
	})
}
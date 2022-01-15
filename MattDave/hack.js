/** @param {NS} ns **/
export async function main(ns) 
{
    let target = ns.args[0];
    let dropPoint = ns.args[1];

    var hackTime = ns.getHackTime(target);
    ns.writePort(dropPoint, hackTime);

    ns.hack(target);
}
/** @param {NS} ns **/
export async function main(ns) 
{
    let target = ns.args[0];
    let dropPoint = ns.args[1];

    var weakenTime = ns.getWeakenTime(target);
    ns.writePort(dropPoint, weakenTime);

    ns.weaken(target);
}
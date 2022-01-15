/** @param {NS} ns **/
export async function main(ns) 
{
    let target = ns.args[0];
    let dropPoint = ns.args[1];

    var growTime = ns.getGrowTime(target);

    ns.writePort(dropPoint, growTime);

    ns.grow(target);
}
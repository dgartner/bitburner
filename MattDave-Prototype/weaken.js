/** @param {NS} ns **/
export async function main(ns) 
{
    let target = ns.args[0];
    let actionId = ns.args[1];

    let actionDetails = [target, actionId];

    ns.sprintf("Running Weaken Action: %s", JSON.stringify(actionDetails));

    await ns.weaken(target);
}
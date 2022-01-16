/** @param {NS} ns **/
export async function main(ns) 
{
    let target = ns.args[0];
    let actionId = ns.args[1];

    let actionDetails = [target, actionId];

    ns.sprintf("Running Hack Action: %s", JSON.stringify(actionDetails));

    await ns.hack(target);
}
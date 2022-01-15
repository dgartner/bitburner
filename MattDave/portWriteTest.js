/** @param {NS} ns **/
export async function main(ns) 
{
    let statuses = new Array();
    statuses[0] = true;
    statuses[1] = false;
    statuses[2] = true;

    var test = "true,false,true";

    ns.writePort(2, test);
}
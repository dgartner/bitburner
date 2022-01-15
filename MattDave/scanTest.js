/** @param {NS} ns **/
export async function main(ns) 
{
    let result = ns.scan(ns.args[0]);

    for (var i = 0; i < result.length; i++)
    {
        ns.tprint("Result: " + result[i]);
    }
}
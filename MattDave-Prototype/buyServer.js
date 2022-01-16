/** @param {NS} ns **/
export async function main(ns) 
{
    if (ns.args[0])
    {
        let name = ns.args[0];
        let ram = ns.args[1];

        ns.tprintf("Purchasing server\n\tName: %s\n\tRam: %d", name, ram);
        ns.purchaseServer(name, ram);
    }
    else
    {
        for (var i = 1; i < 10; i++)
        {
            let targetRam = Math.pow(2, i);
            let cost = ns.getPurchasedServerCost(targetRam);

            ns.tprintf("Ram %d: %d", targetRam, cost);
        }
    }
}
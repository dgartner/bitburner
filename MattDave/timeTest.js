/** @param {NS} ns **/
export async function main(ns)
 {
     ns.tprint(ns.getTimeSinceLastAug());
     

     await sleep(1 * 1000);
     ns.tprint(ns.getTimeSinceLastAug());
}



function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
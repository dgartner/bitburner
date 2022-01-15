/** @param {NS} ns **/
export async function main(ns) 
{
    let result = ns.peek(ns.args[0]);

    let jResult = JSON.parse(result);
   
    ns.tprint("result\n\t" + result);

    ns.tprint("json:\n");
    jResult.forEach(function(value)
    {
        ns.tprint("\tAgent Details:");
        ns.tprint("\t\tName: " + value['name']);
        ns.tprint("\t\tHomeworld: " + value['homeworld']);
        ns.tprint("\t\tStatus: " + value['status']);
    });


}
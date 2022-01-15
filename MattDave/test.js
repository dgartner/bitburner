/** @param {NS} ns **/

var ready = false;

export async function main(ns) 
{
    ns.tprint("Starting test.");

    callbackTest(ns);


    while (true)
    {
        if(ready)
        {
            await ns.grow("n00dles");
            break;
        }

        await sleep(10 * 1000);
    }

}

async function callbackTest(ns)
{
    await ns.weaken("n00dles");
    ready = true;
}

function callTest(ns)
{
    ready = true;
}

function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}
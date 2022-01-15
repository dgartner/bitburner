var home = "home";
var weakenScript = "weaken.script";
var growScript = "grow.script";
var hackSCript = "hack.script";
var fuckScript = "newFucker.script";
var hackScript = "newFucker.script";
var sendScript = "sendIt.script";

/** @param {NS} ns **/
export async function main(ns) 
{
    ns.tprint("Scanning");

    var results = ns.scan("home");

    var targetList = new Array();

    for (var i = 0; i < results.length; i++)
    {
        targetList.push(results[i]);

        var secondLayer = ns.scan(results[i]);
        for (var k = 0; k < secondLayer.length; k++)
        {
            if (secondLayer[k] == "home" || secondLayer[k] == "n00dles" || secondLayer[k] == "CSEC" || secondLayer[k] == "Grove-1" || secondLayer[k] == "Grove-2")
                continue;

            if (targetList.includes(secondLayer[k]))
                continue;
                
            targetList.push(secondLayer[k]);
        }
    }


    for (var i = 0; i < targetList.length; i++)
    {
        var target = targetList[i];

        ns.tprint("Analysing target: " + target);
        var poorFucker = ns.getServer(target);

        if (poorFucker.sshPortOpen)
            ns.tprint("Target SSH Port: Open");
        else
        {
            if (ns.fileExists("BruteSSH.exe", "home"))
            {
                ns.tprint("Opening SSH Port.");
                ns.brutessh(target);

                poorFucker = ns.getServer(target);
            }
        }

        var alreadyFucked = ns.isRunning(hackScript, target, target);

        //
        if(alreadyFucked)
            ns.tprint("'" + target + "' is already fucked >:D");
        else
        {
            ns.tprint("'" + target + "' is ripe for the fuckening!");

            var portsRequired = poorFucker.numOpenPortsRequired;
            var openPorts = poorFucker.openPortCount;

            ns.tprint("\tOpen ports: " + openPorts + " (" + portsRequired + " required)");

            if (portsRequired > openPorts)
            {    
                ns.tprint("\tSad day...");
                // poorFucker = getServer(target);

                // portsRequired = poorFucker.numOpenPortsRequired;
                // openPorts = poorFucker.openPortCount;

                // ns.tprint("Brute outcome\n\tOpen ports: " + openPorts + " (" + portsRequired + " required)");
            }

            if (portsRequired <= openPorts)
            {
                ns.tprint("\tGet fucked!");
                ns.nuke(target);

                ns.tprint("\tYeet Virus");
                await ns.scp(fuckScript, "home", target);
                await ns.scp(weakenScript, "home", target);
                await ns.scp(growScript, "home", target);
                await ns.scp(hackSCript, "home", target);

                // TODO use lscpu to find out how many threads I can run

                // TODO Break up the scripts so I can have one master script calling the others as needed

                ns.tprint("\tExecute");
                var result = ns.exec(fuckScript, target, 1, target);
                ns.tprint("\tResult: " + result);
            }
        }
    }
}
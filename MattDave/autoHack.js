/** @param {NS} ns **/
export async function main(ns) 
{
    while(true)
    {
            var currentMoney = ns.getPlayer().money;

            ns.print("Starting loop with funds = " + currentMoney);
            
            var nextNodeCost = ns.hacknet.getPurchaseNodeCost();

            // Purchase next node when it cost X of current funds available
            if (nextNodeCost / currentMoney <= ns.args[0])
            {
                ns.print("Purchasing new HackNet node. Cost: " + nextNodeCost);
                ns.hacknet.purchaseNode();

                currentMoney = currentMoney - nextNodeCost;
            }

            for (var i = 0; i < ns.hacknet.numNodes(); i++)
            {
                var nodeStats = ns.hacknet.getNodeStats(i);

                var levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(i, 5);
                
                // Purchase level upgrade if it costs (X*2) of current funds
                if (levelUpgradeCost / currentMoney <= (ns.args[0] * 2))
                {
                    ns.print("Purchasing 5 level upgrades for HackNet[" + i + "] for: " + levelUpgradeCost);
                    ns.hacknet.upgradeLevel(i, 5);

                    currentMoney = currentMoney - levelUpgradeCost;
                }
            }

            await sleep(10 * 1000);
    }
}

function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}
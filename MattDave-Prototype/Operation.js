import * as Constants from "./constants";

export class Operation
{
    constructor(target, action, agentsRequired, operationDuration, operationCompletion)
    {
        this.target = target;
        this.action = action;
        this.agentsRequired = agentsRequired;
        this.operationDuration = operationDuration;
        this.operationCompletion = operationCompletion;
    }

    /** @return {Number} */
    getOperationCompletion() { return this.operationCompletion; }

    /** @return {Number} */
    getOperationDuration() { return this.operationDuration; }

    /** @return {String} */
    getTarget() { return this.target; }

    /** @return {String} */
    getAction() { return this.action; }

    /** @return {String} */
    getActionScript() 
    {
        let scriptName = null
        switch(this.action)
        {
            case Constants.AGENT_HACK:
                scriptName = Constants.HACKER_SCRIPT;
            break;
            case Constants.AGENT_GROW:
                scriptName = Constants.GROW_SCRIPT;
            break;
            case Constants.AGENT_WEAK:
                scriptName = Constants.WEAKEN_SCRIPT;
            break;
        }

        return scriptName;
    }

    /** @return {number} */
    getAgentsRequired() { return this.agentsRequired; }
}
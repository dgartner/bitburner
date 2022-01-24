import { FieldWork } from "./FieldWork";

/**
 * Responsible for tracking the number of available agents in a homeworld.
 * Also tracks available agents, agents in the field, and when deployed 
 * agents will be available for a new assignment.
 */
export class Agency {
    /**
     * @param {NS} ns
     * @param {String} homeworld
     * @param {Number} capacity
     * @param {Number} agentCost
     */
    constructor(ns, homeworld, capacity, agentCost) {
        this.ns = ns;
        this.homeworld = homeworld;

        let maxRam = this.ns.getServerMaxRam(this.homeworld);
        let usedRam = this.ns.getServerUsedRam(this.homeworld);

        let availableRam = maxRam - usedRam;
        let availableAgentCount = Math.floor(availableRam / agentCost);

        this.availableAgents = availableAgentCount;

        this.agentCost = agentCost;
        this.ongoingOperations = new Array();
        this.operationCount = 0;
    }

    /** @returns {String} */
    getHomeworld() { return this.homeworld; }

    /**
     * @param {Number} agentCost
     * @returns {Number}
     */
    getAvailableAgents() {
        let maxRam = this.ns.getServerMaxRam(this.homeworld);
        let usedRam = this.ns.getServerUsedRam(this.homeworld);

        let availableRam = maxRam - usedRam;
        let availableAgentCount = Math.floor(availableRam / this.agentCost);

        this.availableAgents = availableAgentCount;

        // if (this.homeworld == home)
        //     this.availableAgents = this.availableAgents - 50;

        return this.availableAgents;
    }

    /** @returns {Array<String>} */
    getActiveTargetList() {
        let timestamp = this.ns.getTimeSinceLastAug();

        this.ongoingOperations = this.ongoingOperations.filter(filterOngoingAssignments, timestamp);

        let activeTargets = this.ongoingOperations.map(mapOperationNames);
        return activeTargets;
    }

    /**
     * @param {String} scriptName
     * @param {String} target
     * @param {Number} numberOfAgents
     * @param {Number} completionTime
     * @param {Number} agentCost
     * 
     * @return {Number} committedAgents
     */
    deployAgents(scriptName, target, numberOfAgents, completionTime, globalOperationCount, runtimeReport) {
        this.operationCount = this.operationCount + 1;
        this.ns.print(this.ns.sprintf("\n\tHomeworld: %s\n\tCommence Operation #%d\n\tScript: %s\n\tTarget: %s\n\tNumber of Agents: %d\n\tCompletion Time: %d", this.homeworld, this.operationCount, scriptName, target, numberOfAgents, completionTime));

        // Add an extra 50ms to avoid potential timing issues
        completionTime = completionTime + 50;

        // Update available agent count
        this.getAvailableAgents();

        // Update available agents
        let actualNumberOfAgentsDeployed = Math.min(numberOfAgents, this.availableAgents);

        let operationCountReportLocal = this.ns.sprintf("%s Operation ID: %d", this.homeworld, this.operationCount);
        let operationCountGlobal = this.ns.sprintf("Global Operation ID: %d", globalOperationCount);
        let result = this.ns.exec(scriptName, this.homeworld, actualNumberOfAgentsDeployed, target, actualNumberOfAgentsDeployed, runtimeReport, operationCountReportLocal, operationCountGlobal);
        if (result != 0) {
            // Track newly deployed agents
            let fieldWork = new FieldWork(target, completionTime, actualNumberOfAgentsDeployed);
            this.ongoingOperations.push(fieldWork);
        }
        else {
            this.ns.print(this.ns.sprintf("Failed to launch the operation %d", this.operationCount));
            return 0;
        }

        return actualNumberOfAgentsDeployed;
    }
}

/** @param {FieldWork} fieldWork */
function filterOngoingAssignments(fieldWork)
{
    return fieldWork.timestamp > this;
}

/** @param {FieldWork} fieldWork */
function mapOperationNames(fieldWork)
{
    return fieldWork.target;
}

/** @param {FieldWork} fieldWork */
function filterCompletedAssignments(fieldWork)
{
    return fieldWork.timestamp <= this;
}
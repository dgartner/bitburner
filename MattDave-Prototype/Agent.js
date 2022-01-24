export class Agent
{
    constructor(name, homeworld, status, readyTime)
    {
        this.name = name;
        this.homeworld = homeworld;
        this.readyTime = readyTime;

        // Set detault status
        if (!status)
            status = AGENT_READY;

        this.status = status;
    }

    /** @param {String} target
     * @param {Number} readyTime
     */
    assignFieldWork(target, readyTime)
    {
        this.target = target;
        this.readyTime = readyTime;
    }

    /** @returns {String} */
    getCurrentTarget() { return this.target; };

    /** @param {Number} readyTime */
    setReadyTime(readyTime) { this.readyTime = readyTime; }

    /** @returns {Number} */
    getReadyTime() { return this.readyTime; }

    readyUp()
    {
        this.status = AGENT_READY;
    }

    setStatus(status)
    {
        this.status = status;
    }

    getHomeworld()
    {
        return this.homeworld;
    }

    getName()
    {
        return this.name;
    }

    getStatus()
    {
        return this.status;
    }
}

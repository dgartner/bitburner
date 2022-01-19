export class ServerData
{
    constructor(hostname, isHackable, hasAdminRights, maxMoney, currentMoney, minSecurity, currentSecurity, numberOfCores)
    {
        this.hostname = hostname;
        this.isHackable = isHackable;
        this.hasAdminRights = hasAdminRights;
        this.maxMoney = maxMoney;
        this.currentMoney = currentMoney;
        this.minSecurity = minSecurity;
        this.currentSecurity = currentSecurity;
        this.numberOfCores = numberOfCores;
    }

    /** @return {boolean} */
    hasAdminRights() { return this.hasAdminRights; }
    
    /** @returns {String} */
    getHostname() { return this.hostname; }

    /** @returns {boolean} */
    isHackable() { return this.isHackable; }

    /** @returns {number} */
    getMaxMoney() { return this.maxMoney; }

    /** @returns {Number} */
    getCurrentMoney() { return this.currentMoney; }

    /** @returns {Number} */
    getMinSecurity() { return this.minSecurity; }

    /** @returns {Number} */
    getCurrentSecurity() { return this.currentSecurity; }

    /** @returns {Number} */
    getNumberOfCores() { return this.numberOfCores; }
}
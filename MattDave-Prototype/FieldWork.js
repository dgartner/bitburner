/**
 * Used to track ongoing operaitons
 */
 export class FieldWork
 {
     /**
      * @param {string} target
      * @param {string} host
      * @param {Number} timestamp
      * @param {Number} agentCount
      */
     constructor(target, host, timestamp, agentCount)
     {
         this.target = target;
         this.host = host;
         this.timestamp = timestamp;
         this.agentCount = agentCount;
     }
 
     /** @returns {Number} */
     getTimestamp() { return this.timestamp; }
 
     /** @returns {String} */
     getTarget() { return this.target }
 }
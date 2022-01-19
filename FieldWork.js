/**
 * Used to track ongoing operaitons
 */
 export class FieldWork
 {
     /**
      * @param {Number} timestamp
      * @param {Number} agentCount
      */
     constructor(target, timestamp, agentCount)
     {
         this.target = target;
         this.timestamp = timestamp;
         this.agentCount = agentCount;
     }
 
     /** @returns {Number} */
     getTimestamp() { return this.timestamp; }
 
     /** @returns {String} */
     getTarget() { return this.target }
 }
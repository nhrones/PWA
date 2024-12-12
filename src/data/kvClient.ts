// deno-lint-ignore-file no-explicit-any
import { CollectionName, DEV, OrderDirection } from '../constants.ts'
import { kvCache } from '../main.ts'
import { buildDataTable } from '../view/domDataTable.ts'
import { orderData } from './order.ts'


// if in DEV mode we load from localhost + no pin
export const DBServiceURL = ( DEV ) 
   ? "http://localhost:9099/"
   : "https://ndh-kv-rpc.deno.dev/" 

export const RegistrationURL = DBServiceURL + "SSERPC/kvRegistration"

let nextMsgID = 0;

const transactions = new Map();

//-------------------------------------------------------------------------------
//                            KV-RPC Client
// Our database cache is transactionally consistent at the moment of creation.
// It is kept consistent by binding its transactions to all host DB transactions.
// This durable-shadowing provided the inherent consistency of the cache.
//-------------------------------------------------------------------------------

/** 
 * This db client communicates with an RPC service 
 */
export class KvClient {

   schema: any
   nextMsgID = 0
   querySet: any[] = []
   transactions
   currentPage = 1
   focusedRow = null

   constructor() {
      this.transactions = new Map()
   }

   /** initialize our EventSource and fetch some data */
   init() {
      const eventSource = new EventSource(RegistrationURL);
      console.log("CONNECTING");

      eventSource.addEventListener("open", () => {
         console.log("events.onopen - CONNECTED");
         // get the data
         this.fetchQuerySet()
      });

      eventSource.addEventListener("error", (_e) => {
         switch (eventSource.readyState) {
            case EventSource.OPEN:
               console.log("CONNECTED");
               break;
            case EventSource.CONNECTING:
               console.log("CONNECTING");
               break;
            case EventSource.CLOSED:
               console.log("DISCONNECTED");
               break;
         }
      });

      // When we get a message from the service we expect 
      // an object containing {msgID, error, and result}.
      // We then find the transaction that was registered for this msgID, 
      // and execute it with the error and result properities.
      // This will resolve or reject the promise that was
      // returned to the client when the transaction was created.
      eventSource.addEventListener("message", (evt) => {
         if (DEV) console.info('sse-message event - ', evt.data)
         const parsed = JSON.parse(evt.data);
         const { txID, error, result } = parsed;         // unpack
         if (txID === -1) { this.handleMutation(result) }// unsolicited mutation event
         if (!transactions.has(txID)) return             // check        
         const transaction = transactions.get(txID)      // fetch
         transactions.delete(txID)                       // clean up
         if (transaction) transaction(error, result)     // execute
      })

   }

   /**
    * handle Mutation Event
    * @param {{ rowID: any; type: any; }} result
    */
   handleMutation(result: { rowID: any; type: any; } ) {
      console.info(`Mutation event:`, result)
   }

   /** fetch a querySet */
   async fetchQuerySet() {
      if (DEV) console.log('Fetching data!')
      await callProcedure("GET", { collection: CollectionName, size: 1 })
         .then((result: any) => {
            if (DEV) console.log('Got result! ')
            restoreCache(result.value)
         })
   }

   /** get row from key */
   get(key: any) {
      for (let index = 0; index < this.querySet.length; index++) {
         const element = this.querySet[index];
         if (element.id === key) return element
      }
   }

   /** The `set` method mutates - will call the `persist` method. */
   set(key: any, value: any) {
      try {
         // persist single record to the service
         callProcedure("SET",
            {
               collection: CollectionName,
               id: key,
               value: value
            })
            .then((result: any) => {
               this.querySet = result.querySet
               return this.querySet
            })
      } catch (e) {
         return { Error: e }
      }
   }

} // End class

/** 
 * Make an Asynchronous Remote Proceedure Call
 *  
 * @param {any} procedure - the name of the remote procedure to be called
 * @param {any} params - appropriately typed parameters for this procedure
 * 
 * @returns {Promise<any>} - Promise object has a transaction that is stored by ID    
 *   in a transactions Set.   
 *   When this promise resolves or rejects, the transaction is retrieves by ID    
 *   and executed by the promise. 
 */
export const callProcedure = (
   procedure: any,
   params: any
): Promise<any> => {

   const txID = nextMsgID++;

   if (DEV) console.log(`RPC msg ${txID} called ${procedure}`);

   return new Promise((resolve, reject) => {
      transactions.set(txID, ( error: string | undefined, result: any) => {
         if (error)
            return reject(new Error(error));
         resolve(result);
      });
      fetch(DBServiceURL, {
         method: "POST",
         mode: 'cors',
         body: JSON.stringify({ txID, procedure, params })
      });
   });
};

/** restores our cache from a json string */
export function restoreCache(records: string) {
   const tasksObj = JSON.parse(records)
   kvCache.dbMap = new Map(tasksObj)
   if (DEV) console.log("Restored Cache from Kv")
   const result =kvCache.hydrate()
   if (result == 'ok') {
      orderData('host', OrderDirection.ASC)
      buildDataTable()
   }
}

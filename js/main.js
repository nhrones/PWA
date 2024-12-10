import { DEV } from './constants.js'
import { initDOMelements } from './view/domEventHandlers.js'
import { KvCache } from './data/kvCache.js'

/** 
 * A DB options object 
 * @member {schema} schema - used to describe the dataset.
 * @member {number} size - the size of our test dataset.   
 *    If a data set of that size is not currently   
 *    found in IndexedDB, one will be created.
*/
const options = {
   schema: {
      name: "PWA", sample: {
         id: -1,
         host: "",
         login: "",
         pw: "",
         remarks: ""
      }
   }
}

/** 
 * If a dataset of this size already exists in IDB, open it.   
 * Else, create a new dataset of this size and persist it to IDB.   
 * @param object options - the schema for the dataset.
 */
export const kvCache = new KvCache(options)

/**
 * Initialize the DataTable UI
 * This will setup for async dataload and paginate in DB-ctor
 */
await initDOMelements()

// initial data fetch and hydrate
const result = kvCache.hydrate()
console.log(result)
if (DEV && result =='Not found') {
   alert("In DEV please start local service!")
}
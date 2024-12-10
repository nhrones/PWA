
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
 * @param object options - the schema and size of the test dataset.
 * @returns -
 * */
export const kvCache = new KvCache(options)

/**
 * Initialize the DataTable UI
 * This will setup for async dataload and paginate in DB-ctor
 */
await initDOMelements()

// initial data fetch and hydrate
const result = kvCache.hydrate()
// no data found in IDB
if (result === null) {
   const h1 = document.getElementById('h1')
   if (h1) {
      h1.textContent = `Loading dataset! Please Wait!`
      h1.className = 'h1'
   }
   alert('No data!')
}
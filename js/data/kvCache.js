
import { buildDataTable } from '../view/domDataTable.js'
import { KvClient } from './kvClient.js'
import { DEV } from '../constants.js'

/** This `In-Memory-cache` leverages ES6-Maps. */
export class KvCache {

   IDB_KEY = ''
   schema
   nextMsgID = 0

   /** @type {any[]} */
   querySet = []

   /** @type {string | any[]} */
   columns = []

   /** @type {any} */
   kvClient

   /** @type {Map<number, string>} dbMap */
   dbMap = new Map()

   /** @type {any[]} */
   raw = []

   /** ctor
    * @param {{ schema: {  name: string, sample: {[key: string]: any}}, size: number; }} opts
    */
   constructor(opts) {
      this.IDB_KEY = `${opts.schema.name}`
      this.schema = opts.schema
      //this.dbWorker = new Worker('./js/kvdbWorker.js')
      this.callbacks = new Map()
      this.columns = this.buildColumnSchema(this.schema.sample)

      this.kvClient = new KvClient()
      this.kvClient.init()
   }

   /**
    * extract a set of column-schema from the DB.schema object
    * @param {{ [s: string]: any; } | ArrayLike<any>} obj
    */
   buildColumnSchema(obj) {
      const columns = []
      for (const [key, value] of Object.entries(obj)) {
         let read_only = false;
         if ((typeof value === 'number' && value === -1) ||
            (typeof value === 'string' && value === 'READONLY')) {
            read_only = true
         }
         columns.push({
            name: `${key}`,
            type: `${typeof value}`,
            readOnly: read_only,
            order: 'ASC'
         })
      }
      return columns
   }

   /**
    * Persist the current dbMap to an IndexedDB using         
    * our webworker. (takes ~ 90 ms for 100k records)    
    * This is called for any mutation of the dbMap (set/delete)
    * @param {Map<number, any>} map
    */
   persist(map) {
      if (DEV) console.log(`persist called! `)
      const valueString = JSON.stringify(Array.from(map.entries()))
      this.kvClient.set(["PWA"], valueString)
   }

   /** hydrate a dataset from a single raw record stored in kvDB */
   hydrate() {
      this.raw = [...this.dbMap.values()]
      this.querySet = [...this.raw]
      buildDataTable()
      return "ok"
   }

   /** resest the working querySet to original DB values */
   resetData() {
      this.querySet = [...this.raw]
   }

   /** The `set` method mutates - will call the `persist` method.
    * @param {number} key
    * @param {any} value
    * @param {string} from
    * @returns {string}
    */
   set(key, value, from) {
      if (DEV) console.log(`${from} set key ${key} val ${JSON.stringify(value)}`)
      try {
         this.dbMap.set(key, value)
         this.persist(this.dbMap)
         this.hydrate()
         return key.toString()
      } catch (e) {
         console.error('error putting ')
         return 'Error ' + e
      }
   }

   /** The `get` method will not mutate records
    * @param {number} key
    * @returns {*}
    */
   get(key) {
      try {
         const result = this.dbMap.get(key)
         return result
      } catch (e) {
         return 'Error ' + e
      }
   }

   /** The `delete` method mutates - will call the `persist` method.
    * @param {number} key
    * @returns {*}
    */
   delete(key) {
      try {
         const result = this.dbMap.delete(key)
         if (result === true) this.persist(this.dbMap)
         this.hydrate()
         return result
      } catch (e) {
         return 'Error ' + e
      }
   }
}

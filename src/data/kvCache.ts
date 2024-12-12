// deno-lint-ignore-file no-explicit-any

import { buildDataTable } from '../view/domDataTable.ts'
import { KvClient } from './kvClient.ts'
import { DEV } from '../constants.ts'

/**  This `In-Memory-cache` leverages ES6-Maps. */
export class KvCache {

   IDB_KEY = ''
   schema
   nextMsgID = 0
   querySet: any[] = []
   callbacks: Map<string, any>
   columns: any[] = []
   kvClient: KvClient
   dbMap: Map<number, string> = new Map()
   raw: any[] = []

   /** ctor */
   constructor(opts: { schema: any; }) {
      this.IDB_KEY = `${opts.schema.name}`
      this.schema = opts.schema
      this.callbacks = new Map()
      this.columns = this.buildColumnSchema(this.schema.sample)
      this.kvClient = new KvClient()
      this.kvClient.init()
   }

   /**
    * extract a set of column-schema from the DB.schema object
    */
   buildColumnSchema(obj: { [s: string]: unknown; } | ArrayLike<unknown>) {
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
    */
   persist(map: Map<number, any>) {
      if (DEV) console.log(`persist called! `)
      const valueString = JSON.stringify(Array.from(map.entries()))
      this.kvClient.set(["PWA"], valueString)
   }

   /** hydrate a dataset from a single raw record stored in kvDB */
   hydrate() {
      this.raw = [...this.dbMap.values()]
      this.querySet = [...this.raw]
      buildDataTable()
      return (this.raw.length > 2)? "ok" : 'Not found'
   }

   /** resest the working querySet to original DB values */
   resetData() {
      this.querySet = [...this.raw]
   }

   /** The `set` method mutates - will call the `persist` method. */
   set(key: number, value: any, from: string) {
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

   /** The `get` method will not mutate records */
   get(key: number) {
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
   delete(key: number) {
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

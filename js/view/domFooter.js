import { $ } from './utils.js'
import { kvCache } from '../main.js'
import { buildDataTable } from './domDataTable.js'
import { focusedRow } from './editableTR.js'

/** build footer */
export function buildFooter() {

   /** @type {HTMLButtonElement} */
   const addBtn = /**@type {HTMLButtonElement}*/($('addbtn'))
   addBtn.onclick = (_e) => {
      // make an empty row object
      const newRow = Object.assign({}, kvCache.schema.sample)
      // set the id
      if (newRow.id) { newRow.id = kvCache.dbMap.size }
      // add it to the cache
      kvCache.set(newRow.id, newRow,"dom footer 63: ")
      // update table with new row
      buildDataTable() 
      const table = /**@type {HTMLTableElement}*/($("table"));
      const lastRow = table.rows[table.rows.length - 1];
      // Scroll to the last row with smooth scrolling
      lastRow.scrollIntoView({ behavior: "smooth" });
   }
   /** @type {HTMLButtonElement} */
   const deleteBtn = /**@type {HTMLButtonElement}*/($('deletebtn'))
   deleteBtn.onclick = (_e) => {
      // delete the map row, then persist the map
      const id = /**@type {HTMLTableRowElement}*/(focusedRow).dataset.row_id
      kvCache.delete(parseInt(id + ''))
      //paginateData()
      buildDataTable()
   }

}
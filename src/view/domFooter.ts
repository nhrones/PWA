import { $ } from './utils.ts'
import { kvCache } from '../main.ts'
import { buildDataTable } from './domDataTable.ts'
import { focusedRow } from './editableTR.ts'

/** build footer */
export function buildFooter() {

   const addBtn = $('addbtn') as HTMLButtonElement
   addBtn.onclick = (_e) => {
      // make an empty row object
      const newRow = Object.assign({}, kvCache.schema.sample)
      // set the id
      if (newRow.id) { newRow.id = kvCache.dbMap.size }
      // add it to the cache
      kvCache.set(newRow.id, newRow, "dom footer 63: ")
      // update table with new row
      buildDataTable()
      const table = $("table") as HTMLTableElement
      const lastRow = table.rows[table.rows.length - 1];
      // Scroll to the last row with smooth scrolling
      lastRow.scrollIntoView({ behavior: "smooth" });
      const deleteBtn = $('deletebtn') as HTMLButtonElement
      deleteBtn.onclick = (_e) => {
         // delete the map row, then persist the map
         const id = (focusedRow as HTMLTableRowElement).dataset.row_id
         kvCache.delete(parseInt(id + ''))
         //paginateData()
         buildDataTable()
      }
   }
}
import { $ } from './utils.ts'
import { makeEditableRow, resetFocusedRow } from './editableTR.ts'
import { buildFooter, } from './domFooter.ts'
import { kvCache } from '../main.ts'

let tableBody: HTMLTableSectionElement

/** 
 * Build the Table header
 */
export const buildTableHead = () => {
   const tablehead = $('table-head') as HTMLTableSectionElement
   const tr = `
<tr class="headerRow">
`;
   let th = ''
   for (let i = 0; i < kvCache.columns.length; i++) {
      if (i === 1) {
      th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${kvCache.columns[i].name} 
   <span class="indicator">🔽</span>
</th>
`;
} else {
   th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${kvCache.columns[i].name} 
</th>
`;
}

   }
   tablehead.innerHTML += (tr + th)
   tablehead.innerHTML += `</tr>`
}

/** 
 * build and HTML table 
 */
export const buildDataTable = () => {

   if (!tableBody) {
      tableBody = $('table-body') as HTMLTableSectionElement
   }

   const querySet = kvCache.querySet
  
   tableBody.innerHTML = '';

   if (querySet) {
      for (let i = 0; i < querySet.length; i++) {
         const obj = querySet[i]
         let row = `<tr data-row_id="${obj[kvCache.columns[0].name]} ">
        `
         for (let i = 0; i < kvCache.columns.length; i++) {
            const ro = (kvCache.columns[i].readOnly) ? ' read-only' : ''
            row += `<td data-column_id="${kvCache.columns[i].name}"${ro}>${obj[kvCache.columns[i].name]}</td>
            `
         }
         row += '</tr>'
         tableBody.innerHTML += row
      }
   }
   resetFocusedRow()
   buildFooter()
   makeEditableRow()
}

import { $ } from './utils.js'
import { makeEditableRow, resetFocusedRow } from './editableTR.js'
import { buildFooter, } from './domFooter.js'
import { kvCache } from '../main.js'


/** @type {HTMLTableSectionElement} */
let tableBody

/**
 * Capitalize First Letter
 *
 * @param {string} str the string to capitalize
 * @returns {string} capitalized string
 */
//function capitalizeFirstLetter(str) {
   //return str //.charAt(0).toUpperCase() + str.slice(1);
//}

/** 
 * Build the Table header
 */
export const buildTableHead = () => {
   const tablehead = /** @type {HTMLTableSectionElement} */ ($('table-head'))
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
      tableBody = /** @type {HTMLTableSectionElement} */($('table-body'))
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

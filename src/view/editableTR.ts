// deno-lint-ignore-file no-explicit-any
import { $ } from './utils.ts'
import { kvCache } from '../main.ts'

/** 
 * @module editableTR
 * @description  makes a dataTable row editable.
 * @abstract - This module leverages JSDoc comments for type checking.
 * 
 * @function resetFocusedRow - reset any currently focused row
 * @function makeEditableRow - build table row event handlers for editing
 */

export let focusedRow: HTMLTableRowElement | null

export let focusedCell: HTMLTableCellElement

export let selectedRowID = 0


/** reset any focused row */
export const resetFocusedRow = () => {
   const dbtn = $('deletebtn') as HTMLButtonElement;
   const abtn = $('addbtn') as HTMLButtonElement;
   dbtn.setAttribute('hidden',"")
   abtn.removeAttribute('hidden')
   focusedRow = null
}

/** build table row event handlers for editing */
export function makeEditableRow() {
    const rows = document.querySelectorAll('tr')
    for (const row of Array.from(rows)) {
        if (row.className.startsWith('headerRow')) {
            // skip the table-header row
            continue
        }

        row.onclick = (e) => {

            const target = e.target as HTMLTableCellElement
            if (focusedRow && focusedCell && (e.target != focusedCell)) {
               focusedCell.removeAttribute('contenteditable')
                focusedCell.className = ""
                focusedCell.oninput = null
            }

            focusedRow?.classList.remove("selected_row")
            focusedRow = row
            selectedRowID = parseInt(focusedRow.dataset.row_id+'')
            focusedRow.classList.add("selected_row")

            const abtn = $('addbtn') as HTMLButtonElement;
            abtn.setAttribute('hidden',"")
            
            const dbtn = $('deletebtn') as HTMLButtonElement;
            dbtn.removeAttribute('hidden')

            // we don't allow editing readonly cells
            if (target.attributes.getNamedItem('read-only')) {
                return // skip all read-only columns
            }
    
            focusedCell = e.target as HTMLTableCellElement
            focusedCell.setAttribute('contenteditable', '')
            focusedCell.className = "editable "
            focusedCell.onblur = () => {
                const id = parseInt((focusedRow as HTMLTableRowElement).dataset.row_id+'')
                const col = focusedCell.dataset.column_id || 0
                const rowObj: any = kvCache.get(id)
                const currentValue = rowObj[col]
                const newValue = focusedCell.textContent
                if (currentValue != newValue) {
                    rowObj[col] = newValue
                    kvCache.set(id, rowObj, "editable makeEditableRow 81")
                }
            }
            focusedCell.focus()
        }
    }
}


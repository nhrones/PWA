import { DEV, OrderDirection, PIN } from '../constants.js'
import { $, on } from './utils.js'
import { kvCache } from '../main.js'
import { restoreCache } from '../data/kvClient.js'
import { orderData } from '../data/order.js'
import { buildDataTable, buildTableHead } from './domDataTable.js'


const { ASC, DESC } = OrderDirection

/** 
 * @module domEventHandlers
 * @description  This module initialized DOM objects and their event handlers
 * @abstract - This module leverages JSDoc comments for type checking.
 * 
 * @function resetIndicators - resets Order indicator elements
 * @function initDOMelements - initializes DOM objects and event handlers.
 */

export const popupDialog = /** @type {HTMLDialogElement} */ ($("popupDialog"));
export const pinDialog = /** @type {HTMLDialogElement} */ ($("myDialog"));
export const pinInput = /** @type {HTMLInputElement} */ ($("pin"));
export const popupText = /** @type {HTMLElement} */ ($("popup_text"));

let pinTryCount = 0
let pinOK = false
const UP = '🔼'
const DOWN = '🔽'

/** 
 * Initialize DOM elements, and attach common event handlers 
 */
export function initDOMelements() {

   // build the table head section first
   buildTableHead()

   // assign click handlers for column headers
   for (let i = 0; i < kvCache.columns.length; i++) {

      const el = /** @type {HTMLElement} */($(`header${i + 1}`))
      el.onclick = (e) => {
         const header = /** @type {HTMLElement} */(e.currentTarget)
         const indicator = /** @type {HTMLElement} */(header.querySelector('.indicator'))
         const index = parseInt(header.dataset.index + '')
         const colName = /** @type {string} */(kvCache.columns[index].name)
         const currentOrder = kvCache.columns[index].order

         if (currentOrder == ASC) {
            kvCache.columns[index].order = DESC
            orderData(colName, DESC)
            if (indicator) indicator.textContent = UP
         }

         else if (currentOrder == DESC) {
            kvCache.columns[index].order = ASC
            orderData(colName, ASC)
            if (indicator) indicator.textContent = DOWN
         }

         buildDataTable()
      }
   }

   // We've added key commands for backup and restore
   document.addEventListener('keydown', function (event) {
      if (event.ctrlKey && event.key === 'b') {
         event.preventDefault();
         if (DEV) console.log('Ctrl + B backup data');
         backupData()
      }
      if (event.ctrlKey && event.key === 'r') {
         event.preventDefault();
         if (DEV) console.log('Ctrl + R restore data');
         restoreData()
      }
   });

   // popup click handler
   // this closes the msg popup
   on(popupDialog, 'click', (event) => {
      event.preventDefault();
      popupDialog.close();
   });

   // popup close handler
   // we reopen the pin input dialog
   on(popupDialog, 'close', (event) => {
      event.preventDefault();
      if (!pinOK) pinDialog.showModal()
   });

   // popup keyup handler -> any key to close
   on(popupDialog, "keyup", (evt) => {
      evt.preventDefault()
      popupDialog.close()
      if (!pinOK) pinDialog.showModal()
   });

   pinDialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          event.preventDefault();
      }
  });

   // pin input keyup handler
   on(pinInput, 'keyup', (event) => {
      event.preventDefault()
      if (event.key === "Enter" || pinInput.value === PIN) {
         pinTryCount += 1
         if (pinInput.value === PIN) {
            pinInput.value = ""
            pinOK = true
            pinDialog.close()
         } else {
            pinDialog.close()
            pinInput.value = ""
            pinOK = false
            popupText.textContent = (pinTryCount === 3)
               ? `Incorrect pin entered ${pinTryCount} times!
 Please close this Page!`
               : `Incorrect pin entered ${pinTryCount} times!`

            if (pinTryCount === 3) {
               document.body.innerHTML = `
               <h1>Three failed PIN attempts!</h1>
               <h1>Please close this page!</h1>`
            } else {
               popupDialog.showModal()
            }
         }
      }
   })

   if (DEV) { // bypass pin input
      pinOK = true
   } else {
      // initial pin input
      pinDialog.showModal()
      pinInput.focus({ focusVisible: true })
   }
}

/**
 * export data from dbMap
 * @returns void - calls saveDataFile()
 */
export function backupData() {
   // get all records
   const jsonData = JSON.stringify(Array.from(kvCache.dbMap.entries()))
   const link = document.createElement("a");
   const file = new Blob([jsonData], { type: 'application/json' });
   link.href = URL.createObjectURL(file);
   link.download = "backup.json";
   link.click();
   URL.revokeObjectURL(link.href);
}

/**
 * import data from backup file
 */
export function restoreData() {

   const fileload = document.getElementById('fileload')
   fileload?.click()
   fileload?.addEventListener('change', function () {
      const reader = new FileReader();
      reader.onload = function () {
         restoreCache(reader.result)
         globalThis.location.reload()
      }
      reader.readAsText(fileload.files[0]);
   })
}
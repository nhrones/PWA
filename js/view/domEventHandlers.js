import { OrderDirection } from '../constants.js'
import { $, on } from './utils.js'
import { kvCache } from '../main.js'
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


export const backupBtn = /** @type {HTMLButtonElement} */ ($("backupbtn"));
export const restoreBtn = /** @type {HTMLButtonElement} */ ($("restorebtn"));
export const popupDialog = /** @type {HTMLDialogElement} */ ($("popupDialog"));
export const ponDialog = /** @type {HTMLDialogElement} */ ($("myDialog"));
export const pinInput = /** @type {HTMLInputElement} */ ($("pin"));
export const popupText = /** @type {HTMLElement} */ ($("popup_text"));

let pinTryCount = 0
let pinOK = false
const UP = '🔼'
const DOWN = '🔽'

/**
 * resets Order indicator elements
 */
export const resetIndicators = () => {
   const indicators = document.querySelectorAll('.indicator')
   for (const indicator of Array.from(indicators)) {
      const parent = /** @type {HTMLElement} */(indicator.parentElement);
      /** @type {DOMStringMap} */
      const { index } = /**@type {{index: string}}*/(parent.dataset)
      kvCache.columns[index].order = OrderDirection.ASC
      indicator.textContent = DOWN
   }
}
export async function login() {
    //return new Promise(resolve: () => void, reject: (reason?: any) => void))
}

/** 
 * Initialize DOM elements, and attach common event handlers 
 */
export function initDOMelements () {

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
            //resetIndicators()
            kvCache.columns[index].order = DESC
            orderData(colName, DESC)
            if (indicator) indicator.textContent = UP
         }
         else if (currentOrder == DESC) {
            if (indicator) indicator.textContent = DOWN
            kvCache.columns[index].order = ASC
            //resetIndicators()
            orderData(colName, ASC)
         }

         buildDataTable()
      }
   }

   //backup button click handler
   on(backupBtn, 'click', () => {
      backupData()
   })

   // restore button click handler
   on(restoreBtn, 'click', () => {
      restoreData()
   })


   // popup click handler
   on(popupDialog, 'click', (event) => {
      event.preventDefault();
      popupDialog.close();
   });

   // popup close handler
   on(popupDialog, 'close', (event) => {
      event.preventDefault();
      if (!pinOK) ponDialog.showModal()
   });

   // popup keyup handler
   on(popupDialog, "keyup", (evt) => {
      evt.preventDefault()
      popupDialog.close()
      if (!pinOK) ponDialog.showModal()
   });

   // pin input keyup handler
   on(pinInput, 'keyup', (event) => {
      event.preventDefault()
      if (event.key === "Enter" || pinInput.value === "3913") {
         pinTryCount += 1
         if (pinInput.value === "3913") {
            pinInput.value = ""
            pinOK = true
            ponDialog.close()
         } else {
            ponDialog.close()
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


   // check search param to bypass pin input
   if (globalThis.location.search !== '?ndh') {
      // initial pin input
      ponDialog.showModal()
      pinInput.focus({ focusVisible: true })
   } else {
      pinOK = true
   }

}

/**
 * export data from dbMap
 * @returns void - calls saveDataFile()
 */
export function backupData() {
   // get all todo records
   const jsonData = JSON.stringify(Array.from(kvCache.dbMap.entries()))
   const link = document.createElement("a");
   const file = new Blob([jsonData], { type: 'application/json' });
   link.href = URL.createObjectURL(file);
   link.download = "backup.json";
   link.click();
   URL.revokeObjectURL(link.href);
}

/**
 * restore our cache from a json backup
 * @param {string} records
 */
export function restoreCache(records) {
   const tasksObj = JSON.parse(records)
   kvCache.dbMap = new Map(tasksObj)
   kvCache.persist(kvCache.dbMap)
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
import { OrderDirection } from '../constants.js'
import { kvCache } from '../main.js'

/** Reorder our dataset 
 * @param {string} column
 * @param {string} direction
 */
export const orderData = (column, direction) => {
   switch (direction) {
      case OrderDirection.ASC:
         kvCache.querySet.sort((a, b) => a[column].toLowerCase() > b[column].toLowerCase() ? 1 : -1)
         break;
      case OrderDirection.DESC:
         kvCache.querySet.sort((a, b) => a[column].toLowerCase() < b[column].toLowerCase() ? 1 : -1)
         break;
      default:
         break;
   }
}

/** apply any existing sort order */
export const applyOrder = () => {
   const indicators = document.querySelectorAll('.indicator')
   for (const ind of Array.from(indicators)) {
      const index = parseInt(ind?.parentElement?.dataset.index + '')
      const dir = kvCache.columns[index].order
      orderData(kvCache.columns[index].name, dir)
   }
}
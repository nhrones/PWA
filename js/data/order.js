import { DEV, OrderDirection } from '../constants.js'
import { kvCache } from '../main.js'

/** Reorder our dataset 
 * @param {string} column
 * @param {string} direction
 */
export const orderData = (column, direction) => {
   if (DEV) console.log('running order for', column)
   switch (direction) {
      case OrderDirection.ASC:
         if (DEV) console.log('running order-ASC for', column)
         kvCache.querySet.sort((a, b) => a[column].toLowerCase() > b[column].toLowerCase() ? 1 : -1)
         break;
      case OrderDirection.DESC:
         if (DEV) console.log('running order-DESC for', column)
         kvCache.querySet.sort((a, b) => a[column].toLowerCase() < b[column].toLowerCase() ? 1 : -1)
         break;
      default:
         break;
   }
}

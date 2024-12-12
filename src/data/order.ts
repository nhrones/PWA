import { DEV, OrderDirection } from '../constants.ts'
import { kvCache } from '../main.ts'

/** Reorder our dataset */
export const orderData = (column: string, direction: string) => {
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

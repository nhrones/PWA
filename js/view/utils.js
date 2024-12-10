
export const $  = (/** @type {string} */ id) => document.getElementById(id)

/** on - adds an event handler to an htmlElement */
export const on = (
   /** @type {{ addEventListener: (arg0: string, arg1: any) => any; }} */ elem,
   /** @type {string} */ event,
   /** @type {any} */ listener) => elem.addEventListener(event, listener)

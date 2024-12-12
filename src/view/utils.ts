// deno-lint-ignore-file no-explicit-any

export const $  = (id: string) => document.getElementById(id)

/** on - adds an event handler to an htmlElement */
export const on = (elem: any, event: string, listener: any) => {
   return elem.addEventListener(event, listener)
}


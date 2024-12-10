# KV-Cache-PWA
## A _LocalFirst_ example application
  - Pure vanilla HTML, CSS, javascript application - no frameworks
  - Local async IDB persistence service
  - Zero dependencies -- no Node, no Deno, no Bun, no Typescript, None, Nada
  - Zero network requirements, statically served from Github Pages
![alt text](LocalFirst.png)

### Instantaneous ordering, filtering, pagination

An extremely performant in-memory data service.     
This example serves a collection of _personal-objects_ persisted in a local IndexedDB.    

## About this Proof Of Concept demo

 - All data is persisted and hydrated as a single key-value record in IndexedDB.    
 - The IndexedDB is managed by a worker thread. See: _./js/idbWorker.js_    
 - Data hydrates to an es6-Map (cache) using JSON.parse()    
 - The cache data is persisted in IndexedDB using JSON.stringyfy()    
 - Any mutation to cache triggers a flush of the full dataset to IndexedDB.    
 - You'll notice a very resposive UI, as IDB ops are on a worker thread.    
 - I've tested with 5 million records with no IDB or UI issues.    

This example app demonstrates full **CRUD** of the personal-user objects:
```js
/** a `personal-object ...*/
personal = {
    id: number,
    host: string
    login: string,
    pw: string,   
    remarks: string     
} 
```


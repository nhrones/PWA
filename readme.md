# KV-Cache-PWA
## A _LocalFirst_ example application
  - Pure vanilla HTML, CSS, javascript application - no frameworks
  - Local async IDB persistence service
  - Zero dependencies -- no Node, no Deno, no Bun, no Typescript, None, Nada
  - Zero network requirements, statically served from Github Pages

## About this Proof Of Concept demo

 - All data is persisted and hydrated as a single key-value record in KvDB.       
 - Data hydrates to an es6-Map (cache) using JSON.parse()    
 - The cache data is persisted in KvDB using JSON.stringyfy()    
 - Any mutation to cache triggers a flush of the full dataset to KvDB.    
 
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

See it live at https://nhrones.github.io/PWA/
// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/constants.ts
var BYPASS_PIN = false;
var DEV = true;
var PIN = "";
var setPin = /* @__PURE__ */ __name((pin) => PIN = pin, "setPin");

// src/view/utils.ts
var $ = /* @__PURE__ */ __name((id) => document.getElementById(id), "$");
var on = /* @__PURE__ */ __name((elem, event, listener) => {
  return elem.addEventListener(event, listener);
}, "on");

// src/view/editableTR.ts
var focusedRow;
var focusedCell;
var selectedCacheKey = "";
var resetFocusedRow = /* @__PURE__ */ __name(() => {
  const deleteBtn = $("deletebtn");
  const addBtn = $("addbtn");
  deleteBtn.setAttribute("hidden", "");
  addBtn.removeAttribute("hidden");
  focusedRow = null;
}, "resetFocusedRow");
function makeEditableRow() {
  const rows = document.querySelectorAll("tr");
  for (const row of Array.from(rows)) {
    if (row.className.startsWith("headerRow")) continue;
    row.onclick = (e) => {
      const target = e.target;
      if (focusedRow && focusedCell && e.target != focusedCell) {
        focusedCell.removeAttribute("contenteditable");
        focusedCell.className = "";
        focusedCell.oninput = null;
      }
      focusedRow?.classList.remove("selected_row");
      focusedRow = row;
      selectedCacheKey = focusedRow.dataset.cache_key;
      focusedRow.classList.add("selected_row");
      const addBtn = $("addbtn");
      addBtn.setAttribute("hidden", "");
      const deleteBtn = $("deletebtn");
      deleteBtn.removeAttribute("hidden");
      if (target.attributes.getNamedItem("read-only")) {
        return;
      }
      focusedCell = e.target;
      focusedCell.setAttribute("contenteditable", "");
      focusedCell.className = "editable ";
      focusedCell.onblur = () => {
        let key = focusedRow.dataset.cache_key;
        const col = focusedCell.dataset.column_id || 0;
        const rowObj = kvCache.get(key);
        const currentValue = rowObj[col];
        const thisValue = focusedCell.textContent;
        if (currentValue !== thisValue) {
          rowObj[col] = thisValue;
          if (col === "host") {
            const newKey = thisValue;
            if (key !== newKey) {
              kvCache.delete(key);
              key = thisValue;
              kvCache.set(key, rowObj);
            }
          }
        } else {
          kvCache.set(key, rowObj);
        }
      };
    };
  }
  focusedCell?.focus();
}
__name(makeEditableRow, "makeEditableRow");

// src/view/domFooter.ts
function buildFooter() {
  const addBtn = $("addbtn");
  addBtn.onclick = (_e) => {
    const newRow = Object.assign({}, kvCache.schema.sample);
    kvCache.set(newRow.host, newRow);
    buildDataTable();
    const table = $("table");
    const lastRow = table.rows[table.rows.length - 1];
    lastRow.scrollIntoView({ behavior: "smooth" });
  };
  const deleteBtn = $("deletebtn");
  deleteBtn.onclick = (_e) => {
    const id = focusedRow.dataset.cache_key;
    kvCache.delete(id);
    buildDataTable();
  };
}
__name(buildFooter, "buildFooter");

// src/view/domDataTable.ts
var tableBody;
var buildTableHead = /* @__PURE__ */ __name(() => {
  const tablehead = $("table-head");
  const tr = `
<tr class="headerRow">
`;
  let th = "";
  for (let i = 0; i < kvCache.columns.length; i++) {
    if (i === 1) {
      th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${kvCache.columns[i].name} 
   <span class="indicator">\u{1F53D}</span>
</th>
`;
    } else {
      th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${kvCache.columns[i].name} 
</th>
`;
    }
  }
  tablehead.innerHTML += tr + th;
  tablehead.innerHTML += `</tr>`;
}, "buildTableHead");
var buildDataTable = /* @__PURE__ */ __name(() => {
  if (!tableBody) {
    tableBody = $("table-body");
  }
  const querySet = kvCache.querySet;
  tableBody.innerHTML = "";
  if (querySet) {
    for (let i = 0; i < querySet.length; i++) {
      const obj = querySet[i];
      let row = `<tr data-cache_key="${obj[kvCache.columns[0].name]}">
        `;
      for (let i2 = 0; i2 < kvCache.columns.length; i2++) {
        const ro = kvCache.columns[i2].readOnly ? " read-only" : "";
        row += `<td data-column_id="${kvCache.columns[i2].name}"${ro}>${obj[kvCache.columns[i2].name]}</td>
            `;
      }
      row += "</tr>";
      tableBody.innerHTML += row;
    }
  }
  resetFocusedRow();
  buildFooter();
  makeEditableRow();
}, "buildDataTable");

// src/data/kvClient.ts
var DBServiceURL = DEV ? "http://localhost:9099/" : "https://ndh-kv-rpc.deno.dev/";
var RegistrationURL = DBServiceURL + "SSERPC/kvRegistration";
var nextMsgID = 0;
var transactions = /* @__PURE__ */ new Map();
var KvClient = class {
  static {
    __name(this, "KvClient");
  }
  schema;
  nextMsgID = 0;
  querySet = [];
  transactions;
  currentPage = 1;
  focusedRow = null;
  constructor() {
    this.transactions = /* @__PURE__ */ new Map();
  }
  /** initialize our EventSource and fetch some data */
  init() {
    const eventSource = new EventSource(RegistrationURL);
    console.log("CONNECTING");
    eventSource.addEventListener("open", () => {
      console.log("setting pin");
      this.setKvPin("3913").then(() => {
        callProcedure("GET", { key: ["PIN"] }).then((result) => {
          console.log("GET PIN ", result.value);
          const pin = xorEncrypt(result.value);
          console.log("GET PIN ", pin);
          setPin(pin);
          this.fetchQuerySet();
        });
      });
    });
    eventSource.addEventListener("error", (_e) => {
      switch (eventSource.readyState) {
        case EventSource.OPEN:
          console.log("CONNECTED");
          break;
        case EventSource.CONNECTING:
          console.log("CONNECTING");
          break;
        case EventSource.CLOSED:
          console.log("DISCONNECTED");
          break;
      }
    });
    eventSource.addEventListener("message", (evt) => {
      const parsed = JSON.parse(evt.data);
      const { txID, error, result } = parsed;
      if (txID === -1) {
        this.handleMutation(result);
      }
      if (!transactions.has(txID)) return;
      const transaction = transactions.get(txID);
      transactions.delete(txID);
      if (transaction) transaction(error, result);
    });
  }
  /**
   * handle Mutation Event
   * @param {{ rowID: any; type: any; }} result
   */
  handleMutation(result) {
    console.info(`Mutation event:`, result.type);
  }
  /** set Kv Pin */
  async setKvPin(rawpin) {
    const pin = xorEncrypt(rawpin);
    await callProcedure("SET", { key: ["PIN"], value: pin }).then((_result) => {
      console.log(`Set PIN ${rawpin} to: `, pin);
    });
  }
  //sortedString = JSON.stringify([...sortedMap.entries()])
  /** fetch a querySet */
  async fetchQuerySet() {
    await callProcedure("GET", { key: ["PWA"] }).then((result) => {
      restoreCache(xorEncrypt(result.value));
    });
  }
  /** get row from key */
  get(key) {
    for (let index = 0; index < this.querySet.length; index++) {
      const element = this.querySet[index];
      if (element.id === key) return element;
    }
  }
  /** The `set` method mutates - will call the `persist` method. */
  set(value) {
    try {
      callProcedure(
        "SET",
        {
          key: ["PWA"],
          value
        }
      ).then((result) => {
        this.querySet = result.querySet;
        return this.querySet;
      });
    } catch (e) {
      return { Error: e };
    }
  }
};
var callProcedure = /* @__PURE__ */ __name((procedure, params) => {
  const txID = nextMsgID++;
  return new Promise((resolve, reject) => {
    transactions.set(txID, (error, result) => {
      if (error)
        return reject(new Error(error));
      resolve(result);
    });
    fetch(DBServiceURL, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({ txID, procedure, params })
    });
  });
}, "callProcedure");
function restoreCache(records) {
  const pwaObj = JSON.parse(records);
  kvCache.dbMap = new Map(pwaObj);
  kvCache.persist();
  const result = kvCache.hydrate();
  if (result == "ok") {
    buildDataTable();
  }
}
__name(restoreCache, "restoreCache");
function xorEncrypt(text) {
  let result = "";
  const key = "ndhg";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}
__name(xorEncrypt, "xorEncrypt");

// src/view/domEventHandlers.ts
var popupDialog = $("popupDialog");
var pinDialog = $("myDialog");
var pinInput = $("pin");
var popupText = $("popup_text");
var pinTryCount = 0;
var pinOK = false;
function initDOMelements() {
  buildTableHead();
  for (let i = 0; i < kvCache.columns.length; i++) {
  }
  document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "b") {
      event.preventDefault();
      if (DEV) console.log("Ctrl + B backup data");
      backupData();
    }
    if (event.ctrlKey && event.key === "r") {
      event.preventDefault();
      if (DEV) console.log("Ctrl + R restore data");
      restoreData();
    }
  });
  on(popupDialog, "click", (event) => {
    event.preventDefault();
    popupDialog.close();
  });
  on(popupDialog, "close", (event) => {
    event.preventDefault();
    if (!pinOK) pinDialog.showModal();
  });
  on(popupDialog, "keyup", (event) => {
    event.preventDefault();
    popupDialog.close();
    if (!pinOK) pinDialog.showModal();
  });
  pinDialog?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
    }
  });
  on(pinInput, "keyup", (event) => {
    event.preventDefault();
    const pinIn = pinInput;
    const pinDia = pinDialog;
    if (event.key === "Enter" || pinIn.value === PIN) {
      pinTryCount += 1;
      if (pinIn.value === PIN) {
        pinIn.value = "";
        pinOK = true;
        pinDia.close();
      } else {
        pinDia.close();
        pinIn.value = "";
        pinOK = false;
        if (popupText) popupText.textContent = pinTryCount === 3 ? `Incorrect pin entered ${pinTryCount} times!
 Please close this Page!` : `Incorrect pin entered ${pinTryCount} times!`;
        if (pinTryCount === 3) {
          document.body.innerHTML = `
               <h1>Three failed PIN attempts!</h1>
               <h1>Please close this page!</h1>`;
        } else {
          popupDialog.showModal();
        }
      }
    }
  });
  if (BYPASS_PIN) {
    pinOK = true;
  } else {
    pinDialog.showModal();
    pinInput.focus({ focusVisible: true });
  }
}
__name(initDOMelements, "initDOMelements");
function backupData() {
  const jsonData = JSON.stringify(Array.from(kvCache.dbMap.entries()));
  const link = document.createElement("a");
  const file = new Blob([jsonData], { type: "application/json" });
  link.href = URL.createObjectURL(file);
  link.download = "backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
__name(backupData, "backupData");
function restoreData() {
  const fileload = document.getElementById("fileload");
  fileload?.click();
  fileload?.addEventListener("change", function() {
    const reader = new FileReader();
    reader.onload = function() {
      restoreCache(reader.result);
      globalThis.location.reload();
    };
    reader.readAsText(fileload.files[0]);
  });
}
__name(restoreData, "restoreData");

// src/data/kvCache.ts
var KvCache = class {
  static {
    __name(this, "KvCache");
  }
  IDB_KEY = "";
  schema;
  nextMsgID = 0;
  querySet = [];
  callbacks;
  columns = [];
  kvClient;
  dbMap;
  raw = [];
  /** ctor */
  constructor(opts) {
    this.IDB_KEY = `${opts.schema.name}`;
    this.schema = opts.schema;
    this.callbacks = /* @__PURE__ */ new Map();
    this.dbMap = /* @__PURE__ */ new Map();
    this.columns = this.buildColumnSchema(this.schema.sample);
    this.kvClient = new KvClient();
    this.kvClient.init();
  }
  /**
   * extract a set of column-schema from the DB.schema object
   */
  buildColumnSchema(obj) {
    const columns = [];
    for (const [key, value] of Object.entries(obj)) {
      let read_only = false;
      if (typeof value === "number" && value === -1 || typeof value === "string" && value === "READONLY") {
        read_only = true;
      }
      columns.push({
        name: `${key}`,
        type: `${typeof value}`,
        readOnly: read_only,
        order: "ASC"
      });
    }
    return columns;
  }
  /**
   * Persist the current dbMap to Kv   
   * This is called for any mutation of the dbMap (set/delete)
   */
  persist(order = false) {
    if (order) {
      this.dbMap = sortMap(this.dbMap);
    }
    const mapString = JSON.stringify(Array.from(this.dbMap.entries()));
    const encrypted = xorEncrypt(mapString);
    this.kvClient.set(encrypted);
  }
  /** hydrate a dataset from a single raw record stored in kvDB */
  hydrate() {
    this.raw = [...this.dbMap.values()];
    this.querySet = [...this.raw];
    buildDataTable();
    return this.raw.length > 2 ? "ok" : "Not found";
  }
  /** resest the working querySet to original DB values */
  resetData() {
    this.querySet = [...this.raw];
  }
  clean(what = null) {
    const cleanMap = /* @__PURE__ */ new Map();
    const keys = [...this.dbMap.keys()];
    keys.forEach((value) => {
      if (value !== what) {
        cleanMap.set(value, this.dbMap.get(value));
      }
    });
    this.dbMap = cleanMap;
    this.persist(true);
  }
  /** The `set` method mutates - will call the `persist` method. */
  set(key, value) {
    try {
      this.dbMap.set(key, value);
      this.persist(true);
      this.hydrate();
      return key;
    } catch (e) {
      console.error("error setting ");
      return "Error " + e;
    }
  }
  /** The `get` method will not mutate records */
  get(key) {
    try {
      const result = this.dbMap.get(key);
      return result;
    } catch (e) {
      return "Error " + e;
    }
  }
  /** The `delete` method mutates - will call the `persist` method. */
  delete(key) {
    try {
      const result = this.dbMap.delete(key);
      if (result === true) this.persist(true);
      this.hydrate();
      return result;
    } catch (e) {
      return "Error " + e;
    }
  }
};
function sortMap(originalMap) {
  return new Map([...originalMap.entries()].sort());
}
__name(sortMap, "sortMap");

// src/main.ts
var options = {
  schema: {
    name: "PWA",
    sample: {
      host: "XYZ",
      login: "",
      pw: "",
      remarks: ""
    }
  }
};
var kvCache = new KvCache(options);
initDOMelements();
export {
  kvCache
};

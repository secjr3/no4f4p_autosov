
const AutoSovDB = (() => {
  console.log("[AutoSovDB] Módulo carregado.");

  const DB_NAME    = "AutoSovDB";
  const DB_VERSION = 3;
  const STORE_TASKS     = "tasks";
  const STORE_APP_DATA  = "appData";
  const STORE_SYNC_QUEUE = "syncQueue";

  let db = null; 

  //  INICIALIZAÇÃO
  /**
   * @returns {Promise<void>}
   */
  function init() {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(`[AutoSovDB] Erro ao abrir a base de dados: ${request.error}`);

      request.onsuccess = () => {
        db = request.result;
        console.log("[AutoSovDB] Base de dados pronta (versão " + db.version + ").");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const upgradeDb = event.target.result;
        const oldVersion = event.oldVersion;

        // --- Store: tasks ---
        if (!upgradeDb.objectStoreNames.contains(STORE_TASKS)) {
          upgradeDb.createObjectStore(STORE_TASKS, {
            keyPath: "id",
            autoIncrement: true
          });
          console.log("[AutoSovDB] Store 'tasks' criado.");
        }

        // --- Store: appData (chave manual, ex: "main") ---
        if (!upgradeDb.objectStoreNames.contains(STORE_APP_DATA)) {
          upgradeDb.createObjectStore(STORE_APP_DATA, { keyPath: "key" });
          console.log("[AutoSovDB] Store 'appData' criado.");
        }

        // --- Store: syncQueue ---
        if (!upgradeDb.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          const syncStore = upgradeDb.createObjectStore(STORE_SYNC_QUEUE, {
            keyPath: "queueId",
            autoIncrement: true
          });
          syncStore.createIndex("by_status", "status", { unique: false });
          console.log("[AutoSovDB] Store 'syncQueue' criado.");
        }

        // --- Migração: localStorage → IndexedDB (apenas na primeira vez) ---
        if (oldVersion === 0 || oldVersion === 1) {
          _migrateFromLocalStorage(event.target.transaction);
        }
      };
    });
  }

  /**
   * Migra dados do localStorage para o store appData.
   * @param {IDBTransaction} tx
   */
  function _migrateFromLocalStorage(tx) {
    try {
      const raw = localStorage.getItem("nofap_elite_data");
      if (!raw) return;

      const legacy = JSON.parse(raw);
      const store  = tx.objectStore(STORE_APP_DATA);
      store.put({ key: "main", ...legacy });

      console.log("[AutoSovDB] Dados migrados do localStorage para IndexedDB.");
    } catch (e) {
      console.warn("[AutoSovDB] Falha na migração do localStorage:", e);
    }
  }


  //  UTILITÁRIO INTERNO:
  /**
   * @param {string}   storeName 
   * @param {string}   mode       
   * @param {Function} operation  
   * @returns {Promise<any>}
   */
  function _run(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject("[AutoSovDB] Base de dados não inicializada. Chame AutoSovDB.init() primeiro.");
        return;
      }
      const tx      = db.transaction(storeName, mode);
      const store   = tx.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(`[AutoSovDB] Erro na operação (${storeName}): ${request.error}`);
    });
  }

  //  API: DADOS PRINCIPAIS DA APP (appData)

  /**
   * @returns {Promise<Object>}
   */
  async function loadAppData() {
    const record = await _run(STORE_APP_DATA, "readonly", (store) => store.get("main"));
    if (record) {
      const { key, ...data } = record;
      return data;
    }
    return {
      startTime  : Date.now(),
      relapses   : [],
      bestStreak : 0,
      goals      : [],
      taskstasks:{},
      dailyRecords:{},
    };
  }

  /**
   * @param {Object} data - objeto de dados a guardar
   * @returns {Promise<void>}
   */
  async function saveAppData(data) {
    await _run(STORE_APP_DATA, "readwrite", (store) => store.put({ key: "main", ...data }));
    await enqueueSyncOperation("UPDATE_APP_DATA", { ...data });
  }

  //  API: TAREFAS (tasks)
  /**
   * @param {Object} taskData 
   * @returns {Promise<number>}
   */
  async function saveTask(taskData) {
    const id = await _run(STORE_TASKS, "readwrite", (store) => store.add(taskData));
    await enqueueSyncOperation("ADD_TASK", { ...taskData, id });
    return id;
  }

  /**
   * @returns {Promise<Array>}
   */
  async function getAllTasks() {
    const tasks = await _run(STORE_TASKS, "readonly", (store) => store.getAll());
    _cleanExpiredTasks();
    return tasks;
  }

  /**
   * @param {number} id
   * @param {Object} updates 
   * @returns {Promise<void>}
   */
  async function updateTask(id, updates) {
    const task = await _run(STORE_TASKS, "readonly", (store) => store.get(id));
    if (task) {
      const updated = { ...task, ...updates };
      await _run(STORE_TASKS, "readwrite", (store) => store.put(updated));
      await enqueueSyncOperation("UPDATE_TASK", { id, ...updates });
    }
  }

  /**
   * Remover uma tarefa pelo id.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async function removeTask(id) {
    await _run(STORE_TASKS, "readwrite", (store) => store.delete(id));
    await enqueueSyncOperation("DELETE_TASK", { id });
  }

  /**
   * Remover tarefas concluídas há mais de 24 horas.
   * @returns {Promise<void>}
   */
  async function _cleanExpiredTasks() {
    const now = Date.now();
    const expireAfter = 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      if (!db) { reject("[AutoSovDB] DB não inicializada."); return; }

      const tx    = db.transaction(STORE_TASKS, "readwrite");
      const store = tx.objectStore(STORE_TASKS);
      const req   = store.openCursor();

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const task = cursor.value;
        
          if (task.completed && task.completedAt && (now - new Date(task.completedAt).getTime()) > expireAfter) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  //  API: FILA DE SINCRONIZAÇÃO (syncQueue)

  /**
   * Adiciona uma operação à fila de sincronização offline.
   * @param {string} type 
   * @param {Object} payload 
   * @returns {Promise<number>} 
   */
  function enqueueSyncOperation(type, payload) {
    const entry = {
      type,
      payload,
      status    : "pending",   // "pending" | "synced" | "failed"
      createdAt : new Date().toISOString()
    };
    return _run(STORE_SYNC_QUEUE, "readwrite", (store) => store.add(entry));
  }

  /**
   * Retorna todas as operações pendentes na fila de sync.
   * @returns {Promise<Array>}
   */
  function getPendingSyncOperations() {
    return new Promise((resolve, reject) => {
      if (!db) { reject("[AutoSovDB] DB não inicializada."); return; }

      const tx      = db.transaction(STORE_SYNC_QUEUE, "readonly");
      const store   = tx.objectStore(STORE_SYNC_QUEUE);
      const index   = store.index("by_status");
      const request = index.getAll("pending");

      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  /**
   * Marca uma entrada da fila como sincronizada.
   * @param {number} queueId
   * @returns {Promise<void>}
   */
  async function markSynced(queueId) {
    const record = await _run(STORE_SYNC_QUEUE, "readonly", (store) => store.get(queueId));
    if (record) {
      record.status = "synced";
      await _run(STORE_SYNC_QUEUE, "readwrite", (store) => store.put(record));
    }
  }

  /**
   * @returns {Promise<void>}
   */
  function clearSyncedOperations() {
    return new Promise((resolve, reject) => {
      if (!db) { reject("[AutoSovDB] DB não inicializada."); return; }

      const tx    = db.transaction(STORE_SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const index = store.index("by_status");
      const req   = index.openCursor(IDBKeyRange.only("synced"));

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  //  API PÚBLICA
  return {
    init,
    // Dados principais
    loadAppData,
    saveAppData,
    // Tarefas
    save    : saveTask,   // alias para compatibilidade com tasks.js
    getAll  : getAllTasks,
    update  : updateTask,
    remove  : removeTask,
    // Sync queue
    enqueueSyncOperation,
    getPendingSyncOperations,
    markSynced,
    clearSyncedOperations
  };

})();

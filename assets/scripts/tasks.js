/**
 * TaskManager — Gestor de Tarefas Diárias
 * =========================================
 * Dependência: storage.js 
 *
 * Versão: 0.32-tasks-enhanced
 */ 

const TaskManager = (() => {

  /**
   * Cria e persiste uma nova tarefa.
   * @param {string} title
   * @returns {Promise<Object>}
   */
  async function addTask(title) {
    if (!title || !title.trim()) return null;

    const task = {
      title       : title.trim(),
      createdAt   : new Date().toISOString(),
      completed   : false,
      completedAt : null,
      synced      : false  
    };

    const id = await AutoSovDB.save(task);
    return { id, ...task };
  }

  /**
   * Retorna todas as tarefas armazenadas localmente.
   * Funciona offline — os dados vêm do IndexedDB.
   * @returns {Promise<Array>}
   */
  async function getTasks() {
    return await AutoSovDB.getAll();
  }

  /**
   * Marca uma tarefa como concluída.
   * @param {number} id
   * @returns {Promise<void>}
   */
async function completeTask(taskId) {
  const today = getTodayKey();

  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = {
      checkinTime: null,
      relapseTimes: [],
    };
  }

  const now = Date.now();
  await AutoSovDB.update(taskId, {
    completed: true,
    completedAt: now
  });

  await save();
}

  /**
   * Marca uma tarefa como não concluída (desfaz a conclusão).
   * @param {number} id
   * @returns {Promise<void>}
   */
  async function uncompleteTask(id) {
    await AutoSovDB.update(id, {
      completed   : false,
      completedAt : null
    });
  }

  /**
   * Remove uma tarefa pelo seu id.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async function deleteTask(id) {
    await AutoSovDB.remove(id);
  }

  return {
    addTask,
    getTasks,
    completeTask,
    uncompleteTask,
    deleteTask
  };

})();

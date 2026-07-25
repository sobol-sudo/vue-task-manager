import { defineStore } from 'pinia'
import type { Task } from '@/types'
import { useToast } from 'vue-toastification'
import { t } from '@/lang/i18n'

const toast = useToast()
const isDev = import.meta.env.MODE === 'development'
const API_URL = import.meta.env.VITE_API_URL

const PRIORITIES: Task['priority'][] = ['low', 'medium', 'high']

/**
 * Bring a task from an untrusted source (REST API, localStorage, an imported
 * JSON file) into the shape the app relies on. The REST backend returns `id`
 * as a string, so it is coerced to a number here — every comparison in the
 * store is strict, and mixing `"2"` with `2` would silently break them.
 */
const normalizeTask = (raw: Partial<Task>, fallbackId: number): Task => {
  const id = Number(raw.id)

  return {
    id: Number.isFinite(id) ? id : fallbackId,
    text: String(raw.text ?? ''),
    completed: Boolean(raw.completed),
    priority: PRIORITIES.includes(raw.priority as Task['priority'])
      ? (raw.priority as Task['priority'])
      : 'low',
  }
}

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: [] as Task[],
    // The first load is a round trip to the REST backend, and an empty list
    // means two different things while it is in flight: "nothing stored yet" or
    // "not known yet". Without this flag the UI has to guess, and it guessed
    // wrong — every page load flashed the empty state before the tasks arrived.
    isLoading: false,
  }),

  actions: {
    async fetchTasks() {
      this.isLoading = true

      try {
        if (isDev) {
          const savedTasks = localStorage.getItem('tasks')
          const parsedTasks: Partial<Task>[] = savedTasks ? JSON.parse(savedTasks) : []
          this.tasks = parsedTasks.map((task, index) => normalizeTask(task, Date.now() + index))
          toast.success(t('store.tasks_loaded_local'))
        } else {
          const response = await fetch(`${API_URL}/tasks`)
          if (!response.ok) throw new Error('Failed to load tasks')
          const loadedTasks: Partial<Task>[] = await response.json()
          this.tasks = loadedTasks.map((task, index) => normalizeTask(task, Date.now() + index))
          toast.success(t('store.tasks_loaded_api'))
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.tasks_load_failed'))
      } finally {
        this.isLoading = false
      }
    },

    async addTask(task: Omit<Task, 'id'>) {
      try {
        if (isDev) {
          const newTask: Task = { ...task, id: Date.now() }
          this.tasks = [...this.tasks, newTask]
          localStorage.setItem('tasks', JSON.stringify(this.tasks))
          toast.success(t('store.task_added_local'))
        } else {
          const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
          })
          if (!response.ok) throw new Error('Failed to add the task')
          const newTask: Partial<Task> = await response.json()
          this.tasks = [...this.tasks, normalizeTask(newTask, Date.now())]
          toast.success(t('store.task_added_api'))
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.task_add_failed'))
      }
    },

    async removeTask(id: number) {
      try {
        if (isDev) {
          this.tasks = this.tasks.filter((task) => task.id !== id)
          localStorage.setItem('tasks', JSON.stringify(this.tasks))
          toast.info(t('store.task_removed_local'))
        } else {
          const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
          })
          if (!response.ok) throw new Error('Failed to remove the task')
          this.tasks = this.tasks.filter((task) => task.id !== id)
          toast.info(t('store.task_removed_api'))
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.task_remove_failed'))
      }
    },

    async toggleTask(id: number) {
      try {
        const taskIndex = this.tasks.findIndex((task) => task.id === id)
        if (taskIndex === -1) return

        const updatedTask = {
          ...this.tasks[taskIndex],
          completed: !this.tasks[taskIndex].completed,
        }

        if (isDev) {
          this.tasks[taskIndex] = updatedTask
          localStorage.setItem('tasks', JSON.stringify(this.tasks))
          toast.success(
            updatedTask.completed
              ? t('store.task_completed_local')
              : t('store.task_reactivated_local'),
          )
        } else {
          const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask),
          })
          if (!response.ok) throw new Error('Failed to update the task')

          this.tasks = this.tasks.map((task) => (task.id === id ? updatedTask : task))
          toast.success(
            updatedTask.completed ? t('store.task_completed_api') : t('store.task_reactivated_api'),
          )
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.task_update_failed'))
      }
    },

    /**
     * Replace the whole list with tasks read from an imported JSON file and
     * persist them in whichever mode is active. In production that means
     * dropping the tasks currently on the server and recreating the imported
     * ones, so the import survives navigation and reloads.
     */
    async importTasks(importedTasks: Partial<Task>[]) {
      try {
        if (isDev) {
          this.tasks = importedTasks.map((task, index) => normalizeTask(task, Date.now() + index))
          localStorage.setItem('tasks', JSON.stringify(this.tasks))
          toast.success(t('store.tasks_imported_local'))
        } else {
          // The state is updated after every request, so an interrupted import
          // still leaves the list matching what is actually on the server.
          for (const task of [...this.tasks]) {
            const response = await fetch(`${API_URL}/tasks/${task.id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to clear the current tasks')
            this.tasks = this.tasks.filter((current) => current.id !== task.id)
          }

          for (const [index, task] of importedTasks.entries()) {
            const { text, completed, priority } = normalizeTask(task, Date.now() + index)
            const response = await fetch(`${API_URL}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, completed, priority }),
            })
            if (!response.ok) throw new Error('Failed to import the tasks')
            this.tasks = [...this.tasks, normalizeTask(await response.json(), Date.now() + index)]
          }

          toast.success(t('store.tasks_imported_api'))
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.tasks_import_failed'))
      }
    },
  },

  getters: {
    activeTasks: (state) => state.tasks.filter((task) => !task.completed),
    completedTasks: (state) => state.tasks.filter((task) => task.completed),
  },
})

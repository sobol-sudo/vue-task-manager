import { defineStore } from 'pinia'
import type { Task } from '@/types'
import { useToast } from 'vue-toastification'
import { t } from '@/lang/i18n'

const toast = useToast()
const isDev = import.meta.env.MODE === 'development'
const API_URL = import.meta.env.VITE_API_URL

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    tasks: [] as Task[],
  }),

  actions: {
    async fetchTasks() {
      try {
        if (isDev) {
          const savedTasks = localStorage.getItem('tasks')
          this.tasks = savedTasks ? JSON.parse(savedTasks) : []
          toast.success(t('store.tasks_loaded_local'))
        } else {
          const response = await fetch(`${API_URL}/tasks`)
          if (!response.ok) throw new Error('Failed to load tasks')
          this.tasks = await response.json()
          toast.success(t('store.tasks_loaded_api'))
        }
      } catch (error) {
        console.error('API error:', error)
        toast.error(t('store.tasks_load_failed'))
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
          const newTask = await response.json()
          this.tasks = [...this.tasks, newTask]
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
  },

  getters: {
    activeTasks: (state) => state.tasks.filter((task) => !task.completed),
    completedTasks: (state) => state.tasks.filter((task) => task.completed),
  },
})

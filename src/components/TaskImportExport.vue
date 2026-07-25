<script setup lang="ts">
import { useTaskStore } from '@/store/taskStore'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import type { Task } from '@/types'

const { t } = useI18n()
const toast = useToast()
const taskStore = useTaskStore()

const exportTasks = () => {
  const dataStr = JSON.stringify(taskStore.tasks, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'tasks.json'
  a.click()

  URL.revokeObjectURL(url)
}

const isValidTask = (task: unknown): task is Partial<Task> => {
  if (typeof task !== 'object' || task === null) return false
  const candidate = task as Partial<Task>

  return 'id' in candidate && typeof candidate.text === 'string'
}

const importTasks = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    toast.error(t('error.no_file'))
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const importedTasks: unknown = JSON.parse(e.target?.result as string)
      if (!Array.isArray(importedTasks) || !importedTasks.every(isValidTask)) {
        toast.error(t('error.invalid_json'))
        return
      }

      // The store owns persistence and reports the outcome, so a success
      // message is never shown for tasks that were not actually saved.
      await taskStore.importTasks(importedTasks)
    } catch (error) {
      console.error('Failed to read the imported JSON file:', error)
      toast.error(t('error.import_failed'))
    } finally {
      // Allow re-importing the same file straight after a failed attempt.
      input.value = ''
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="flex justify-between mt-4">
    <button
      @click="exportTasks"
      class="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
    >
      {{ t('export') }}
    </button>

    <label
      class="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
    >
      {{ t('import') }}
      <input type="file" accept=".json" @change="importTasks" class="hidden" />
    </label>
  </div>
</template>

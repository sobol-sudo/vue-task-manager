<script setup lang="ts">
import { useTaskStore } from '@/store/taskStore'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

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

const importTasks = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) {
    toast.error(t('error.no_file'))
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedTasks = JSON.parse(e.target?.result as string)
      if (
        !Array.isArray(importedTasks) ||
        !importedTasks.every((task) => 'id' in task && 'text' in task)
      ) {
        toast.error(t('error.invalid_json'))
        return
      }

      taskStore.tasks = importedTasks
      toast.success(t('import_success'))
    } catch (error) {
      console.error('Failed to read the imported JSON file:', error)
      toast.error(t('error.import_failed'))
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

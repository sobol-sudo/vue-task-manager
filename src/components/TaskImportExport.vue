<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/store/taskStore'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import type { Task } from '@/types'

const { t } = useI18n()
const toast = useToast()
const taskStore = useTaskStore()

const fileInput = ref<HTMLInputElement | null>(null)

const exportTasks = () => {
  // A download is invisible until the browser decides to reveal it, and on an
  // empty list there is nothing to download at all — the button would appear
  // broken. Report both outcomes the way every other action in the app does.
  if (taskStore.tasks.length === 0) {
    toast.error(t('error.nothing_to_export'))
    return
  }

  const dataStr = JSON.stringify(taskStore.tasks, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'tasks.json'

  // Not every browser follows a download on a detached anchor, and revoking the
  // object URL in the same tick can cancel the one that started.
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)

  toast.success(t('tasks_exported'))
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
      type="button"
      data-testid="export-btn"
      @click="exportTasks"
      class="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {{ t('export') }}
    </button>

    <!--
      A `<label>` wrapped around a `display: none` file input is clickable but
      sits nowhere in the tab order, and neither does the input it hides — so
      Import was a mouse-only control. A real button opens the same picker and
      is reachable with Tab, Enter and Space.
    -->
    <button
      type="button"
      data-testid="import-btn"
      @click="fileInput?.click()"
      class="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {{ t('import') }}
    </button>

    <input ref="fileInput" type="file" accept=".json" @change="importTasks" class="hidden" />
  </div>
</template>

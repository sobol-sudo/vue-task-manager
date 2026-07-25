<script setup lang="ts">
import { useTaskStore } from '@/store/taskStore'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'

const { t } = useI18n()
const toast = useToast()

const newTask = ref('')
const priority = ref<'low' | 'medium' | 'high'>('low')
const taskStore = useTaskStore()

const addTask = () => {
  // Every other action in the app reports back through a toast; staying silent
  // here would make the button look broken rather than the input look empty.
  if (!newTask.value.trim()) {
    toast.error(t('error.empty_task'))
    return
  }

  taskStore.addTask({
    text: newTask.value,
    priority: priority.value,
    completed: false,
  })
  newTask.value = ''
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    addTask()
  }
}
</script>

<template>
  <div class="task-form flex gap-2">
    <input
      v-model="newTask"
      data-testid="task-input"
      :placeholder="t('components.task_input.placeholder')"
      class="p-2 border rounded-md flex-1 bg-white text-black dark:bg-[#121212] dark:text-white outline-none"
      @keypress="handleKeyPress"
    />

    <select
      v-model="priority"
      class="p-2 border rounded-md bg-white text-black dark:bg-[#121212] dark:text-white cursor-pointer"
    >
      <option value="low">🔵 {{ t('components.task_input.priority.low') }}</option>
      <option value="medium">🟡 {{ t('components.task_input.priority.medium') }}</option>
      <option value="high">🔴 {{ t('components.task_input.priority.high') }}</option>
    </select>

    <button
      @click="addTask"
      data-testid="add-task__btn"
      class="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 transition"
    >
      ➕
    </button>
  </div>
</template>

<style>
@media (max-width: 567px) {
  .task-form {
    flex-direction: column;
    gap: 5px;
  }
}
</style>

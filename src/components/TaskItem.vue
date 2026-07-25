<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/store/taskStore'
import { useI18n } from 'vue-i18n'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
}>()

const { t } = useI18n()
const taskStore = useTaskStore()

const priorityColor = computed(() => {
  return {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  }[props.task.priority]
})

/**
 * The priority marker is a bare colored dot, which says nothing on its own to a
 * screen reader or to anyone who has not learned the color code. Naming it costs
 * one attribute and turns the dot into a legible part of the row.
 */
const priorityLabel = computed(() => {
  const name = {
    low: t('components.task_input.priority.low'),
    medium: t('components.task_input.priority.medium'),
    high: t('components.task_input.priority.high'),
  }[props.task.priority]

  return `${t('components.task_item.priority_label')}: ${name}`
})
</script>

<template>
  <li
    @click="taskStore.toggleTask(task.id)"
    class="task-item flex items-center justify-between p-2 rounded-md mb-2 cursor-pointer select-none transition-all bg-white text-black dark:text-white hover:bg-[#eee] dark:bg-[#1e1e1e] dark:hover:bg-[#292929]"
    :class="{ 'opacity-50': task.completed }"
  >
    <!--
      The whole row stays a click target for the mouse, but the toggle itself is
      a real button. A bare `<li>` with a click handler is not in the tab order,
      so completing a task was impossible without a pointer while the delete
      button beside it was reachable — the destructive half of the row worked
      from the keyboard and the reversible half did not. `aria-pressed` carries
      the state that the strike-through shows visually.
    -->
    <button
      type="button"
      data-testid="toggle-btn"
      :aria-pressed="task.completed"
      @click.stop="taskStore.toggleTask(task.id)"
      :class="{ 'line-through text-gray-400': task.completed }"
      class="toggle-btn flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span
        role="img"
        :aria-label="priorityLabel"
        :title="priorityLabel"
        :class="['w-3 h-3 shrink-0 rounded-full', priorityColor]"
      ></span>
      <span>{{ task.text }}</span>
    </button>

    <button
      data-testid="delete-btn"
      type="button"
      :aria-label="t('components.task_item.delete')"
      :title="t('components.task_item.delete')"
      @click.stop="taskStore.removeTask(task.id)"
      class="delete-btn cursor-pointer shrink-0 ml-2 px-2 py-1 rounded-md text-black bg-[#dddbdb] hover:bg-[#c7c5c5] dark:hover:bg-[#463f3f] dark:bg-[#454545] dark:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      ❌
    </button>
  </li>
</template>

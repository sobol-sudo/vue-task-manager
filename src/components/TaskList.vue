<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useTaskStore } from '@/store/taskStore'
import { useI18n } from 'vue-i18n'
import TaskItem from '@/components/TaskItem.vue'

const props = defineProps<{ filter: 'all' | 'active' | 'completed'; searchQuery: string }>()

const { t } = useI18n()
const taskStore = useTaskStore()
const visibleTasks = ref(15)

const paginatedTasks = computed(() => filteredTasks.value.slice(0, visibleTasks.value))

const filteredTasks = computed(() => {
  let tasks = shallowRef(taskStore.tasks).value

  if (props.filter === 'completed') {
    tasks = tasks.filter((task) => task.completed).reverse()
  } else if (props.filter === 'active') {
    tasks = tasks.filter((task) => !task.completed)
  }

  if (props.searchQuery.trim()) {
    tasks = tasks.filter((task) =>
      task.text.toLowerCase().includes(props.searchQuery.toLowerCase()),
    )
  }

  return tasks
})

const loadMoreTasks = () => {
  if (visibleTasks.value < filteredTasks.value.length) {
    visibleTasks.value += 15
  }
}

const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadMoreTasks()
  }
}

onMounted(() => {
  taskStore.fetchTasks()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <ul class="flex flex-col gap-[8px]">
    <TaskItem v-for="task in paginatedTasks" :key="task.id" :task="task" />
  </ul>

  <!--
    Three states, not one: still loading, nothing stored at all, and a filter or
    a search that matched nothing. Collapsing them into a single "no tasks found"
    told a first-time visitor their search had failed before they had typed
    anything.
  -->
  <p v-if="taskStore.isLoading" class="text-black dark:text-gray-400 text-center mt-4">
    {{ t('loading_tasks') }}
  </p>

  <p v-else-if="paginatedTasks.length === 0" class="text-black dark:text-gray-400 text-center mt-4">
    {{ taskStore.tasks.length === 0 ? t('no_tasks_yet') : t('no_tasks') }}
  </p>
</template>

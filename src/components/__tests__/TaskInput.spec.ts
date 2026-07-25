import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskInput from '@/components/TaskInput.vue'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/store/taskStore'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'components.task_input.placeholder': 'Enter task',
      'components.task_input.priority.low': 'Low',
      'components.task_input.priority.medium': 'Medium',
      'components.task_input.priority.high': 'High',
      'error.empty_task': 'Type a task before adding it',
    },
  },
})

describe('TaskInput.vue', () => {
  it('adds a task when the button is clicked', async () => {
    const wrapper = mount(TaskInput, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), i18n],
      },
    })

    const taskStore = useTaskStore()
    const input = wrapper.find('input')
    const button = wrapper.find('button')

    await input.setValue('New task')
    await button.trigger('click')

    expect(taskStore.addTask).toHaveBeenCalled()
  })

  it('does not add a task when the input is empty', async () => {
    const wrapper = mount(TaskInput, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), i18n],
      },
    })

    const taskStore = useTaskStore()
    const button = wrapper.find('button')

    await button.trigger('click')

    expect(taskStore.addTask).not.toHaveBeenCalled()
  })
})

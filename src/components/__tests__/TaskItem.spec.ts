import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from '@/components/TaskItem.vue'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/store/taskStore'
import { createTestI18n } from '@/__tests__/testI18n'

describe('TaskItem.vue', () => {
  it('toggles the task status on click', async () => {
    const wrapper = mount(TaskItem, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
          createTestI18n('en'),
        ],
      },
      props: {
        task: {
          id: 1,
          text: 'Test Task',
          completed: false,
          priority: 'medium',
        },
      },
    })

    const taskStore = useTaskStore()

    await wrapper.trigger('click')
    expect(taskStore.toggleTask).toHaveBeenCalledWith(1)
  })

  it('removes the task via the delete button', async () => {
    const wrapper = mount(TaskItem, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
          createTestI18n('en'),
        ],
      },
      props: {
        task: {
          id: 1,
          text: 'Test Task',
          completed: false,
          priority: 'high',
        },
      },
    })

    const taskStore = useTaskStore()
    const deleteButton = wrapper.find('.delete-btn')

    await deleteButton.trigger('click')
    expect(taskStore.removeTask).toHaveBeenCalledWith(1)
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskItem from '@/components/TaskItem.vue'
import { useTaskStore } from '@/store/taskStore'
import { createTestI18n } from '@/__tests__/testI18n'
import appI18n from '@/lang/i18n'
import type { Task } from '@/types'

const messages = appI18n.global.getLocaleMessage('en')

/**
 * The store is real and only its two actions are replaced by spies, so the
 * component is checked against the actions it actually has — a testing Pinia
 * stubs every action, and would have accepted a call to one that does not
 * exist.
 */
const mountItem = (task: Partial<Task> = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useTaskStore()
  const toggleTask = vi.spyOn(store, 'toggleTask').mockResolvedValue(undefined)
  const removeTask = vi.spyOn(store, 'removeTask').mockResolvedValue(undefined)

  const wrapper = mount(TaskItem, {
    props: {
      task: { id: 1, text: 'Test Task', completed: false, priority: 'medium', ...task },
    },
    global: { plugins: [pinia, createTestI18n('en')] },
  })

  return { wrapper, toggleTask, removeTask }
}

describe('TaskItem.vue', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * The row and the toggle inside it both listen for a click, so that the whole
   * row stays a mouse target while the toggle is a real button. A click on the
   * button therefore has to stop there: let it bubble to the row as well and the
   * task is toggled twice, which lands back where it started and reads as a
   * control that does nothing at all.
   */
  it('toggles the task exactly once, wherever in the row the click lands', async () => {
    const onTheButton = mountItem()
    await onTheButton.wrapper.get('[data-testid="toggle-btn"]').trigger('click')
    expect(onTheButton.toggleTask.mock.calls).toEqual([[1]])

    const onTheRow = mountItem()
    await onTheRow.wrapper.trigger('click')
    expect(onTheRow.toggleTask.mock.calls).toEqual([[1]])
  })

  /**
   * Delete sits inside that same row, so it has to stop the click too. Deleting
   * a task while also toggling it fires a doomed update against a record that is
   * being removed, and the failure surfaces as an unexplained error toast.
   */
  it('deletes the task without also toggling it', async () => {
    const { wrapper, toggleTask, removeTask } = mountItem()

    await wrapper.get('[data-testid="delete-btn"]').trigger('click')

    expect(removeTask.mock.calls).toEqual([[1]])
    expect(toggleTask).not.toHaveBeenCalled()
  })

  /**
   * The row used to say everything it knew through colour and typography alone:
   * a bare `<li>` for the toggle, a coloured dot for the priority and an emoji
   * as the whole of the delete button's name. All three are invisible to a
   * screen reader, and none of them shows up as broken on screen.
   */
  it('names its controls and exposes the completion state', () => {
    const active = mountItem({ priority: 'high' }).wrapper

    const toggle = active.get('[data-testid="toggle-btn"]')
    expect(toggle.element.tagName).toBe('BUTTON')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.classes()).not.toContain('line-through')

    expect(active.get('[data-testid="delete-btn"]').attributes('aria-label')).toBe(
      messages.components.task_item.delete,
    )
    expect(active.get('[role="img"]').attributes('aria-label')).toBe(
      `${messages.components.task_item.priority_label}: ${messages.components.task_input.priority.high}`,
    )

    const completed = mountItem({ completed: true }).wrapper.get('[data-testid="toggle-btn"]')
    expect(completed.attributes('aria-pressed')).toBe('true')
    expect(completed.classes()).toContain('line-through')
  })
})

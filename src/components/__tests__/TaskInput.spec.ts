import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskInput from '@/components/TaskInput.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useTaskStore } from '@/store/taskStore'
import { createTestI18n } from '@/__tests__/testI18n'
import appI18n from '@/lang/i18n'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const messages = appI18n.global.getLocaleMessage('en')

/**
 * The store is real and only its persistence is replaced by a spy, so the
 * component is checked against the actual action rather than against a stub
 * that would accept any call at all.
 */
const mountInput = () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useTaskStore()
  const addTask = vi.spyOn(store, 'addTask').mockResolvedValue(undefined)

  const wrapper = mount(TaskInput, {
    global: { plugins: [pinia, createTestI18n('en')] },
  })

  return { wrapper, addTask }
}

describe('TaskInput.vue', () => {
  afterEach(() => {
    toast.error.mockClear()
    vi.restoreAllMocks()
  })

  it('adds a task with the selected priority when the button is clicked', async () => {
    const { wrapper, addTask } = mountInput()

    await wrapper.get('[data-testid="task-input"]').setValue('New task')
    await wrapper.get('select').setValue('high')
    await wrapper.get('[data-testid="add-task__btn"]').trigger('click')

    expect(addTask).toHaveBeenCalledWith({ text: 'New task', priority: 'high', completed: false })
    // The field is cleared, so the next task does not inherit this one's text.
    expect((wrapper.get('[data-testid="task-input"]').element as HTMLInputElement).value).toBe('')
  })

  // Adding with the keyboard is the fastest way to fill a list, and it runs
  // through a handler of its own that no other test touches.
  it('adds a task when Enter is pressed in the field', async () => {
    const { wrapper, addTask } = mountInput()

    const input = wrapper.get('[data-testid="task-input"]')
    await input.setValue('Typed and confirmed')
    await input.trigger('keypress', { key: 'Enter' })

    expect(addTask).toHaveBeenCalledWith({
      text: 'Typed and confirmed',
      priority: 'low',
      completed: false,
    })
  })

  it('does not add a task when the input is empty', async () => {
    const { wrapper, addTask } = mountInput()

    await wrapper.get('[data-testid="add-task__btn"]').trigger('click')

    expect(addTask).not.toHaveBeenCalled()
  })

  /**
   * A field holding only spaces looks filled, so a button that silently does
   * nothing reads as a broken button. It has to refuse the task and say why.
   */
  it('refuses a task of only whitespace and explains the refusal', async () => {
    const { wrapper, addTask } = mountInput()

    await wrapper.get('[data-testid="task-input"]').setValue('   ')
    await wrapper.get('[data-testid="add-task__btn"]').trigger('click')

    expect(addTask).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(messages.error.empty_task)
  })
})

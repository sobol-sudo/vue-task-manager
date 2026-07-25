import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskImportExport from '@/components/TaskImportExport.vue'
import { useTaskStore } from '@/store/taskStore'
import { createTestI18n } from '@/__tests__/testI18n'
import appI18n from '@/lang/i18n'
import type { Task } from '@/types'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const messages = appI18n.global.getLocaleMessage('en')

const tasks: Task[] = [
  { id: 1, text: 'Write the release notes', completed: false, priority: 'medium' },
  { id: 2, text: 'Ship the release', completed: true, priority: 'high' },
]

const mountImportExport = () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useTaskStore()
  store.tasks = [...tasks]
  // The store owns persistence and is covered by its own tests; here only the
  // handover from the file to the store matters.
  const importTasks = vi.spyOn(store, 'importTasks').mockResolvedValue(undefined)

  const wrapper = mount(TaskImportExport, {
    global: { plugins: [pinia, createTestI18n('en')] },
  })

  return { wrapper, store, importTasks }
}

/** jsdom's `Blob` has no `text()`, so read it the way the component itself does. */
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })

/** Hand a file to the hidden `<input type="file">`, the way the browser does. */
const selectFile = async (wrapper: VueWrapper, contents: string) => {
  const input = wrapper.find('input[type="file"]')
  const file = new File([contents], 'tasks.json', { type: 'application/json' })

  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

describe('TaskImportExport.vue', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let click: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:tasks')

    // jsdom implements neither of these, and clicking a real anchor would try
    // to navigate the test page.
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    toast.error.mockClear()
    toast.success.mockClear()
    toast.info.mockClear()
    vi.restoreAllMocks()
  })

  /**
   * Import replaces the whole list — in production by deleting every task on
   * the server first — so a file that is not a task list must never reach the
   * store. Getting this wrong destroys the user's data rather than showing a
   * cosmetic error.
   */
  it('never hands the store a file that is not a list of tasks', async () => {
    const { wrapper, importTasks } = mountImportExport()

    await selectFile(wrapper, JSON.stringify({ tasks: [{ id: 1, text: 'Wrapped in an object' }] }))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(messages.error.invalid_json))

    await selectFile(wrapper, '{ this is not json at all')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(messages.error.import_failed))

    await selectFile(wrapper, JSON.stringify([{ text: 42 }]))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledTimes(3))

    expect(importTasks).not.toHaveBeenCalled()
  })

  /**
   * Export and import are two halves of one feature: a backup is worthless if
   * the app's own validation rejects it on the way back in.
   */
  it('exports a file that its own import accepts, with the same tasks', async () => {
    const { wrapper, importTasks } = mountImportExport()

    await wrapper.get('button').trigger('click')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('tasks.json')

    const exported = createObjectURL.mock.calls[0][0] as Blob
    const contents = await readBlob(exported)
    expect(JSON.parse(contents)).toEqual(tasks)

    await selectFile(wrapper, contents)
    await vi.waitFor(() => expect(importTasks).toHaveBeenCalledTimes(1))

    expect(importTasks).toHaveBeenCalledWith(tasks)
    expect(toast.error).not.toHaveBeenCalled()
  })
})

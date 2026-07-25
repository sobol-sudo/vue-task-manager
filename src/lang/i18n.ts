import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    //App
    home: '🏠 Home',
    settings: '⚙ Settings',
    about: 'ℹ About',
    app_error: '⚠️ Something went wrong! Check the console.',
    //SettingsView
    theme: '🎨 Theme:',
    language: '🌍 Language:',
    dark: '🌙 Dark',
    light: '☀ Light',
    russian: '🇷🇺 Russian',
    english: '🇬🇧 English',
    // HomeView
    todo_list: 'To-Do List',
    export: '📤 Export',
    import: '📥 Import',
    import_success: '✅ File imported successfully!',
    search_placeholder: '🔍 Search tasks...',
    no_tasks: '❌ No tasks found',
    error: {
      no_file: '⚠️ Error: no file selected',
      invalid_json: 'Error: Invalid JSON format',
      import_failed: 'Error loading JSON file',
    },
    // AboutView
    about_description: '📌 Simple To-Do application on Vue 3.',
    about_tech: '🛠 Powered by Pinia and Vue Router.',
    about_author: '💡 Author',
    about_version: '📅 Version',
    //Components
    components: {
      task_filter: {
        all: 'All',
        active: 'Active',
        completed: 'Completed',
      },
      task_input: {
        placeholder: 'Add a task...',
        priority: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
        },
      },
    },
    //Store
    store: {
      tasks_loaded_local: '✅ Data loaded from LocalStorage',
      tasks_loaded_api: '✅ Data loaded from the server',
      tasks_load_failed: '⚠️ Failed to load tasks!',
      task_added_local: '✅ Task added (LocalStorage)',
      task_added_api: '✅ Task added (API)',
      task_add_failed: '⚠️ Failed to add task!',
      task_removed_local: '🗑️ Task removed (LocalStorage)',
      task_removed_api: '🗑️ Task removed (API)',
      task_remove_failed: '⚠️ Failed to remove task!',
      task_completed_local: '🎉 Task completed! (LocalStorage)',
      task_reactivated_local: '🔄 Task is active again (LocalStorage)',
      task_completed_api: '🎉 Task completed! (API)',
      task_reactivated_api: '🔄 Task is active again (API)',
      task_update_failed: '⚠️ Failed to update task!',
    },
  },
  ru: {
    //App
    home: '🏠 Главная',
    settings: '⚙ Настройки',
    about: 'ℹ О программе',
    app_error: '⚠️ Произошла ошибка! Проверьте консоль.',
    //SettingsView
    theme: '🎨 Тема:',
    language: '🌍 Язык:',
    dark: '🌙 Тёмная',
    light: '☀ Светлая',
    russian: '🇷🇺 Русский',
    english: '🇬🇧 Английский',
    // HomeView
    todo_list: 'Список задач',
    export: '📤 Экспорт',
    import: '📥 Импорт',
    import_success: '✅ Файл успешно импортирован!',
    search_placeholder: '🔍 Поиск задач...',
    no_tasks: '❌ Задачи не найдены',
    error: {
      no_file: '⚠️ Ошибка: Файл не выбран',
      invalid_json: 'Ошибка: Некорректный формат JSON',
      import_failed: 'Ошибка при загрузке JSON',
    },
    // AboutView
    about_description: '📌 Простое To-Do приложение на Vue 3.',
    about_tech: '🛠 Использует Pinia и Vue Router.',
    about_author: '💡 Автор',
    about_version: '📅 Версия',
    //Components
    components: {
      task_filter: {
        all: 'Все',
        active: 'Активные',
        completed: 'Завершенные',
      },
      task_input: {
        placeholder: 'Добавить задачу...',
        priority: {
          low: 'Низкий',
          medium: 'Средний',
          high: 'Высокий',
        },
      },
    },
    //Store
    store: {
      tasks_loaded_local: '✅ Данные загружены из LocalStorage',
      tasks_loaded_api: '✅ Данные загружены с сервера',
      tasks_load_failed: '⚠️ Не удалось загрузить задачи!',
      task_added_local: '✅ Задача добавлена (LocalStorage)',
      task_added_api: '✅ Задача добавлена (API)',
      task_add_failed: '⚠️ Не удалось добавить задачу!',
      task_removed_local: '🗑️ Задача удалена (LocalStorage)',
      task_removed_api: '🗑️ Задача удалена (API)',
      task_remove_failed: '⚠️ Не удалось удалить задачу!',
      task_completed_local: '🎉 Задача выполнена! (LocalStorage)',
      task_reactivated_local: '🔄 Задача снова активна (LocalStorage)',
      task_completed_api: '🎉 Задача выполнена! (API)',
      task_reactivated_api: '🔄 Задача снова активна (API)',
      task_update_failed: '⚠️ Не удалось обновить задачу!',
    },
  },
}

const defaultLang = localStorage.getItem('language') || 'ru'

const i18n = createI18n({
  locale: defaultLang,
  fallbackLocale: 'ru',
  messages,
})

export default i18n

/**
 * Translate outside of a component's `setup()`, where `useI18n()` is not available
 * (Pinia stores, the global error handler). Resolves against the active locale at
 * call time, so switching the language affects subsequent messages.
 */
export const t = (key: string): string => i18n.global.t(key)

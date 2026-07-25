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
    tasks_exported: '📤 Task list saved as tasks.json',
    search_placeholder: '🔍 Search tasks...',
    loading_tasks: '⏳ Loading tasks...',
    no_tasks: '❌ No tasks found',
    no_tasks_yet: '📝 No tasks yet — add the first one above',
    error: {
      no_file: '⚠️ Error: no file selected',
      invalid_json: 'Error: Invalid JSON format',
      import_failed: 'Error loading JSON file',
      empty_task: '⚠️ Type a task before adding it',
      nothing_to_export: '⚠️ There is nothing to export yet',
    },
    // NotFoundView
    not_found_title: '404 — Page not found',
    not_found_description: 'This page does not exist. It may have been moved or the link is wrong.',
    not_found_back_home: '🏠 Back to the task list',
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
      task_item: {
        delete: 'Delete this task',
        priority_label: 'Priority',
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
      tasks_imported_local: '✅ Tasks imported and saved (LocalStorage)',
      tasks_imported_api: '✅ Tasks imported and saved (API)',
      tasks_import_failed: '⚠️ Failed to save the imported tasks!',
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
    tasks_exported: '📤 Список задач сохранён в tasks.json',
    search_placeholder: '🔍 Поиск задач...',
    loading_tasks: '⏳ Загрузка задач...',
    no_tasks: '❌ Задачи не найдены',
    no_tasks_yet: '📝 Задач пока нет — добавьте первую выше',
    error: {
      no_file: '⚠️ Ошибка: Файл не выбран',
      invalid_json: 'Ошибка: Некорректный формат JSON',
      import_failed: 'Ошибка при загрузке JSON',
      empty_task: '⚠️ Введите задачу перед добавлением',
      nothing_to_export: '⚠️ Пока нечего экспортировать',
    },
    // NotFoundView
    not_found_title: '404 — Страница не найдена',
    not_found_description: 'Такой страницы нет. Возможно, она была перемещена или ссылка неверна.',
    not_found_back_home: '🏠 Вернуться к списку задач',
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
      task_item: {
        delete: 'Удалить эту задачу',
        priority_label: 'Приоритет',
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
      tasks_imported_local: '✅ Задачи импортированы и сохранены (LocalStorage)',
      tasks_imported_api: '✅ Задачи импортированы и сохранены (API)',
      tasks_import_failed: '⚠️ Не удалось сохранить импортированные задачи!',
    },
  },
}

const defaultLang = localStorage.getItem('language') || 'en'

document.documentElement.lang = defaultLang

const i18n = createI18n({
  locale: defaultLang,
  fallbackLocale: 'en',
  messages,
})

export default i18n

/**
 * Translate outside of a component's `setup()`, where `useI18n()` is not available
 * (Pinia stores, the global error handler). Resolves against the active locale at
 * call time, so switching the language affects subsequent messages.
 */
export const t = (key: string): string => i18n.global.t(key)

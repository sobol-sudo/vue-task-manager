# Vue Task Manager

A single-page task manager built with Vue 3, TypeScript and Vite. A single Pinia store backs two persistence modes — `localStorage` during development and a REST API in production — so components stay unaware of where data comes from. The UI ships with light/dark themes, English/Russian localization, and both unit (Vitest) and end-to-end (Cypress) test suites.

![Task manager UI](https://github.com/user-attachments/assets/4088a259-3b9b-4e44-8a2a-7861419d01b3)

Live demo: https://super-to-do-list.vercel.app

## Tech stack

- **Vue 3** (Composition API, `<script setup>`) with **TypeScript**
- **Pinia** — state management
- **Vue Router** — client-side routing with lazy-loaded views
- **Vue I18n** — English and Russian locales
- **TailwindCSS 4** — styling, including dark mode
- **Vue Toastification** — feedback on store actions
- **Vite 6** — dev server and build (gzip + brotli precompression, manual vendor chunks, bundle visualizer)
- **Vitest**, **Vue Test Utils**, **@pinia/testing** — unit tests
- **Cypress** — end-to-end tests
- **ESLint**, **Prettier**, **vue-tsc** — linting, formatting, type checking

## Features

- Create tasks with a priority level (low / medium / high), rendered as a colored marker
- Toggle completion by clicking a task; remove it with a per-item delete button
- Filter by all / active / completed, combined with case-insensitive text search
- Import and export the task list as JSON, with shape validation on import
- Incremental rendering — 15 tasks at a time, extended as you scroll
- Light and dark theme, initialized from the OS `prefers-color-scheme` and persisted in `localStorage`
- Language switching between English and Russian, persisted in `localStorage`
- Two persistence modes behind one store: `localStorage` in development, REST API (`VITE_API_URL`) in production
- Three routes — Home, Settings, About — all lazy-loaded

## Testing

Unit tests sit next to the components in `src/components/__tests__` and run in jsdom. Components are mounted with Vue Test Utils against a `createTestingPinia` instance, so store actions are asserted as spies instead of through real persistence:

- `TaskInput.spec.ts` — dispatches `addTask` on submit, and does nothing when the input is empty
- `TaskItem.spec.ts` — dispatches `toggleTask` on click and `removeTask` from the delete button

```sh
npm run test:unit
```

End-to-end tests in `cypress/e2e` run against the production build. `start-server-and-test` boots `vite preview` on port 4173 and hands off to Cypress, so no server has to be started by hand. Components expose `data-testid` hooks, keeping the specs independent of styling. Covered flows: adding a task, toggling its status, deleting it, and verifying tasks survive a page reload.

```sh
npm run test:e2e       # headless, against a production build
npm run test:e2e:dev   # interactive Cypress runner against the dev server
```

Type checking and linting:

```sh
npm run type-check
npm run lint
npm run format
```

## Getting started

The toolchain targets Node.js 22.

```sh
npm install
npm run dev
```

The dev server listens on http://localhost:5173 and persists tasks to `localStorage`.

Production build and local preview:

```sh
npm run build
npm run preview
```

Outside development mode the store talks to a REST API instead, issuing `GET`, `POST`, `PUT` and `DELETE` requests against `${VITE_API_URL}/tasks`, so set `VITE_API_URL` before building.

## License

MIT — see [LICENSE](LICENSE).

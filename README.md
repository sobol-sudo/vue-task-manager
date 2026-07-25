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

- Create tasks with a priority level (low / medium / high), rendered as a colored marker; submitting an empty one is rejected with a message rather than silently ignored
- Toggle completion by clicking a task; remove it with a per-item delete button
- Filter by all / active / completed, combined with case-insensitive text search
- Import and export the task list as JSON, with shape validation on import; an import is written through the active persistence mode, so it survives navigation and reloads
- Incremental rendering — 15 tasks at a time, extended as you scroll
- Light and dark theme, initialized from the OS `prefers-color-scheme` and persisted in `localStorage`
- Language switching between English and Russian, persisted in `localStorage`, English by default
- Two persistence modes behind one store: `localStorage` in development, REST API (`VITE_API_URL`) in production
- Three routes — Home, Settings, About — all lazy-loaded, plus a 404 view for anything else

## Testing

Unit tests sit next to the components in `src/components/__tests__` and run in jsdom. Components are mounted with Vue Test Utils against a `createTestingPinia` instance, so store actions are asserted as spies instead of through real persistence:

- `TaskInput.spec.ts` — dispatches `addTask` on submit, and does nothing when the input is empty
- `TaskItem.spec.ts` — dispatches `toggleTask` on click and `removeTask` from the delete button
- `taskStore.spec.ts` — imports are written to the backend rather than only to memory, a rejected import leaves no tasks in state, and ids coming back as strings are normalized to numbers

```sh
npm run test:unit
```

End-to-end tests in `cypress/e2e` run against the production build. `start-server-and-test` boots `vite preview` on port 4173 and hands off to Cypress, so no server has to be started by hand. Components expose `data-testid` hooks, keeping the specs independent of styling. Covered flows: adding a task, toggling its status, deleting it, and verifying tasks survive a page reload.

The production build writes to the REST backend, which every run shares with whatever is already stored there, so the suite is written not to depend on — or disturb — that state:

- Each run names its tasks with a timestamp, so concurrent or repeated runs never collide.
- Finding a task pages through the list until it appears, rather than assuming it landed on the first screen. The list renders 15 tasks at a time, so a task created during the run sits one page further down for every 15 tasks the backend already held; the suite passes whether that count is 0 or 200.
- Everything a spec created is deleted in an `afterEach`, straight through the REST API rather than the UI. A test that fails halfway still hands the backend back exactly as it found it, so a failing run leaves no orphan records behind for the next one.

Cleanup needs the backend URL, which `cypress.config.ts` resolves the way Vite does — `VITE_API_URL` from the environment, then `.env.production.local`, then `.env.production` — and passes to the specs as `Cypress.env('apiUrl')`.

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

The public demo runs against a shared mock backend, which anyone can write to. To put it back into a representative state — ten tasks spread across the three priorities, a few of them completed:

```sh
npm run seed:demo -- --yes
```

It reads `VITE_API_URL` from the environment (falling back to `.env.production`), deletes the tasks currently on the backend and recreates the fixed set in `scripts/seed-demo-tasks.mjs`.

## License

MIT — see [LICENSE](LICENSE).

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
- Every control is operable from the keyboard and carries a name and a state: the row toggle is a real button with `aria-pressed`, the file picker is opened by a button rather than a label wrapped around a hidden input, the filters expose which one is on, and the priority dot is labelled rather than left as bare color
- Distinct states for the list rather than one catch-all line — loading, nothing stored yet, and a filter or search that matched nothing
- Incremental rendering — 15 tasks at a time, extended as you scroll
- Light and dark theme, initialized from the OS `prefers-color-scheme` and persisted in `localStorage`
- Language switching between English and Russian, persisted in `localStorage`, English by default
- Two persistence modes behind one store: `localStorage` in development, REST API (`VITE_API_URL`) in production
- Three routes — Home, Settings, About — all lazy-loaded, plus a 404 view for anything else; the navigation marks the current one
- Every store action reports its outcome through a toast, export included: an empty list says so instead of downloading an empty file

## Testing

Unit tests sit in `__tests__` folders next to the code they cover and run in jsdom. Except where a test is specifically about a component refusing to call the store, they use a real Pinia instance and stub only the boundary — `fetch` or a single store action — so the store's own logic actually executes:

- `taskStore.spec.ts` — state is written only once the backend has confirmed the change: a rejected `POST`, `DELETE` or `PUT` leaves the list exactly as it was. Ids arriving as strings are normalized to numbers, so a freshly added task can be removed without a reload, and an import that fails leaves nothing behind.
- `TaskList.spec.ts` — the list renders one page of 15 and appends the next page per scroll, narrows correctly by filter and by case-insensitive search, and tells its three empty states apart: the fetch is resolved by hand so that "still loading" is a fixed point in the test rather than a race with it.
- `TaskInput.spec.ts` — submits with the button and with Enter, carrying the selected priority; refuses an empty or whitespace-only task and says why.
- `TaskImportExport.spec.ts` — a file that is not a task list never reaches the store, an exported file is accepted by the app's own import with the same tasks, and an empty list is refused instead of being handed over as a file containing `[]`.
- `TaskItem.spec.ts` — the row and the toggle inside it both answer to a click, so the toggle has to stop the event: a task is completed exactly once wherever in the row the click lands, and deleting one does not also toggle it. The toggle is a button carrying `aria-pressed`, and the delete button and the priority dot are named rather than left as an emoji and a colour.
- `i18n.spec.ts` — both locales define the same keys, and every key the source asks for exists.
- `HomeView.spec.ts` — the page takes all of its text, heading included, from the catalogue.

```sh
npm test           # single run
npm run test:unit  # watch mode
```

End-to-end tests live in `cypress/e2e`. `start-server-and-test` boots `vite preview` on port 4173 and hands off to Cypress, so no server has to be started by hand. Components expose `data-testid` hooks, keeping the specs independent of styling.

`to-do-app.cy.ts` drives the app against its real persistence layer — adding a task, toggling it, deleting it, and reloading the page to prove it was stored.

The other three specs replace persistence for the duration of each test through `cypress/support/seededBackend.ts` — stubbed REST calls against a production build, seeded `localStorage` against the dev server — which is what makes it possible to assert on exact counts and on destructive operations. Nothing leaves the browser in any of them, so they pass with the backend switched off:

- `known-task-list.cy.ts` — pagination past the first page, filtering and search on a list of a known size, and a JSON import that replaces the stored list and survives a reload.
- `keyboard.cy.ts` — every control on the task page is in the tab order, and a task can be completed from the keyboard. Reachability depends on layout, so this can only be measured in a real browser: jsdom does none, and the unit suite cannot see any of it.
- `routing-and-settings.cy.ts` — each route is reachable from the navigation, an unknown deep link lands on the 404 view with a way back, and the theme and the language survive a reload. The navigation check compares what the browser actually paints, because the failure it guards against was a state class that nothing styled — asserting on the class alone passed against the broken build.

The production build writes to the REST backend, which every run shares with whatever is already stored there, so `to-do-app.cy.ts` is written not to depend on — or disturb — that state:

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

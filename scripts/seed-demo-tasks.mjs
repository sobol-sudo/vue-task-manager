#!/usr/bin/env node
/**
 * Reset the demo REST backend to a small, representative task list.
 *
 * The public demo runs against a shared mock API that anyone can write to, so
 * its contents drift over time. This script replaces whatever is there with a
 * fixed set of tasks that spreads across all three priorities and leaves a few
 * completed, so priority markers, the all/active/completed filter and search
 * all show something on first load.
 *
 * Usage:
 *   npm run seed:demo -- --yes                  # uses VITE_API_URL from .env.production
 *   VITE_API_URL=<base-url> npm run seed:demo -- --yes
 *
 * It deletes every task currently on the backend, so it asks for `--yes`.
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const TASKS = [
  { text: 'Review pull request #42', priority: 'high', completed: false },
  { text: 'Fix the flaky checkout test', priority: 'high', completed: false },
  { text: 'Answer design feedback in Figma', priority: 'high', completed: true },
  { text: 'Write release notes for v1.2', priority: 'medium', completed: false },
  { text: 'Refactor the task store selectors', priority: 'medium', completed: false },
  { text: 'Plan the Q3 roadmap review', priority: 'medium', completed: false },
  { text: 'Set up a CI cache for npm install', priority: 'medium', completed: true },
  { text: 'Update the onboarding docs', priority: 'low', completed: false },
  { text: 'Book flights for the team offsite', priority: 'low', completed: false },
  { text: 'Migrate the icons to an SVG sprite', priority: 'low', completed: true },
]

const readApiUrlFromEnvFile = async () => {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env.production')

  try {
    const contents = await readFile(envPath, 'utf8')
    const match = contents.match(/^VITE_API_URL=(.+)$/m)

    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

const main = async () => {
  if (!process.argv.includes('--yes')) {
    console.error('This replaces every task on the demo backend. Re-run with --yes to confirm.')
    process.exit(1)
  }

  const apiUrl = process.env.VITE_API_URL || (await readApiUrlFromEnvFile())
  if (!apiUrl || apiUrl === 'local') {
    console.error('No REST API URL found. Set VITE_API_URL to the demo backend base URL.')
    process.exit(1)
  }

  const listResponse = await fetch(`${apiUrl}/tasks`)
  if (!listResponse.ok) throw new Error(`Failed to read the current tasks: ${listResponse.status}`)

  const existingTasks = await listResponse.json()
  console.log(`Removing ${existingTasks.length} existing task(s)...`)

  for (const task of existingTasks) {
    const response = await fetch(`${apiUrl}/tasks/${task.id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`Failed to remove task ${task.id}: ${response.status}`)
  }

  console.log(`Creating ${TASKS.length} demo task(s)...`)

  for (const task of TASKS) {
    const response = await fetch(`${apiUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!response.ok) throw new Error(`Failed to create "${task.text}": ${response.status}`)
  }

  console.log('Demo backend seeded.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

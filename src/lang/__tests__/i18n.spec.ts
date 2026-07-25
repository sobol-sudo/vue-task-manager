import { describe, it, expect } from 'vitest'
import i18n from '@/lang/i18n'

type Catalogue = Record<string, unknown>

/** `{ error: { no_file: '…' } }` becomes `['error.no_file']`. */
const flatKeys = (catalogue: Catalogue, prefix = ''): string[] =>
  Object.entries(catalogue)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key

      return value && typeof value === 'object' ? flatKeys(value as Catalogue, path) : [path]
    })
    .sort()

const en = i18n.global.getLocaleMessage('en') as Catalogue
const ru = i18n.global.getLocaleMessage('ru') as Catalogue

// Every source file of the app, read as text. Test files are left out: they
// name keys that deliberately do not exist.
const sources = import.meta.glob<string>(
  ['../../**/*.vue', '../../**/*.ts', '!../../**/__tests__/**'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)

/** Collect `t('some.key')` / `$t("some.key")` calls out of a source file. */
const usedKeys = (source: string) =>
  [...source.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)].map((match) => match[1])

describe('the message catalogue', () => {
  /**
   * Russian falls back to English for a missing key, so a half-translated
   * addition shows up as an English string in a Russian interface rather than
   * as an error — invisible unless someone reads the whole page in Russian.
   * Comparing the key sets catches it at once.
   */
  it('offers the same keys in every locale', () => {
    expect(flatKeys(ru)).toEqual(flatKeys(en))
  })

  /**
   * A key that is missing altogether renders as its own dotted path, so a typo
   * ships as `error.empty_task` sitting in the middle of the interface.
   */
  it('defines every key the app asks for', () => {
    const asked = Object.entries(sources).flatMap(([file, source]) =>
      usedKeys(source).map((key) => ({ file, key })),
    )

    // Without this the test would still pass if the glob or the pattern above
    // ever stopped matching anything at all.
    expect(asked.length).toBeGreaterThan(20)

    const missing = asked
      .filter(({ key }) => !i18n.global.te(key, 'en'))
      .map(({ file, key }) => `${file}: ${key}`)

    expect(missing).toEqual([])
  })
})

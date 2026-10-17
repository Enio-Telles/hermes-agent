import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'

import { afterEach, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ execFile: vi.fn() }))
import { stageClipboardImage } from './imageAttachments.js'

const home = mkdtempSync(join(tmpdir(), 'ink-clipboard-test-'))
afterEach(() => { vi.unstubAllEnvs(); vi.mocked(execFile).mockReset(); rmSync(home, { recursive: true, force: true }) })

it('preserves the inherited PYTHONPATH when extracting clipboard images', async () => {
  vi.stubEnv('HERMES_PYTHON_SRC_ROOT', home)
  const site = join(home, 'site-packages')
  vi.stubEnv('PYTHONPATH', [home, site, '', site].join(delimiter))

  let observed: string | undefined
  vi.mocked(execFile).mockImplementationOnce(((...args: unknown[]) => {
    observed = (args[2] as { env: { PYTHONPATH?: string } }).env.PYTHONPATH
    ;(args[3] as (error: Error | null, stdout: unknown, stderr: unknown) => void)(null, { stdout: 'false', stderr: '' }, '')
  }) as unknown as typeof execFile)

  await expect(stageClipboardImage(null as never, null as never)).resolves.toBeNull()
  expect(observed).toBe([home, site].join(delimiter))
})

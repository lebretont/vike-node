export { serverEntryPlugin }

import pc from '@brillout/picocolors'
import { createRequire } from 'module'
import path from 'path'
import type { Plugin } from 'vite'
import type { ConfigVikeNodeResolved } from '../../types.js'
import { assert, assertUsage } from '../../utils/assert.js'
import { injectRollupInputs } from '../utils/injectRollupInputs.js'
import { viteIsSSR } from '../utils/viteIsSSR.js'

const require_ = createRequire(import.meta.url)

function serverEntryPlugin(resolvedConfig: ConfigVikeNodeResolved): Plugin {
  return {
    enforce: 'pre',
    name: 'vike-node:serverEntry',
    async configResolved(config) {
      const { entry } = resolvedConfig.server
      const entries = Object.entries(entry)
      assert(entries.length)
      const resolvedEntries: { [name: string]: string } = {}
      for (const [name, path_] of entries) {
        let entryFilePath = path.join(config.root, path_)
        try {
          resolvedEntries[name] = require_.resolve(entryFilePath)
        } catch (err) {
          assert((err as Record<string, unknown>).code === 'MODULE_NOT_FOUND')
          assertUsage(
            false,
            `No file found at ${entryFilePath}. Does the value ${pc.cyan(`'${entry}'`)} of ${pc.cyan(
              'server.entry'
            )} point to an existing file?`
          )
        }
      }

      if (viteIsSSR(config)) {
        config.build.rollupOptions.input = injectRollupInputs(resolvedEntries, config)
      }
    }
  }
}

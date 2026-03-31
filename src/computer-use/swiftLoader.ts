import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let cached: any

export function requireComputerUseSwift(): any {
  if (process.platform !== 'darwin') {
    throw new Error('@ant/computer-use-swift is macOS-only')
  }
  if (cached) return cached
  const modulePath = process.env.COMPUTER_USE_SWIFT_NODE_PATH ?? process.env.CLAUDE_COMPUTER_USE_SWIFT_NODE_PATH
  if (!modulePath) {
    throw new Error(
      'Missing computer-use swift native module. Set COMPUTER_USE_SWIFT_NODE_PATH to computer_use.node.',
    )
  }
  const loaded = require(modulePath)
  cached = loaded.computerUse ?? loaded
  return cached
}

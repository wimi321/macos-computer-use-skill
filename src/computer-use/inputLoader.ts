import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let cached: any

export function requireComputerUseInput(): any {
  if (cached) return cached
  const modulePath = process.env.COMPUTER_USE_INPUT_NODE_PATH ?? process.env.CLAUDE_COMPUTER_USE_INPUT_NODE_PATH
  if (!modulePath) {
    throw new Error(
      'Missing computer-use input native module. Set COMPUTER_USE_INPUT_NODE_PATH to computer-use-input.node.',
    )
  }
  cached = require(modulePath)
  if (!cached.isSupported) {
    throw new Error('@ant/computer-use-input is not supported on this platform')
  }
  return cached
}

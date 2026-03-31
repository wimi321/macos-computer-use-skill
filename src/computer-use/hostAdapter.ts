import type { ComputerUseHostAdapter, Logger } from '../vendor/computer-use-mcp/types.js'
import { format } from 'node:util'
import { logDebug, logWarn } from '../lib/log.js'
import { COMPUTER_USE_MCP_SERVER_NAME } from './common.js'
import { createCliExecutor } from './executor.js'
import { getChicagoEnabled, getChicagoSubGates } from './gates.js'
import { requireComputerUseSwift } from './swiftLoader.js'

class DebugLogger implements Logger {
  silly(message: string, ...args: unknown[]): void { logDebug(format(message, ...args)) }
  debug(message: string, ...args: unknown[]): void { logDebug(format(message, ...args)) }
  info(message: string, ...args: unknown[]): void { logDebug(format(message, ...args)) }
  warn(message: string, ...args: unknown[]): void { logWarn(format(message, ...args)) }
  error(message: string, ...args: unknown[]): void { logWarn(format(message, ...args)) }
}

let cached: ComputerUseHostAdapter | undefined

export function getComputerUseHostAdapter(): ComputerUseHostAdapter {
  if (cached) return cached
  cached = {
    serverName: COMPUTER_USE_MCP_SERVER_NAME,
    logger: new DebugLogger(),
    executor: createCliExecutor({
      getMouseAnimationEnabled: () => getChicagoSubGates().mouseAnimation,
      getHideBeforeActionEnabled: () => getChicagoSubGates().hideBeforeAction,
    }),
    ensureOsPermissions: async () => {
      const cu = requireComputerUseSwift()
      const accessibility = cu.tcc.checkAccessibility()
      const screenRecording = cu.tcc.checkScreenRecording()
      return accessibility && screenRecording
        ? { granted: true as const }
        : { granted: false as const, accessibility, screenRecording }
    },
    isDisabled: () => !getChicagoEnabled(),
    getSubGates: getChicagoSubGates,
    getAutoUnhideEnabled: () => true,
    cropRawPatch: () => null,
  }
  return cached
}

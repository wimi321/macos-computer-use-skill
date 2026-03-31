import type {
  ComputerExecutor,
  DisplayGeometry,
  FrontmostApp,
  InstalledApp,
  ResolvePrepareCaptureResult,
  RunningApp,
  ScreenshotResult,
} from '../vendor/computer-use-mcp/executor.js'
import { API_RESIZE_PARAMS, targetImageSize } from '../vendor/computer-use-mcp/imageResize.js'
import { errorMessage } from '../lib/errors.js'
import { execFileNoThrow } from '../lib/execFileNoThrow.js'
import { sleep } from '../lib/sleep.js'
import { logDebug, logWarn } from '../lib/log.js'
import { CLI_CU_CAPABILITIES, CLI_HOST_BUNDLE_ID, getTerminalBundleId } from './common.js'
import { drainRunLoop } from './drainRunLoop.js'
import { notifyExpectedEscape } from './escHotkey.js'
import { requireComputerUseInput } from './inputLoader.js'
import { requireComputerUseSwift } from './swiftLoader.js'

const SCREENSHOT_JPEG_QUALITY = 0.75
const MOVE_SETTLE_MS = 50

function computeTargetDims(
  logicalW: number,
  logicalH: number,
  scaleFactor: number,
): [number, number] {
  const physW = Math.round(logicalW * scaleFactor)
  const physH = Math.round(logicalH * scaleFactor)
  return targetImageSize(physW, physH, API_RESIZE_PARAMS)
}

function normalizeDisplayGeometry(display: any): DisplayGeometry {
  return {
    ...display,
    displayId: display.displayId ?? display.id,
    label: display.label ?? display.name,
  }
}

async function readClipboardViaPbpaste(): Promise<string> {
  const { stdout, code } = await execFileNoThrow('pbpaste', [], { useCwd: false })
  if (code !== 0) throw new Error(`pbpaste exited with code ${code}`)
  return stdout
}

async function writeClipboardViaPbcopy(text: string): Promise<void> {
  const { code } = await execFileNoThrow('pbcopy', [], { input: text, useCwd: false })
  if (code !== 0) throw new Error(`pbcopy exited with code ${code}`)
}

function isBareEscape(parts: readonly string[]): boolean {
  if (parts.length !== 1) return false
  const lower = parts[0]!.toLowerCase()
  return lower === 'escape' || lower === 'esc'
}

async function moveAndSettle(input: any, x: number, y: number): Promise<void> {
  await input.moveMouse(x, y, false)
  await sleep(MOVE_SETTLE_MS)
}

async function releasePressed(input: any, pressed: string[]): Promise<void> {
  let key: string | undefined
  while ((key = pressed.pop()) !== undefined) {
    try {
      await input.key(key, 'release')
    } catch {}
  }
}

async function withModifiers<T>(input: any, modifiers: string[], fn: () => Promise<T>): Promise<T> {
  const pressed: string[] = []
  try {
    for (const modifier of modifiers) {
      await input.key(modifier, 'press')
      pressed.push(modifier)
    }
    return await fn()
  } finally {
    await releasePressed(input, pressed)
  }
}

async function typeViaClipboard(input: any, text: string): Promise<void> {
  let saved: string | undefined
  try {
    saved = await readClipboardViaPbpaste()
  } catch {
    logWarn('pbpaste before paste failed; proceeding without restore')
  }

  try {
    await writeClipboardViaPbcopy(text)
    if ((await readClipboardViaPbpaste()) !== text) {
      throw new Error('Clipboard write did not round-trip.')
    }
    await input.keys(['command', 'v'])
    await sleep(100)
  } finally {
    if (typeof saved === 'string') {
      try {
        await writeClipboardViaPbcopy(saved)
      } catch {
        logWarn('clipboard restore after paste failed')
      }
    }
  }
}

async function animatedMove(input: any, targetX: number, targetY: number, mouseAnimationEnabled: boolean): Promise<void> {
  if (!mouseAnimationEnabled) {
    await moveAndSettle(input, targetX, targetY)
    return
  }
  const start = await input.mouseLocation()
  const deltaX = targetX - start.x
  const deltaY = targetY - start.y
  const distance = Math.hypot(deltaX, deltaY)
  if (distance < 1) return
  const durationSec = Math.min(distance / 2000, 0.5)
  if (durationSec < 0.03) {
    await moveAndSettle(input, targetX, targetY)
    return
  }
  const totalFrames = Math.floor(durationSec * 60)
  for (let frame = 1; frame <= totalFrames; frame += 1) {
    const t = frame / totalFrames
    const eased = 1 - Math.pow(1 - t, 3)
    await input.moveMouse(
      Math.round(start.x + deltaX * eased),
      Math.round(start.y + deltaY * eased),
      false,
    )
    if (frame < totalFrames) await sleep(1000 / 60)
  }
  await sleep(MOVE_SETTLE_MS)
}

export function createCliExecutor(opts: {
  getMouseAnimationEnabled: () => boolean
  getHideBeforeActionEnabled: () => boolean
}): ComputerExecutor {
  if (process.platform !== 'darwin') {
    throw new Error(`createCliExecutor called on ${process.platform}. Computer control is macOS-only.`)
  }

  const cu = requireComputerUseSwift()
  const terminalBundleId = getTerminalBundleId()
  const surrogateHost = terminalBundleId ?? CLI_HOST_BUNDLE_ID
  const withoutTerminal = (allowed: readonly string[]): string[] =>
    terminalBundleId === null ? [...allowed] : allowed.filter(id => id !== terminalBundleId)

  logDebug(
    terminalBundleId
      ? 'terminal %s -> surrogate host'
      : 'terminal not detected; falling back to sentinel host',
    terminalBundleId ?? '',
  )

  return {
    capabilities: {
      ...CLI_CU_CAPABILITIES,
      hostBundleId: CLI_HOST_BUNDLE_ID,
    },

    async prepareForAction(allowlistBundleIds: string[], displayId?: number): Promise<string[]> {
      if (!opts.getHideBeforeActionEnabled()) return []
      return drainRunLoop(async () => {
        try {
          const result = await cu.apps.prepareDisplay(allowlistBundleIds, surrogateHost, displayId)
          return result.hidden
        } catch (error) {
          logWarn('prepareForAction failed: %s', errorMessage(error))
          return []
        }
      })
    },

    async previewHideSet(allowlistBundleIds: string[], displayId?: number) {
      return cu.apps.previewHideSet([...allowlistBundleIds, surrogateHost], displayId)
    },

    async getDisplaySize(displayId?: number): Promise<DisplayGeometry> {
      return normalizeDisplayGeometry(cu.display.getSize(displayId))
    },

    async listDisplays(): Promise<DisplayGeometry[]> {
      return cu.display.listAll().map((display: any) => normalizeDisplayGeometry(display))
    },

    async findWindowDisplays(bundleIds: string[]) {
      return cu.apps.findWindowDisplays(bundleIds)
    },

    async resolvePrepareCapture(opts2): Promise<ResolvePrepareCaptureResult> {
      const display = cu.display.getSize(opts2.preferredDisplayId)
      const [targetW, targetH] = computeTargetDims(display.width, display.height, display.scaleFactor)
      return drainRunLoop(async () => {
        const result = await cu.resolvePrepareCapture(
          withoutTerminal(opts2.allowedBundleIds),
          surrogateHost,
          SCREENSHOT_JPEG_QUALITY,
          targetW,
          targetH,
          opts2.preferredDisplayId,
          opts2.autoResolve,
          opts2.doHide,
        )
        const screenshot = result.screenshot ?? result
        return {
          ...screenshot,
          hidden: result.hidden ?? [],
          display: normalizeDisplayGeometry(result.display ?? display),
          resolvedDisplayId: result.resolvedDisplayId ?? result.displayId ?? screenshot.displayId,
          captureError: result.captureError,
        }
      })
    },

    async screenshot(opts2): Promise<ScreenshotResult> {
      const display = cu.display.getSize(opts2.displayId)
      const [targetW, targetH] = computeTargetDims(display.width, display.height, display.scaleFactor)
      return drainRunLoop(() =>
        cu.screenshot.captureExcluding(
          withoutTerminal(opts2.allowedBundleIds),
          SCREENSHOT_JPEG_QUALITY,
          targetW,
          targetH,
          opts2.displayId,
        ),
      )
    },

    async zoom(regionLogical, allowedBundleIds, displayId) {
      const display = cu.display.getSize(displayId)
      const [outW, outH] = computeTargetDims(regionLogical.w, regionLogical.h, display.scaleFactor)
      return drainRunLoop(() =>
        cu.screenshot.captureRegion(
          withoutTerminal(allowedBundleIds),
          regionLogical.x,
          regionLogical.y,
          regionLogical.w,
          regionLogical.h,
          outW,
          outH,
          SCREENSHOT_JPEG_QUALITY,
          displayId,
        ),
      )
    },

    async key(keySequence: string, repeat?: number): Promise<void> {
      const input = requireComputerUseInput()
      const parts = keySequence.split('+').filter(Boolean)
      const isEsc = isBareEscape(parts)
      const count = repeat ?? 1
      await drainRunLoop(async () => {
        for (let i = 0; i < count; i += 1) {
          if (i > 0) await sleep(8)
          if (isEsc) notifyExpectedEscape()
          await input.keys(parts)
        }
      })
    },

    async holdKey(keyNames: string[], durationMs: number): Promise<void> {
      const input = requireComputerUseInput()
      const pressed: string[] = []
      try {
        await drainRunLoop(async () => {
          for (const key of keyNames) {
            if (isBareEscape([key])) notifyExpectedEscape()
            await input.key(key, 'press')
            pressed.push(key)
          }
        })
        await sleep(durationMs)
      } finally {
        await drainRunLoop(() => releasePressed(input, pressed))
      }
    },

    async type(text: string, opts2: { viaClipboard: boolean }): Promise<void> {
      const input = requireComputerUseInput()
      if (opts2.viaClipboard) {
        await drainRunLoop(() => typeViaClipboard(input, text))
        return
      }
      await input.typeText(text)
    },

    readClipboard: readClipboardViaPbpaste,
    writeClipboard: writeClipboardViaPbcopy,

    async click(x, y, button, count, modifiers): Promise<void> {
      const input = requireComputerUseInput()
      await moveAndSettle(input, x, y)
      if (modifiers && modifiers.length > 0) {
        await drainRunLoop(() => withModifiers(input, modifiers, () => input.mouseButton(button, 'click', count)))
      } else {
        await input.mouseButton(button, 'click', count)
      }
    },

    async mouseDown(): Promise<void> {
      await requireComputerUseInput().mouseButton('left', 'press')
    },

    async mouseUp(): Promise<void> {
      await requireComputerUseInput().mouseButton('left', 'release')
    },

    async getCursorPosition(): Promise<{ x: number; y: number }> {
      return requireComputerUseInput().mouseLocation()
    },

    async drag(from, to): Promise<void> {
      const input = requireComputerUseInput()
      if (from) await moveAndSettle(input, from.x, from.y)
      await input.mouseButton('left', 'press')
      await sleep(MOVE_SETTLE_MS)
      try {
        await animatedMove(input, to.x, to.y, opts.getMouseAnimationEnabled())
      } finally {
        await input.mouseButton('left', 'release')
      }
    },

    async moveMouse(x, y): Promise<void> {
      await moveAndSettle(requireComputerUseInput(), x, y)
    },

    async scroll(x, y, dx, dy): Promise<void> {
      const input = requireComputerUseInput()
      await moveAndSettle(input, x, y)
      if (dy !== 0) await input.mouseScroll(dy, 'vertical')
      if (dx !== 0) await input.mouseScroll(dx, 'horizontal')
    },

    async getFrontmostApp(): Promise<FrontmostApp | null> {
      const info = requireComputerUseInput().getFrontmostAppInfo()
      if (!info?.bundleId) return null
      return { bundleId: info.bundleId, displayName: info.appName }
    },

    async appUnderPoint(x, y) {
      return cu.apps.appUnderPoint(x, y)
    },

    async listInstalledApps(): Promise<InstalledApp[]> {
      return drainRunLoop(() => cu.apps.listInstalled())
    },

    async getAppIcon(path: string): Promise<string | undefined> {
      return cu.apps.iconDataUrl?.(path) ?? undefined
    },

    async listRunningApps(): Promise<RunningApp[]> {
      return cu.apps.listRunning()
    },

    async openApp(bundleId: string): Promise<void> {
      await cu.apps.open(bundleId)
    },
  }
}

export async function unhideComputerUseApps(bundleIds: readonly string[]): Promise<void> {
  if (bundleIds.length === 0) return
  await requireComputerUseSwift().apps.unhide([...bundleIds])
}

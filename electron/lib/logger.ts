import { app } from 'electron'
import log from 'electron-log/main'

export function initLogger(): void {
  log.initialize()

  const isPackaged = app.isPackaged
  const isE2e = process.env.E2E_TEST === '1'

  log.transports.file.level = isPackaged ? 'info' : 'debug'
  log.transports.console.level = isPackaged ? 'warn' : 'debug'

  if (isE2e) {
    log.transports.file.level = 'warn'
    log.transports.console.level = false
  }

  log.errorHandler.startCatching()
  log.eventLogger.startLogging()

  log.info('Logger initialized', {
    version: app.getVersion(),
    isPackaged,
    logFile: log.transports.file.getFile().path,
  })
}

export function createScopedLogger(scope: string) {
  return log.scope(scope)
}

export { log }

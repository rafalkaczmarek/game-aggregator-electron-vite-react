import { beforeEach, describe, expect, it, vi } from 'vitest'

const logMock = {
  initialize: vi.fn(),
  transports: {
    file: {
      level: 'debug',
      getFile: vi.fn(() => ({ path: '/tmp/app.log' })),
    },
    console: {
      level: 'debug',
    },
  },
  errorHandler: {
    startCatching: vi.fn(),
  },
  eventLogger: {
    startLogging: vi.fn(),
  },
  info: vi.fn(),
  scope: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getVersion: () => '0.1.0-test',
  },
}))

vi.mock('electron-log/main', () => ({
  default: logMock,
}))

const { initLogger, createScopedLogger } = await import('../electron/lib/logger')

describe('logger', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    logMock.initialize.mockClear()
    logMock.info.mockClear()
    logMock.scope.mockClear()
  })

  it('initializes electron-log transports', () => {
    initLogger()

    expect(logMock.initialize).toHaveBeenCalled()
    expect(logMock.errorHandler.startCatching).toHaveBeenCalled()
    expect(logMock.eventLogger.startLogging).toHaveBeenCalled()
    expect(logMock.info).toHaveBeenCalledWith(
      'Logger initialized',
      expect.objectContaining({ version: '0.1.0-test', isPackaged: false }),
    )
  })

  it('quiets logging during e2e runs', () => {
    vi.stubEnv('E2E_TEST', '1')
    initLogger()

    expect(logMock.transports.file.level).toBe('warn')
    expect(logMock.transports.console.level).toBe(false)
  })

  it('creates scoped loggers', () => {
    const scoped = createScopedLogger('test:scope')
    expect(logMock.scope).toHaveBeenCalledWith('test:scope')
    expect(scoped).toBeDefined()
  })
})

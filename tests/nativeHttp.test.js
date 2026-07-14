const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { transformSync } = require('@babel/core')

function loadNativeHttp({ CapacitorHttp }) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'plugins', 'nativeHttp.js'), 'utf8')
  const { code } = transformSync(source, {
    filename: 'nativeHttp.js',
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
  })
  const module = { exports: {} }
  const localRequire = (id) => (id === '@capacitor/core' ? { CapacitorHttp } : require(id))

  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
  return module.exports.default
}

test('does not log out when the retried request fails after a successful refresh', async () => {
  const CapacitorHttp = {
    request: async () => ({ status: 500, data: 'retry failed' })
  }
  const nativeHttpPlugin = loadNativeHttp({ CapacitorHttp })
  let nativeHttp
  nativeHttpPlugin(
    {
      store: {},
      $db: {
        getRefreshToken: async () => 'refresh-token'
      },
      $socket: null
    },
    (_, value) => {
      nativeHttp = value
    }
  )

  nativeHttp.refreshAccessToken = async () => ({ accessToken: 'new-access-token' })
  nativeHttp.updateTokens = async () => {}
  let logoutCalls = 0
  nativeHttp.handleRefreshFailure = async () => {
    logoutCalls += 1
  }

  await assert.rejects(
    nativeHttp.handleTokenRefresh('GET', 'https://example.test/library', undefined, {}, {}, { id: 'server-1', address: 'https://example.test' }),
    /retry failed/
  )
  assert.equal(logoutCalls, 0)
})

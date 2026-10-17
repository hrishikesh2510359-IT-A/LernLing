import { defineConfig } from 'wxt'

// DEV ONLY: public key that pins the extension ID while developing, so the
// Supabase redirect URL stays stable. Remove `key` before uploading to the Web Store
// and add the Store-assigned ID's redirect URL to Supabase instead.
const DEV_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmeiiBvmCDUJx9lja9u49+ZYoRX+MOAonaWmqSm0gMa6XBLUwVsBPhbHNuiSLXsM5lj/ef5DNuYtp9F6iL5/a0kwl7NwZ3XEZjxskmdrzjwLf93t1JEuSiamK8nLyxJtY+xH3NyK507ywO6QPImy8ZsoOJpMD9+hDXBDV3gE4BUiNZjVaZseWCGUs78Zz6Vj5tSYGloQfvW9hyxLnPV5b72NvfuSGiaEf9VBpnfkqMOMKJfDbUDgx/9Gtkl5Up1DNE3kwrr624gLCKJD2yqI/P9uryxKARxaD8nTuepJyGDO4Q0PyIh9j9T5QXluVwD/cUSwjS8Uc0OM8JaFtTQYMZwIDAQAB'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Lernling',
    description: 'Study streaks with friends. Tracks real learning time on Udemy, Coursera and sites you add.',
    key: DEV_KEY,
    permissions: ['storage', 'alarms', 'idle', 'identity', 'notifications', 'scripting', 'tabs'],
    host_permissions: [
      '*://*.udemy.com/*',
      '*://*.coursera.org/*',
      'https://ruyhstvnoecpnlhyhvmu.supabase.co/*',
    ],
    optional_host_permissions: ['*://*/*'],
  },
})

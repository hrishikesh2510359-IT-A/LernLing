import { createClient } from '@supabase/supabase-js'
import { browser } from 'wxt/browser'

/** Keeps the Supabase session in extension storage so popup, worker and tabs share it. */
const storage = {
  async getItem(key: string) {
    const r = await browser.storage.local.get(key)
    return (r[key] as string | undefined) ?? null
  },
  async setItem(key: string, value: string) {
    await browser.storage.local.set({ [key]: value })
  },
  async removeItem(key: string) {
    await browser.storage.local.remove(key)
  },
}

export const supabase = createClient(
  import.meta.env.WXT_SUPABASE_URL,
  import.meta.env.WXT_SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Implicit flow: launchWebAuthFlow hands tokens back in the URL hash.
      flowType: 'implicit',
    },
  },
)

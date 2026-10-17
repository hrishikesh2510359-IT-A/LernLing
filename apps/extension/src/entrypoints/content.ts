import { startTracker } from '../lib/tracker'

// Built-in sites. Hostname decides which URL parser is used.
export default defineContentScript({
  matches: ['*://*.udemy.com/*', '*://*.coursera.org/*'],
  runAt: 'document_idle',
  main() {
    const host = location.hostname
    startTracker(host.endsWith('udemy.com') ? 'udemy' : 'coursera')
  },
})

import { startTracker } from '../lib/tracker'

// Injected at runtime on sites the user adds with "Track this site"
// (see trackSite in background.ts). Kept as an unlisted script so it adds
// no required host permission to the manifest.
export default defineUnlistedScript(() => {
  startTracker('generic')
})

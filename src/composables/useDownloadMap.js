import { ref } from 'vue'

// Module-level singleton: fetches matrix.json once and caches the drivers map
// so every VersionCell (and any other consumer) shares one request. The map
// holds the real, per-version download URLs transcribed from the spreadsheet —
// these override the guessed .run template for versions whose official download
// lives elsewhere (developer archives, ubuntu debs, drivers/details pages).
const data = ref(null)
let loadPromise = null

function ensure() {
  if (!loadPromise) {
    loadPromise = fetch(import.meta.env.BASE_URL + 'matrix.json')
      .then(r => (r.ok ? r.json() : null))
      .then(j => { data.value = j || null })
      .catch(() => { data.value = null })
  }
  return loadPromise
}

export function useDownloadMap() {
  ensure()
  return { data }
}

// Returns the real download URL for a version if the spreadsheet recorded one,
// otherwise null (caller falls back to the template URL).
export function downloadOverride(version) {
  return data.value?.drivers?.[version]?.download || null
}

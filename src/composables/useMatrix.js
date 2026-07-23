import { ref, computed, onMounted } from 'vue'

// Loads the hand-curated matrix.json (compatibility grid + issue codes +
// compute-capability reference) and merges it with the scraper's live
// drivers.json. Merge rule per cell:
//   - Explicit matrix value (Y / N / Yxxx) always wins.
//   - Enterprise cells with no matrix value infer "Y" when the GPU appears in
//     the official supportedGpus list (word-boundary match), else stay null
//     (shown as "unknown" — we do NOT infer N, because naming mismatches would
//     produce false negatives).
//   - Consumer cells come only from the matrix — drivers.json is the datacenter
//     driver list and never lists GeForce cards, so there is nothing to infer.
//
// Rows are union: every version in the matrix, plus every drivers.json version
// not in the matrix (inferred). Sorted newest-first by version.

// Per-GPU-column matcher. Maps a simplified matrix column name to a regex that
// matches the corresponding SKU(s) in the official supportedGpus list.
// The "HGX *" columns require the HGX prefix so PCIe/NVL variants of the same
// die (H100 PCIe, H200 NVL, A800 PCIe) do not false-positive into the HGX row.
const ENTERPRISE_MATCHERS = {
  B300: /B300\b/,
  B200: /B200\b/,
  'HGX H200': /HGX\s*H200/,
  'HGX H100': /HGX\s*H100\b/,
  'HGX H800': /HGX\s*H800\b/,
  'HGX H20': /HGX\s*H20(?![-0-9])/,
  'HGX H20-3e': /HGX\s*H20[- ]?3e/i,
  'HGX A100': /HGX\s*A100\b/,
  'HGX A800': /HGX\s*A800\b/,
  V100: /V100\b/,
  'RTX 6000D': /RTX\s*6000\s?D\b/i,
  A30: /A30\b/,
  A10: /A10\b/,
  T4: /T4\b/,
}

function compareVersionDesc(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pb[i] || 0) - (pa[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

function familyOf(version) {
  const m = String(version).match(/^(\d{3})/)
  return m ? m[1] : ''
}

function inferEnterprise(gpus, column) {
  const re = ENTERPRISE_MATCHERS[column]
  if (!re) return null
  return gpus.some(g => re.test(g)) ? 'Y' : null
}

export function useMatrix() {
  const matrix = ref(null)
  const drivers = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function loadAll() {
    try {
      loading.value = true
      const base = import.meta.env.BASE_URL
      const [mRes, dRes] = await Promise.all([
        fetch(base + 'matrix.json'),
        fetch(base + 'drivers.json'),
      ])
      if (!mRes.ok) throw new Error(`matrix HTTP ${mRes.status}`)
      matrix.value = await mRes.json()
      // drivers.json is optional for the matrix view — degrade gracefully.
      drivers.value = dRes.ok ? await dRes.json() : []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(loadAll)

  const matrixDrivers = computed(() => matrix.value?.drivers || {})
  const enterpriseGpus = computed(() => matrix.value?.enterpriseGpus || [])
  const consumerGpus = computed(() => matrix.value?.consumerGpus || [])
  const issueCodes = computed(() => matrix.value?.issueCodes || {})
  const computeCapability = computed(() => matrix.value?.computeCapability || [])
  const changeNotes = computed(() => matrix.value?.changeNotes || [])

  const driversByVer = computed(() => {
    const map = new Map()
    for (const d of drivers.value) map.set(d.version, d)
    return map
  })

  // Build a unified enterprise row for a version.
  function buildEnterpriseRow(version) {
    const m = matrixDrivers.value[version]
    const live = driversByVer.get(version)
    const explicit = m?.enterprise || {}
    const supportedGpus = live?.supportedGpus || []

    const cells = {}
    for (const gpu of enterpriseGpus.value) {
      if (explicit[gpu] !== undefined && explicit[gpu] !== null) {
        cells[gpu] = explicit[gpu]
      } else {
        cells[gpu] = inferEnterprise(supportedGpus, gpu)
      }
    }

    return {
      version,
      releaseFamily: (live?.releaseFamily) || familyOf(version),
      releaseDate: m?.releaseDate || live?.releaseDate || '',
      cuda: m?.cuda || live?.cudaVersion || '',
      download: m?.download || '',
      source: m?.enterprise && Object.keys(m.enterprise).length ? 'matrix' : (live ? 'inferred' : 'matrix'),
      cells,
    }
  }

  function buildConsumerRow(version) {
    const m = matrixDrivers.value[version]
    const live = driversByVer.get(version)
    const explicit = m?.consumer || {}
    const cells = {}
    for (const gpu of consumerGpus.value) {
      cells[gpu] = explicit[gpu] !== undefined ? explicit[gpu] : null
    }
    return {
      version,
      releaseFamily: familyOf(version),
      releaseDate: m?.consumerDate || live?.releaseDate || '',
      beta: m?.beta || false,
      download: m?.download || '',
      source: 'matrix',
      cells,
    }
  }

  const enterpriseRows = computed(() => {
    if (!matrix.value) return []
    const versions = new Set([...Object.keys(matrixDrivers.value), ...drivers.value.map(d => d.version)])
    // Keep only versions that have enterprise matrix data OR live data (inferred).
    return [...versions]
      .filter(v => {
        const m = matrixDrivers.value[v]
        const live = driversByVer.get(v)
        const hasMatrixEnt = m?.enterprise && Object.keys(m.enterprise).length > 0
        return hasMatrixEnt || !!live
      })
      .map(buildEnterpriseRow)
      .sort((a, b) => compareVersionDesc(a.version, b.version))
  })

  const consumerRows = computed(() => {
    if (!matrix.value) return []
    return Object.keys(matrixDrivers.value)
      .filter(v => {
        const m = matrixDrivers.value[v]
        return m?.consumer && Object.keys(m.consumer).length > 0
      })
      .map(buildConsumerRow)
      .sort((a, b) => compareVersionDesc(a.version, b.version))
  })

  return {
    loading,
    error,
    enterpriseGpus,
    consumerGpus,
    enterpriseRows,
    consumerRows,
    issueCodes,
    computeCapability,
    changeNotes,
    reload: loadAll,
  }
}

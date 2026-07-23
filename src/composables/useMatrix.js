import { ref, computed, onMounted } from 'vue'

// Loads the curated matrix.json (compatibility grid + issue codes + compute
// capability reference) and rolls it up by driver BRANCH, not individual
// version. One row per branch (R595, R590, …); the cell for each GPU column
// is the latest version's field-verified value (Y / N / Yxxx), and every field
// issue observed anywhere in the branch is aggregated into a per-branch list
// so version-specific history (e.g. a bug fixed in a later release) is not
// lost when versions collapse into one row.
//
// Why no inference from the scraper's official supportedGpus: the field issue
// codes prove that "officially supported" ≠ "works in the field" (e.g. A800 is
// officially supported by 560.35.03 yet field-incompatible). Inferring Y from
// the official list would hide exactly the field incompatibilities this matrix
// exists to surface. The matrix is field-verified (WPS) only; the scraper
// continues to auto-update the Drivers tab.

const codeOf = (v) => {
  const m = String(v || '').match(/^Y(\d+)$/)
  return m ? `Y${m[1].padStart(3, '0')}` : null
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

// Roll versions up into branch rows for one segment (enterprise or consumer).
function rollup(matrixDrivers, gpus, segmentKey, dateKey) {
  const byFam = new Map()
  for (const [version, d] of Object.entries(matrixDrivers)) {
    const seg = d[segmentKey]
    if (!seg || Object.keys(seg).length === 0) continue
    const fam = (version.match(/^(\d{3})/) || ['', ''])[1]
    if (!fam) continue
    if (!byFam.has(fam)) byFam.set(fam, [])
    byFam.get(fam).push(version)
  }

  const branches = []
  for (const [fam, versions] of byFam) {
    versions.sort(compareVersionDesc) // newest first
    const latest = versions[0]
    const latestData = matrixDrivers[latest]
    const seg = latestData[segmentKey]

    const cells = {}
    for (const gpu of gpus) cells[gpu] = seg[gpu] !== undefined ? seg[gpu] : null

    // aggregate every field issue seen in the branch, deduped by (code, gpu)
    const issueMap = new Map()
    for (const v of versions) {
      const s = matrixDrivers[v][segmentKey]
      for (const gpu of gpus) {
        const code = codeOf(s[gpu])
        if (!code) continue
        const key = `${code}|${gpu}`
        if (!issueMap.has(key)) issueMap.set(key, { code, gpu, versions: [] })
        issueMap.get(key).versions.push(v)
      }
    }
    const issues = [...issueMap.values()].sort(
      (a, b) => compareVersionDesc(a.code, b.code) || a.gpu.localeCompare(b.gpu)
    )

    branches.push({
      family: fam,
      latestVersion: latest,
      versionCount: versions.length,
      versions,
      releaseDate: latestData[dateKey] || latestData.releaseDate || '',
      cuda: latestData.cuda || '',
      download: latestData.download || '',
      beta: latestData.beta || false,
      cells,
      issues,
    })
  }
  branches.sort((a, b) => compareVersionDesc(a.family, b.family))
  return branches
}

export function useMatrix() {
  const matrix = ref(null)
  const loading = ref(true)
  const error = ref(null)

  async function load() {
    try {
      loading.value = true
      const res = await fetch(import.meta.env.BASE_URL + 'matrix.json')
      if (!res.ok) throw new Error(`matrix HTTP ${res.status}`)
      matrix.value = await res.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  const md = computed(() => matrix.value?.drivers || {})
  const enterpriseGpus = computed(() => matrix.value?.enterpriseGpus || [])
  const consumerGpus = computed(() => matrix.value?.consumerGpus || [])
  const issueCodes = computed(() => matrix.value?.issueCodes || {})
  const computeCapability = computed(() => matrix.value?.computeCapability || [])
  const changeNotes = computed(() => matrix.value?.changeNotes || [])

  const enterpriseBranches = computed(() =>
    rollup(md.value, enterpriseGpus.value, 'enterprise', 'releaseDate')
  )
  const consumerBranches = computed(() =>
    rollup(md.value, consumerGpus.value, 'consumer', 'consumerDate')
  )

  return {
    loading, error,
    enterpriseGpus, consumerGpus,
    enterpriseBranches, consumerBranches,
    issueCodes, computeCapability, changeNotes,
    reload: load,
  }
}

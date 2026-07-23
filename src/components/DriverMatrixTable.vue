<script setup>
import { ref, computed } from 'vue'
import { useMatrix } from '../composables/useMatrix.js'

const props = defineProps({
  searchQuery: { type: String, default: '' },
})

const {
  loading, error,
  enterpriseGpus, consumerGpus,
  enterpriseBranches, consumerBranches,
  issueCodes, changeNotes, matrixData,
} = useMatrix()

const segment = ref('enterprise') // 'enterprise' | 'consumer'
const selectedCode = ref(null)     // issue code shown in the detail panel
const expandedBranch = ref(null)   // branch family whose version rows are open

const gpus = computed(() => (segment.value === 'enterprise' ? enterpriseGpus.value : consumerGpus.value))
const branches = computed(() => (segment.value === 'enterprise' ? enterpriseBranches.value : consumerBranches.value))

// raw matrix drivers, for rendering expanded per-version rows
const matrixDrivers = computed(() => matrixData.value?.drivers || {})

// build a per-version row (14 GPU cells) from the raw matrix for a branch
function versionRow(segmentKey, version, fam) {
  const d = matrixDrivers.value[version]
  const seg = d?.[segmentKey] || {}
  const cells = {}
  for (const gpu of gpus.value) cells[gpu] = seg[gpu] !== undefined ? seg[gpu] : null
  return {
    version,
    family: fam,
    cells,
    releaseDate: (segmentKey === 'consumer' ? d?.consumerDate : d?.releaseDate) || '',
    beta: d?.beta || false,
  }
}

const filteredBranches = computed(() => {
  const q = props.searchQuery.toLowerCase().trim()
  return branches.value.filter(b => {
    if (!q) return true
    if (b.family.includes(q)) return true
    if (b.latestVersion.toLowerCase().includes(q)) return true
    if ((b.releaseDate || '').includes(q)) return true
    // match when the query names a GPU that this branch supports
    return gpus.value.some(gpu => gpu.toLowerCase().includes(q) && isSupported(b.cells[gpu]))
  })
})

function cellStatus(value) {
  if (!value) return 'unknown'
  if (value === 'N') return 'no'
  if (value === 'Y') return 'yes'
  if (/^Y\d+$/.test(value)) return 'caveat'
  return 'unknown'
}
function isSupported(value) { return value === 'Y' || /^Y\d+$/.test(value) }
function codeOf(value) {
  const m = String(value || '').match(/^Y(\d+)$/)
  return m ? `Y${m[1].padStart(3, '0')}` : null
}
function issueText(code) { return issueCodes.value[code]?.text || '' }
function isRetired(code) { return issueCodes.value[code]?.retired || false }

function selectCell(value) {
  const code = codeOf(value)
  if (code && issueCodes.value[code]) {
    selectedCode.value = selectedCode.value === code ? null : code
  } else {
    selectedCode.value = null
  }
}
function toggleBranch(fam) {
  expandedBranch.value = expandedBranch.value === fam ? null : fam
}

// expanded rows: every version in the branch, newest-first, each with its
// own 14-GPU row. The branch's latest version is shown in the branch row, so
// we skip it here to avoid duplication.
function versionRows(b) {
  const segmentKey = segment.value === 'enterprise' ? 'enterprise' : 'consumer'
  return b.versions
    .filter(v => v !== b.latestVersion)
    .map(v => versionRow(segmentKey, v, b.family))
}

function cellLabel(value) {
  if (!value) return 'no data'
  if (value === 'Y') return 'supported'
  if (value === 'N') return 'incompatible'
  if (/^Y\d+$/.test(value)) return 'supported with caveat'
  return 'no data'
}
function cellSymbol(value) {
  if (!value) return ''
  if (value === 'N') return '×'
  return '✓'
}
// change notes are our own sanitized output; allow <br/>, neutralize other tags
function renderNote(note) {
  return String(note)
    .replace(/</g, '&lt;')
    .replace(/&lt;(\/?br\/?)&gt;/gi, '<$1>')
    .replace(/\|/g, '·')
}

const stats = computed(() => {
  let supported = 0, incompatible = 0, caveats = 0
  for (const b of filteredBranches.value) {
    for (const gpu of gpus.value) {
      const v = b.cells[gpu]
      if (v === 'N') incompatible++
      else if (v === 'Y') supported++
      else if (/^Y\d+$/.test(v)) { caveats++; supported++ }
    }
  }
  return { branches: filteredBranches.value.length, supported, incompatible, caveats }
})
</script>

<template>
  <section class="matrix-shell" aria-label="Driver compatibility matrix">
    <header class="matrix-title">
      <div>
        <p class="eyebrow">Compatibility Matrix</p>
        <h2>GPU × Driver Branch</h2>
        <p class="matrix-meta">Rows are driver branches (R595, R580…), columns are GPU products. Each cell is the branch's latest release status — green = supported, red = incompatible, a code = field caveat (click for details). Expand a branch to see every field issue observed across its releases.</p>
      </div>
      <div class="matrix-summary">
        <strong>{{ stats.branches }}</strong>
        <span>Branches</span>
      </div>
    </header>

    <div v-if="loading" class="state" aria-live="polite">Loading matrix…</div>
    <div v-else-if="error" class="state err" aria-live="assertive">Failed to load matrix: {{ error }}</div>

    <template v-else>
      <div class="segment-bar" role="tablist" aria-label="Matrix segment">
        <button
          role="tab" :aria-selected="segment === 'enterprise'"
          :class="{ active: segment === 'enterprise' }"
          @click="segment = 'enterprise'; selectedCode = null; expandedBranch = null"
        >Enterprise / Data Center</button>
        <button
          role="tab" :aria-selected="segment === 'consumer'"
          :class="{ active: segment === 'consumer' }"
          @click="segment = 'consumer'; selectedCode = null; expandedBranch = null"
        >Consumer / GeForce</button>
      </div>

      <p v-if="segment === 'consumer'" class="segment-note">
        ⚠ 企业级数据中心产品与消费级产品驱动官方不通用 — 这两条分支独立维护。
      </p>

      <div v-if="filteredBranches.length === 0" class="no-results" aria-live="polite">
        <p>No branches match your filter.</p>
      </div>

      <div v-else class="table-scroll">
        <table class="matrix-table" role="grid">
          <thead>
            <tr>
              <th class="corner" scope="col">Branch</th>
              <th v-for="gpu in gpus" :key="gpu" scope="col" class="gpu-col">
                <span class="gpu-name">{{ gpu }}</span>
              </th>
              <th class="expand-col" scope="col">Releases</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="b in filteredBranches" :key="b.family">
              <tr class="branch-row">
                <th class="ver-col" scope="row">
                  <span class="ver-fam">R{{ b.family }}</span>
                  <span class="ver-latest">{{ b.latestVersion }}</span>
                  <span class="ver-meta">{{ b.versionCount }} release{{ b.versionCount === 1 ? '' : 's' }}<span v-if="b.beta"> · BETA</span></span>
                </th>
                <td v-for="gpu in gpus" :key="gpu" class="cell">
                  <button
                    v-if="b.cells[gpu]"
                    class="cell-btn"
                    :class="[cellStatus(b.cells[gpu]), { selected: selectedCode === codeOf(b.cells[gpu]) }]"
                    :title="`R${b.family} latest ${b.latestVersion} · ${gpu} · ${cellLabel(b.cells[gpu])}`"
                    @click="selectCell(b.cells[gpu])"
                  >
                    <span class="cell-mark">{{ cellSymbol(b.cells[gpu]) }}</span>
                    <span v-if="cellStatus(b.cells[gpu]) === 'caveat'" class="cell-code">{{ codeOf(b.cells[gpu]).slice(1) }}</span>
                  </button>
                  <span v-else class="cell-empty" :title="`R${b.family} · ${gpu} · no data`" aria-label="no data"></span>
                </td>
                <td class="expand-col">
                  <button
                    v-if="b.versionCount > 1"
                    class="expand-btn"
                    :class="{ active: expandedBranch === b.family }"
                    :aria-expanded="expandedBranch === b.family"
                    @click="toggleBranch(b.family)"
                  >{{ expandedBranch === b.family ? 'collapse' : `${b.versionCount} releases` }}
                  </button>
                  <span v-else class="no-issues">single</span>
                </td>
              </tr>
              <template v-if="expandedBranch === b.family">
                <tr
                  v-for="vr in versionRows(b)"
                  :key="`${b.family}-${vr.version}`"
                  class="version-row"
                >
                  <th class="ver-col sub" scope="row">
                    <span class="sub-version">{{ vr.version }}<span v-if="vr.beta" class="ver-beta">BETA</span></span>
                    <span class="sub-date">{{ vr.releaseDate }}</span>
                  </th>
                  <td v-for="gpu in gpus" :key="gpu" class="cell">
                    <button
                      v-if="vr.cells[gpu]"
                      class="cell-btn"
                      :class="[cellStatus(vr.cells[gpu]), { selected: selectedCode === codeOf(vr.cells[gpu]) }]"
                      :title="`${vr.version} · ${gpu} · ${cellLabel(vr.cells[gpu])}`"
                      @click="selectCell(vr.cells[gpu])"
                    >
                      <span class="cell-mark">{{ cellSymbol(vr.cells[gpu]) }}</span>
                      <span v-if="cellStatus(vr.cells[gpu]) === 'caveat'" class="cell-code">{{ codeOf(vr.cells[gpu]).slice(1) }}</span>
                    </button>
                    <span v-else class="cell-empty" :title="`${vr.version} · ${gpu} · no data`" aria-label="no data"></span>
                  </td>
                  <td class="expand-col sub"></td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <div class="legend" aria-label="Cell legend">
        <span class="lg"><i class="yes"></i> Supported</span>
        <span class="lg"><i class="caveat"></i> Supported w/ caveat</span>
        <span class="lg"><i class="no"></i> Incompatible</span>
        <span class="lg"><i class="unknown"></i> No data</span>
      </div>

      <article v-if="selectedCode" class="issue-detail" aria-live="polite">
        <header>
          <span class="issue-code" :class="{ retired: isRetired(selectedCode) }">{{ selectedCode }}</span>
          <span v-if="isRetired(selectedCode)" class="retired-tag">retired</span>
          <button class="close" :aria-label="`Dismiss ${selectedCode} detail`" @click="selectedCode = null">&times;</button>
        </header>
        <p>{{ issueText(selectedCode) }}</p>
      </article>

      <footer v-if="changeNotes.length" class="change-notes">
        <p class="cn-title">变更备注</p>
        <ul>
          <li v-for="(note, i) in changeNotes" :key="i" v-html="renderNote(note)"></li>
        </ul>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.matrix-shell {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.matrix-title {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
  background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); padding: 22px 24px;
}
.matrix-title h2 { font-size: 22px; font-weight: 700; margin: 0; }
.eyebrow { color: var(--nv-green); font-size: 11px; font-weight: 700; letter-spacing: 1px; margin: 0 0 8px; text-transform: uppercase; }
.matrix-meta { color: var(--text-muted); font-size: 13px; margin: 8px 0 0; max-width: 680px; }
.matrix-summary { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.matrix-summary strong { color: var(--nv-green); font-size: 28px; line-height: 1; }
.matrix-summary span { color: var(--text-muted); font-size: 11px; letter-spacing: 0.7px; text-transform: uppercase; }

.state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.state.err { color: #e05050; }

.segment-bar { display: flex; gap: 4px; padding: 14px 24px 0; }
.segment-bar button {
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 8px 8px 0 0; color: var(--text-secondary); cursor: pointer;
  font-family: inherit; font-size: 13px; font-weight: 500; padding: 8px 16px; border-bottom: none;
}
.segment-bar button.active { background: var(--nv-green); color: #000; font-weight: 600; }
.segment-note { color: #d4a73a; font-size: 12px; margin: 12px 24px 0; }

.no-results { text-align: center; padding: 60px 20px; color: var(--text-muted); }

.table-scroll { overflow: auto; max-height: 72vh; padding: 0 24px; }
.matrix-table { border-collapse: separate; border-spacing: 3px; width: 100%; }
.matrix-table thead th {
  position: sticky; top: 0; z-index: 20; background: var(--bg-secondary);
  font-size: 11px; font-weight: 600; letter-spacing: 0.3px; color: var(--text-secondary);
  text-transform: uppercase; padding: 8px 6px; text-align: center;
}
.matrix-table thead .corner { position: sticky; left: 0; z-index: 30; text-align: left; min-width: 150px; }
.gpu-col .gpu-name { white-space: nowrap; }
.matrix-table thead .expand-col { min-width: 110px; }

.matrix-table tbody th.ver-col {
  position: sticky; left: 0; z-index: 10; background: var(--bg-card);
  text-align: left; padding: 8px 12px 8px 4px; border-right: 1px solid var(--border-color);
  white-space: nowrap;
}
.matrix-table tbody tr:hover th.ver-col { background: var(--bg-hover); }
.ver-fam { display: block; font-size: 15px; font-weight: 700; color: var(--nv-green); }
.ver-latest { display: block; font-size: 12px; color: var(--text-primary); font-weight: 500; }
.ver-meta { display: block; font-size: 10px; color: var(--text-muted); }

.cell { padding: 0; text-align: center; }
.cell-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 2px;
  width: 100%; min-height: 34px; border: 1px solid transparent; border-radius: 5px;
  background: transparent; cursor: pointer; padding: 2px 4px; font-family: inherit;
  font-size: 11px; font-weight: 600; transition: transform 0.1s, box-shadow 0.1s;
}
.cell-btn:hover { transform: scale(1.06); box-shadow: 0 0 0 2px rgba(255,255,255,0.25); }
.cell-btn:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
.cell-btn.yes { background: #1f5f35; color: #c6f7d0; }
.cell-btn.caveat { background: #238636; color: #eafff0; border-color: #2ea043; }
.cell-btn.no { background: #5a2320; color: #f3b8b4; }
.cell-btn.unknown { background: #202527; color: var(--text-muted); }
.cell-btn.selected { box-shadow: 0 0 0 2px #fff; }
.cell-mark { font-size: 13px; line-height: 1; }
.cell-code { font-size: 9px; opacity: 0.85; }
.cell-empty { display: inline-block; width: 100%; min-height: 34px; background: #202527; border-radius: 5px; }

.expand-col { text-align: center; }
.expand-btn {
  background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px;
  color: var(--text-secondary); cursor: pointer; font-family: inherit; font-size: 11px;
  padding: 5px 9px; white-space: nowrap;
}
.expand-btn:hover, .expand-btn.active { border-color: var(--nv-green); color: var(--nv-green); }
.no-issues { color: var(--text-muted); font-size: 12px; }

/* expanded per-version rows under a branch */
.matrix-table tbody tr.version-row { background: var(--bg-secondary); }
.matrix-table tbody tr.version-row th.ver-col.sub { padding: 4px 12px 4px 16px; background: var(--bg-secondary); z-index: 9; }
.matrix-table tbody tr.version-row .cell-btn { min-height: 26px; }
.matrix-table tbody tr.version-row .cell-empty { min-height: 26px; }
.sub-version { display: block; font-size: 12px; font-weight: 500; color: var(--text-primary); }
.sub-version .ver-beta { margin-left: 6px; font-size: 9px; color: #000; background: #d4a73a; border-radius: 3px; padding: 1px 4px; }
.sub-date { display: block; font-size: 10px; color: var(--text-muted); }
.matrix-table tbody tr.version-row .expand-col.sub { background: var(--bg-secondary); }

.legend { display: flex; flex-wrap: wrap; gap: 14px; padding: 16px 24px 4px; font-size: 11px; color: var(--text-muted); }
.legend .lg { display: inline-flex; align-items: center; gap: 5px; }
.legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.legend i.yes { background: #1f5f35; }
.legend i.caveat { background: #238636; }
.legend i.no { background: #5a2320; }
.legend i.unknown { background: #202527; }

.issue-detail {
  margin: 14px 24px 0; padding: 16px 18px; background: var(--bg-secondary);
  border: 1px solid var(--border-hover); border-left: 3px solid var(--nv-green); border-radius: 8px;
}
.issue-detail header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.issue-code { font-weight: 700; color: var(--nv-green); font-size: 14px; letter-spacing: 0.5px; }
.issue-code.retired { color: #d4a73a; text-decoration: line-through; }
.retired-tag { font-size: 10px; color: #d4a73a; border: 1px solid #d4a73a; border-radius: 3px; padding: 1px 5px; }
.issue-detail .close { margin-left: auto; background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; line-height: 1; }
.issue-detail p { color: var(--text-secondary); font-size: 13px; line-height: 1.6; margin: 0; }

.change-notes { padding: 18px 24px 22px; border-top: 1px solid var(--border-color); margin-top: 16px; }
.cn-title { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); text-transform: uppercase; margin: 0 0 8px; }
.change-notes ul { list-style: none; margin: 0; padding: 0; }
.change-notes li { font-size: 12px; color: var(--text-secondary); line-height: 1.7; padding-left: 14px; position: relative; }
.change-notes li::before { content: '›'; position: absolute; left: 0; color: var(--nv-green); }

@media (max-width: 620px) {
  .matrix-title { flex-direction: column; }
  .matrix-summary { align-items: flex-start; flex-direction: row; }
  .table-scroll { padding: 0 12px; }
  .matrix-table thead .corner { min-width: 110px; }
}
</style>

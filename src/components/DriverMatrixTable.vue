<script setup>
import { ref, computed } from 'vue'
import { useMatrix } from '../composables/useMatrix.js'

const props = defineProps({
  searchQuery: { type: String, default: '' },
  activeFamily: { type: String, default: 'all' },
})

const {
  loading, error,
  enterpriseGpus, consumerGpus,
  enterpriseRows, consumerRows,
  issueCodes, changeNotes,
} = useMatrix()

const segment = ref('enterprise') // 'enterprise' | 'consumer'
const selectedCode = ref(null)     // issue code currently shown in detail panel

const gpus = computed(() => (segment.value === 'enterprise' ? enterpriseGpus.value : consumerGpus.value))

const allRows = computed(() => (segment.value === 'enterprise' ? enterpriseRows.value : consumerRows.value))

const filteredRows = computed(() => {
  const q = props.searchQuery.toLowerCase().trim()
  return allRows.value.filter(row => {
    if (props.activeFamily !== 'all' && String(row.releaseFamily) !== String(props.activeFamily)) return false
    if (!q) return true
    if (row.version.toLowerCase().includes(q)) return true
    if (row.releaseFamily.includes(q)) return true
    if ((row.releaseDate || '').includes(q)) return true
    // search by GPU column key when that GPU is supported
    return gpus.value.some(gpu => gpu.toLowerCase().includes(q) && isSupported(row.cells[gpu]))
  })
})

function cellStatus(value) {
  if (!value) return 'unknown'
  if (value === 'N') return 'no'
  if (value === 'Y') return 'yes'
  if (/^Y\d+$/.test(value)) return 'caveat'
  return 'unknown'
}

function isSupported(value) {
  return value === 'Y' || /^Y\d+$/.test(value)
}

function codeOf(value) {
  const m = String(value || '').match(/^Y(\d+)$/)
  return m ? `Y${m[1].padStart(3, '0')}` : null
}

function issueText(code) {
  const entry = issueCodes.value[code]
  return entry ? entry.text : ''
}

function isRetired(code) {
  return issueCodes.value[code]?.retired || false
}

function selectCell(value) {
  const code = codeOf(value)
  if (code && issueCodes.value[code]) {
    selectedCode.value = selectedCode.value === code ? null : code
  } else {
    selectedCode.value = null
  }
}

// counts for the summary header
const stats = computed(() => {
  const rows = filteredRows.value
  let supported = 0
  let incompatible = 0
  let caveats = 0
  for (const row of rows) {
    for (const gpu of gpus.value) {
      const v = row.cells[gpu]
      if (v === 'N') incompatible++
      else if (v === 'Y') supported++
      else if (/^Y\d+$/.test(v)) { caveats++; supported++ }
    }
  }
  return { rows: rows.length, supported, incompatible, caveats }
})

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

// change notes come from our own sanitized parser output; allow <br/> line
// breaks, neutralize any other angle brackets, and tidy pipes.
function renderNote(note) {
  return String(note)
    .replace(/</g, '&lt;')
    .replace(/&lt;(\/?br\/?)&gt;/gi, '<$1>')
    .replace(/\|/g, '·')
}
</script>

<template>
  <section class="matrix-shell" aria-label="Driver compatibility matrix">
    <header class="matrix-title">
      <div>
        <p class="eyebrow">Compatibility Matrix</p>
        <h2>GPU × Driver Version</h2>
        <p class="matrix-meta">Rows are driver releases, columns are GPU products. Green = supported, red = incompatible, a green cell with a code has a field caveat — click it for details.</p>
      </div>
      <div class="matrix-summary">
        <strong>{{ stats.rows }}</strong>
        <span>Releases</span>
      </div>
    </header>

    <div v-if="loading" class="state" aria-live="polite">Loading matrix…</div>
    <div v-else-if="error" class="state err" aria-live="assertive">Failed to load matrix: {{ error }}</div>

    <template v-else>
      <div class="segment-bar" role="tablist" aria-label="Matrix segment">
        <button
          role="tab" :aria-selected="segment === 'enterprise'"
          :class="{ active: segment === 'enterprise' }"
          @click="segment = 'enterprise'; selectedCode = null"
        >Enterprise / Data Center</button>
        <button
          role="tab" :aria-selected="segment === 'consumer'"
          :class="{ active: segment === 'consumer' }"
          @click="segment = 'consumer'; selectedCode = null"
        >Consumer / GeForce</button>
      </div>

      <p v-if="segment === 'consumer'" class="segment-note">
        ⚠ 企业级数据中心产品与消费级产品驱动官方不通用 — 这两条分支独立维护。
      </p>

      <div v-if="filteredRows.length === 0" class="no-results" aria-live="polite">
        <p>No releases match your filter.</p>
      </div>

      <div v-else class="table-scroll">
        <table class="matrix-table" role="grid">
          <thead>
            <tr>
              <th class="corner" scope="col">Driver</th>
              <th v-for="gpu in gpus" :key="gpu" scope="col" class="gpu-col">
                <span class="gpu-name">{{ gpu }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.version" :class="{ inferred: row.source === 'inferred' }">
              <th class="ver-col" scope="row">
                <span class="ver-num">{{ row.version }}</span>
                <span class="ver-fam">R{{ row.releaseFamily }}</span>
                <span v-if="row.beta" class="ver-beta">BETA</span>
              </th>
              <td v-for="gpu in gpus" :key="gpu" class="cell">
                <button
                  v-if="row.cells[gpu]"
                  class="cell-btn"
                  :class="[cellStatus(row.cells[gpu]), { selected: selectedCode === codeOf(row.cells[gpu]) }]"
                  :title="`${row.version} · ${gpu} · ${cellLabel(row.cells[gpu])}`"
                  @click="selectCell(row.cells[gpu])"
                >
                  <span class="cell-mark">{{ cellSymbol(row.cells[gpu]) }}</span>
                  <span v-if="cellStatus(row.cells[gpu]) === 'caveat'" class="cell-code">{{ codeOf(row.cells[gpu]).slice(1) }}</span>
                </button>
                <span v-else class="cell-empty" :title="`${row.version} · ${gpu} · no data`" aria-label="no data"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legend" aria-label="Cell legend">
        <span class="lg"><i class="yes"></i> Supported</span>
        <span class="lg"><i class="caveat"></i> Supported w/ caveat</span>
        <span class="lg"><i class="no"></i> Incompatible</span>
        <span class="lg"><i class="unknown"></i> No data</span>
        <span class="lg"><i class="inferred"></i> Inferred from official notes</span>
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 22px 24px;
}
.matrix-title h2 { font-size: 22px; font-weight: 700; margin: 0; }
.eyebrow { color: var(--nv-green); font-size: 11px; font-weight: 700; letter-spacing: 1px; margin: 0 0 8px; text-transform: uppercase; }
.matrix-meta { color: var(--text-muted); font-size: 13px; margin: 8px 0 0; max-width: 640px; }
.matrix-summary { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.matrix-summary strong { color: var(--nv-green); font-size: 28px; line-height: 1; }
.matrix-summary span { color: var(--text-muted); font-size: 11px; letter-spacing: 0.7px; text-transform: uppercase; }

.state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.state.err { color: #e05050; }

.segment-bar { display: flex; gap: 4px; padding: 14px 24px 0; }
.segment-bar button {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px 8px 0 0;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-bottom: none;
}
.segment-bar button.active { background: var(--nv-green); color: #000; font-weight: 600; }
.segment-note { color: #d4a73a; font-size: 12px; margin: 12px 24px 0; }

.no-results { text-align: center; padding: 60px 20px; color: var(--text-muted); }

.table-scroll { overflow: auto; max-height: 70vh; padding: 0 24px; }

.matrix-table { border-collapse: separate; border-spacing: 3px; width: 100%; }
.matrix-table thead th {
  position: sticky; top: 0; z-index: 20;
  background: var(--bg-secondary);
  font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
  color: var(--text-secondary); text-transform: uppercase;
  padding: 8px 6px;
  text-align: center;
}
.matrix-table thead .corner {
  position: sticky; left: 0; z-index: 30; text-align: left;
  min-width: 120px;
}
.gpu-col .gpu-name { white-space: nowrap; }
.matrix-table thead th:nth-child(2) { box-shadow: inset -1px 0 0 var(--border-color); }

.matrix-table tbody th.ver-col {
  position: sticky; left: 0; z-index: 10;
  background: var(--bg-card);
  text-align: left;
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  padding: 6px 10px 6px 4px;
  border-right: 1px solid var(--border-color);
  white-space: nowrap;
}
.matrix-table tbody tr:hover th.ver-col { background: var(--bg-hover); }
.ver-num { display: block; }
.ver-fam { font-size: 10px; color: var(--text-muted); font-weight: 500; }
.ver-beta { margin-left: 6px; font-size: 9px; color: #000; background: #d4a73a; border-radius: 3px; padding: 1px 4px; }
.matrix-table tbody tr.inferred th.ver-num::after { content: ' ·'; color: var(--text-muted); font-size: 10px; }

.cell { padding: 0; text-align: center; }
.cell-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 2px; width: 100%; min-height: 30px;
  border: 1px solid transparent; border-radius: 5px;
  background: transparent; cursor: pointer; padding: 2px 4px;
  font-family: inherit; font-size: 11px; font-weight: 600;
  transition: transform 0.1s, box-shadow 0.1s;
}
.cell-btn:hover { transform: scale(1.06); box-shadow: 0 0 0 2px rgba(255,255,255,0.25); }
.cell-btn:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
.cell-btn.yes { background: #1f5f35; color: #c6f7d0; }
.cell-btn.caveat { background: #238636; color: #eafff0; cursor: pointer; border-color: #2ea043; }
.cell-btn.no { background: #5a2320; color: #f3b8b4; }
.cell-btn.unknown { background: #202527; color: var(--text-muted); }
.cell-btn.selected { box-shadow: 0 0 0 2px #fff; }
.cell-mark { font-size: 12px; line-height: 1; }
.cell-code { font-size: 9px; opacity: 0.85; }
.cell-empty { display: inline-block; width: 100%; min-height: 30px; background: #202527; border-radius: 5px; }

/* inferred rows: cells get a dashed tint to signal they're auto-derived */
.matrix-table tbody tr.inferred .cell-btn.yes { background: #2a4d36; border-style: dashed; border-color: #3a6d4a; }

.legend { display: flex; flex-wrap: wrap; gap: 14px; padding: 16px 24px 4px; font-size: 11px; color: var(--text-muted); }
.legend .lg { display: inline-flex; align-items: center; gap: 5px; }
.legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.legend i.yes { background: #1f5f35; }
.legend i.caveat { background: #238636; }
.legend i.no { background: #5a2320; }
.legend i.unknown { background: #202527; }
.legend i.inferred { background: #2a4d36; border: 1px dashed #3a6d4a; }

.issue-detail {
  margin: 14px 24px 0; padding: 16px 18px;
  background: var(--bg-secondary); border: 1px solid var(--border-hover);
  border-left: 3px solid var(--nv-green); border-radius: 8px;
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
  .matrix-table thead .corner { min-width: 96px; }
}
</style>

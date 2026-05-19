<script setup>
import { ref, computed } from 'vue'
import VersionCell from './VersionCell.vue'
import IssuesCell from './IssuesCell.vue'
import GpuCell from './GpuCell.vue'

const props = defineProps({
  drivers: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },
})

const sortKey = ref('releaseDate')
const sortOrder = ref('desc')
const currentPage = ref(1)
const activeIssueVersion = ref(null)
const activeGpuVersion = ref(null)

const sortOptions = {
  version: (a, b) => {
    const pa = a.version.split('.').map(Number)
    const pb = b.version.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0)
    }
    return 0
  },
  releaseDate: (a, b) => a.releaseDate.localeCompare(b.releaseDate),
  cudaVersion: (a, b) => a.cudaVersion.localeCompare(b.cudaVersion),
  releaseFamily: (a, b) => a.releaseFamily.localeCompare(b.releaseFamily),
  fixedIssues: (a, b) => a.fixedIssues.length - b.fixedIssues.length,
  supportedGpus: (a, b) => (a.supportedGpus || []).length - (b.supportedGpus || []).length,
}

const sorted = computed(() => {
  const data = [...props.drivers]
  const cmp = sortOptions[sortKey.value]
  if (cmp) {
    data.sort(cmp)
    if (sortOrder.value === 'desc') data.reverse()
  }
  return data
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / props.pageSize)))
const paged = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sorted.value.slice(start, start + props.pageSize)
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = key === 'releaseDate' ? 'desc' : 'asc'
  }
  currentPage.value = 1
  activeIssueVersion.value = null
  activeGpuVersion.value = null
}

function getAriaSort(key) {
  if (sortKey.value !== key) return 'none'
  return sortOrder.value === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div>
    <table class="driver-table" role="grid">
      <thead>
        <tr>
          <th class="col-version sortable" :aria-sort="getAriaSort('version')" @click="toggleSort('version')" tabindex="0" @keydown.enter="toggleSort('version')" @keydown.space.prevent="toggleSort('version')">
            <span class="sortable-inner">Version
            <svg class="sort-icon" :class="{ active: sortKey === 'version', desc: sortKey === 'version' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-family sortable" :aria-sort="getAriaSort('releaseFamily')" @click="toggleSort('releaseFamily')" tabindex="0" @keydown.enter="toggleSort('releaseFamily')" @keydown.space.prevent="toggleSort('releaseFamily')">
            <span class="sortable-inner">Branch
            <svg class="sort-icon" :class="{ active: sortKey === 'releaseFamily', desc: sortKey === 'releaseFamily' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-date sortable" :aria-sort="getAriaSort('releaseDate')" @click="toggleSort('releaseDate')" tabindex="0" @keydown.enter="toggleSort('releaseDate')" @keydown.space.prevent="toggleSort('releaseDate')">
            <span class="sortable-inner">Release Date
            <svg class="sort-icon" :class="{ active: sortKey === 'releaseDate', desc: sortKey === 'releaseDate' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-cuda sortable" :aria-sort="getAriaSort('cudaVersion')" @click="toggleSort('cudaVersion')" tabindex="0" @keydown.enter="toggleSort('cudaVersion')" @keydown.space.prevent="toggleSort('cudaVersion')">
            <span class="sortable-inner">CUDA
            <svg class="sort-icon" :class="{ active: sortKey === 'cudaVersion', desc: sortKey === 'cudaVersion' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-issues sortable" :aria-sort="getAriaSort('fixedIssues')" @click="toggleSort('fixedIssues')" tabindex="0" @keydown.enter="toggleSort('fixedIssues')" @keydown.space.prevent="toggleSort('fixedIssues')">
            <span class="sortable-inner">Fixed Issues
            <svg class="sort-icon" :class="{ active: sortKey === 'fixedIssues', desc: sortKey === 'fixedIssues' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-gpus sortable" :aria-sort="getAriaSort('supportedGpus')" @click="toggleSort('supportedGpus')" tabindex="0" @keydown.enter="toggleSort('supportedGpus')" @keydown.space.prevent="toggleSort('supportedGpus')">
            <span class="sortable-inner">Supported GPUs
            <svg class="sort-icon" :class="{ active: sortKey === 'supportedGpus', desc: sortKey === 'supportedGpus' && sortOrder === 'desc' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg></span>
          </th>
          <th class="col-doc">Documentation</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in paged" :key="d.version">
          <td class="col-version" data-label="Version">
            <VersionCell :version="d.version" />
          </td>
          <td class="col-family" data-label="Branch">
            <span class="family-badge">R{{ d.releaseFamily }}</span>
          </td>
          <td class="col-date" data-label="Release Date">
            <span class="date-text">{{ d.releaseDate }}</span>
          </td>
          <td class="col-cuda" data-label="CUDA">
            <span class="cuda-text">{{ d.cudaVersion }}</span>
          </td>
          <td class="col-issues" data-label="Fixed Issues">
            <IssuesCell :issues="d.fixedIssues" :version="d.version" v-model:activeVersion="activeIssueVersion" />
          </td>
          <td class="col-gpus" data-label="Supported GPUs">
            <GpuCell :gpus="d.supportedGpus || []" :version="d.version" v-model:activeVersion="activeGpuVersion" />
          </td>
          <td class="col-doc" data-label="Documentation">
            <a class="doc-link" :href="d.docUrl" target="_blank" rel="noopener">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Release Notes
            </a>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 1" class="pagination" role="navigation" aria-label="Table pagination">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
        aria-label="Previous page"
      >&laquo;</button>
      <template v-for="p in totalPages" :key="p">
        <button
          v-if="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="currentPage = p"
          :aria-current="p === currentPage ? 'page' : undefined"
        >{{ p }}</button>
        <span v-else-if="Math.abs(p - currentPage) === 2" class="ellipsis">...</span>
      </template>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
        aria-label="Next page"
      >&raquo;</button>
    </div>
  </div>
</template>

<style scoped>
.driver-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.driver-table thead th {
  background: var(--bg-secondary);
  padding: 14px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 150;
}

.driver-table thead th:first-child {
  border-top-left-radius: 8px;
}

.driver-table thead th:last-child {
  border-top-right-radius: 8px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sortable:hover {
  color: var(--nv-green);
}

.sortable:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: -2px;
  border-radius: 2px;
}

.sort-icon {
  transition: transform 0.2s, opacity 0.2s;
  opacity: 0.3;
}

.sort-icon.active {
  opacity: 1;
  color: var(--nv-green);
}

.sort-icon.desc {
  transform: rotate(180deg);
}

.driver-table tbody tr {
  transition: background 0.15s;
}

.driver-table tbody tr:hover {
  background: var(--bg-hover);
}

.driver-table tbody td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.col-version { width: 180px; }
.col-family { width: 100px; }
.col-date { width: 130px; }
.col-cuda { width: 100px; }
.col-issues { min-width: 200px; }
.col-gpus { min-width: 140px; }
.col-doc { width: 140px; }

.family-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(118, 185, 0, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--nv-green);
}

.date-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.cuda-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(118, 185, 0, 0.08);
  border: 1px solid rgba(118, 185, 0, 0.2);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--nv-green);
  text-decoration: none;
  transition: all 0.2s;
}

.doc-link:hover {
  background: rgba(118, 185, 0, 0.15);
  border-color: var(--nv-green);
  color: var(--nv-green);
  text-decoration: none;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 24px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--nv-green);
  color: var(--nv-green);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: 2px;
}

.page-btn.active {
  background: var(--nv-green);
  border-color: var(--nv-green);
  color: #000;
  font-weight: 600;
}

.ellipsis {
  color: var(--text-muted);
  padding: 0 4px;
}

@media (max-width: 900px) {
  .driver-table thead {
    display: none;
  }

  .driver-table tbody tr {
    display: block;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 16px;
    padding: 16px;
  }

  .driver-table tbody td {
    display: block;
    padding: 8px 0;
    border: none;
  }

  .driver-table tbody td::before {
    content: attr(data-label);
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
}
</style>
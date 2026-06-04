<script setup>
import { computed } from 'vue'

const props = defineProps({
  drivers: { type: Array, required: true },
})

const visibleDrivers = computed(() => [...props.drivers].sort(compareReleaseDesc))

const productColumns = computed(() => {
  const byKey = new Map()

  visibleDrivers.value.forEach(driver => {
    ;(driver.supportedGpus || []).forEach(gpu => {
      const key = normalizeGpuKey(gpu)
      if (!key || byKey.has(key)) return
      byKey.set(key, {
        key,
        label: formatGpuLabel(gpu),
        sourceName: gpu,
      })
    })
  })

  return [...byKey.values()]
})

function compareReleaseDesc(a, b) {
  const byDate = b.releaseDate.localeCompare(a.releaseDate)
  if (byDate !== 0) return byDate
  return compareVersionDesc(a.version, b.version)
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

function getDownloadUrl(version) {
  return `https://us.download.nvidia.com/tesla/${version}/NVIDIA-Linux-x86_64-${version}.run`
}

function normalize(value) {
  return String(value || '').toLowerCase()
}

function normalizeGpuKey(value) {
  return normalize(value)
    .replace(/\bnvidia\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function formatGpuLabel(value) {
  return String(value || '')
    .replace(/\bNVIDIA\s+/g, '')
    .replace(/\s*,\s*/g, ' / ')
    .replace(/\b([A-Z]+ ?\d{2,4})\s+\1\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function supportsProduct(driver, column) {
  const supportedKeys = new Set((driver.supportedGpus || []).map(normalizeGpuKey))
  return supportedKeys.has(column.key)
}

function getCell(driver, column) {
  const supported = supportsProduct(driver, column)
  return supported
    ? { label: 'Y', className: 'yes' }
    : { label: 'N', className: 'no' }
}
</script>

<template>
  <section class="matrix-shell" aria-label="Driver product support matrix">
    <header class="matrix-title">
      <div>
        <p class="eyebrow">Compatibility Matrix</p>
        <h2>Product Support by Driver</h2>
        <p class="matrix-meta">{{ productColumns.length }} product columns from local driver data</p>
      </div>
      <div class="legend" aria-label="Matrix legend">
        <span><i class="legend-dot yes"></i>Supported</span>
        <span><i class="legend-dot no"></i>Not listed</span>
      </div>
    </header>

    <div class="matrix-scroll">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="doc-col">
              <a href="https://docs.nvidia.com/datacenter/tesla/index.html" target="_blank" rel="noopener">
                Driver Release
              </a>
            </th>
            <th class="download-col">Download</th>
            <th class="date-col">Release</th>
            <th class="cuda-col">CUDA</th>
            <th v-for="column in productColumns" :key="column.key" class="product-col">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="driver in visibleDrivers" :key="driver.version">
            <td class="doc-col release-cell">
              <a :href="driver.docUrl" target="_blank" rel="noopener">
                Linux x64 {{ driver.version }} | Linux 64-bit
              </a>
            </td>
            <td class="download-col">
              <a :href="getDownloadUrl(driver.version)" target="_blank" rel="noopener">Download</a>
            </td>
            <td class="date-col">{{ driver.releaseDate }}</td>
            <td class="cuda-col">{{ driver.cudaVersion }}</td>
            <td
              v-for="column in productColumns"
              :key="column.key"
              class="product-col product-cell"
              :class="getCell(driver, column).className"
              :title="`${column.label}: ${getCell(driver, column).label}`"
            >
              <span class="status-pill">{{ getCell(driver, column).label }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.matrix-shell {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow);
  color: var(--text-primary);
  overflow: hidden;
}

.matrix-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 18px 20px;
}

.matrix-title h2 {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.matrix-meta {
  color: var(--text-muted);
  font-size: 13px;
  margin: 8px 0 0;
}

.eyebrow {
  color: var(--nv-green);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.yes {
  background: var(--nv-green);
}

.legend-dot.no {
  background: var(--text-muted);
}

.matrix-scroll {
  max-height: 72vh;
  overflow: auto;
}

.matrix-table {
  width: max-content;
  min-width: 1200px;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.3;
}

.matrix-table th,
.matrix-table td {
  border-bottom: 1px solid var(--border-color);
  height: 42px;
  padding: 8px 12px;
  text-align: center;
  white-space: nowrap;
}

.matrix-table th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.matrix-table a {
  color: var(--nv-green);
  text-decoration: none;
}

.matrix-table a:hover {
  color: #8ed600;
  text-decoration: underline;
}

.matrix-table tbody td {
  background: var(--bg-card);
}

.matrix-table tbody tr {
  transition: background 0.15s;
}

.matrix-table tbody tr:hover td {
  background: var(--bg-hover);
}

.matrix-table .doc-col {
  left: 0;
  position: sticky;
  z-index: 2;
}

.doc-col {
  min-width: 260px;
  text-align: left;
}

.matrix-table th.doc-col {
  z-index: 4;
}

.matrix-table tbody .doc-col {
  background: var(--bg-card);
}

.download-col {
  min-width: 112px;
}

.date-col {
  min-width: 120px;
}

.cuda-col {
  min-width: 80px;
}

.product-col {
  min-width: 92px;
}

.product-cell {
  color: var(--text-secondary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.product-cell.yes .status-pill {
  background: rgba(118, 185, 0, 0.12);
  border: 1px solid rgba(118, 185, 0, 0.28);
  color: var(--nv-green);
}

.product-cell.no .status-pill {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .matrix-shell {
    margin-inline: -16px;
    border-left: none;
    border-right: none;
  }

  .matrix-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .matrix-title h2 {
    font-size: 18px;
  }
}
</style>

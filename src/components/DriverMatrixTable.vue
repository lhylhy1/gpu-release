<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  drivers: { type: Array, required: true },
})

const selectedVersion = ref(null)
const DAYS_PER_COLUMN = 7

const visibleDrivers = computed(() => [...props.drivers].sort(compareReleaseDesc))

const heatmapColumns = computed(() => {
  const columns = []
  for (let index = 0; index < visibleDrivers.value.length; index += DAYS_PER_COLUMN) {
    columns.push(visibleDrivers.value.slice(index, index + DAYS_PER_COLUMN))
  }
  return columns
})

const maxCoverage = computed(() => Math.max(
  1,
  ...visibleDrivers.value.map(driver => getCoverage(driver)),
))

const selectedDriver = computed(() => (
  visibleDrivers.value.find(driver => driver.version === selectedVersion.value)
  || visibleDrivers.value[0]
  || null
))

const selectedProducts = computed(() => (
  [...new Set(selectedDriver.value?.supportedGpus || [])]
    .sort((a, b) => a.localeCompare(b))
))

function compareReleaseDesc(a, b) {
  const byDate = (b.releaseDate || '').localeCompare(a.releaseDate || '')
  if (byDate !== 0) return byDate
  return compareVersionDesc(a.version, b.version)
}

function compareVersionDesc(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let index = 0; index < Math.max(pa.length, pb.length); index += 1) {
    const diff = (pb[index] || 0) - (pa[index] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

function getCoverage(driver) {
  return new Set(driver.supportedGpus || []).size
}

function getCoverageLevel(driver) {
  const coverage = getCoverage(driver)
  if (!coverage) return 0

  const ratio = coverage / maxCoverage.value
  if (ratio >= 0.75) return 4
  if (ratio >= 0.5) return 3
  if (ratio >= 0.25) return 2
  return 1
}

function selectDriver(driver) {
  selectedVersion.value = driver.version
}

function getDownloadUrl(version) {
  return `https://us.download.nvidia.com/tesla/${version}/NVIDIA-Linux-x86_64-${version}.run`
}

function getDriverLabel(driver) {
  const date = driver.releaseDate || 'Release date unavailable'
  return `R${driver.releaseFamily} · ${driver.version} · ${date} · ${getCoverage(driver)} supported products`
}

function formatProductName(product) {
  return String(product).replace(/^NVIDIA\s+/i, '')
}
</script>

<template>
  <section class="matrix-shell" aria-label="Driver product support overview">
    <header class="matrix-title">
      <div>
        <p class="eyebrow">Compatibility Matrix</p>
        <h2>Driver Support Heatmap</h2>
        <p class="matrix-meta">Each square is a driver release. A darker green square supports more listed products.</p>
      </div>
      <div class="matrix-summary" aria-label="Matrix summary">
        <strong>{{ visibleDrivers.length }}</strong>
        <span>Driver releases</span>
      </div>
    </header>

    <div class="heatmap-panel">
      <div class="heatmap-caption">
        <span>Newest</span>
        <span>Click a release to inspect its supported products</span>
        <span>Oldest</span>
      </div>

      <div class="heatmap" role="grid" aria-label="Driver support coverage heatmap">
        <div v-for="(column, columnIndex) in heatmapColumns" :key="columnIndex" class="heatmap-column" role="row">
          <button
            v-for="driver in column"
            :key="driver.version"
            class="heatmap-cell"
            :class="[`level-${getCoverageLevel(driver)}`, { selected: selectedDriver?.version === driver.version }]"
            type="button"
            role="gridcell"
            :aria-label="getDriverLabel(driver)"
            :aria-pressed="selectedDriver?.version === driver.version"
            :title="getDriverLabel(driver)"
            @click="selectDriver(driver)"
          >
            <span class="sr-only">{{ getDriverLabel(driver) }}</span>
          </button>
        </div>
      </div>

      <div class="legend" aria-label="Heatmap coverage legend">
        <span>Product coverage</span>
        <i class="level-0"></i>
        <i class="level-1"></i>
        <i class="level-2"></i>
        <i class="level-3"></i>
        <i class="level-4"></i>
        <span>More</span>
      </div>
    </div>

    <article v-if="selectedDriver" class="driver-detail" aria-live="polite">
      <div class="detail-heading">
        <div>
          <p class="eyebrow">Selected release</p>
          <h3>R{{ selectedDriver.releaseFamily }} · {{ selectedDriver.version }}</h3>
          <p>{{ selectedDriver.releaseDate || 'Release date unavailable' }} <span aria-hidden="true">·</span> CUDA {{ selectedDriver.cudaVersion || '—' }}</p>
        </div>
        <div class="detail-actions">
          <a :href="selectedDriver.docUrl" target="_blank" rel="noopener">Release notes</a>
          <a :href="getDownloadUrl(selectedDriver.version)" target="_blank" rel="noopener">Download</a>
        </div>
      </div>

      <div class="product-heading">
        <strong>{{ selectedProducts.length }}</strong>
        <span>listed supported products</span>
      </div>
      <div v-if="selectedProducts.length" class="product-list">
        <span v-for="product in selectedProducts" :key="product" class="product-pill">{{ formatProductName(product) }}</span>
      </div>
      <p v-else class="empty-products">No supported-product list is available for this release.</p>
    </article>
  </section>
</template>

<style scoped>
.matrix-shell {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow);
  color: var(--text-primary);
  overflow: hidden;
}

.matrix-title,
.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.matrix-title {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 22px 24px;
}

.matrix-title h2,
.detail-heading h3 {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.matrix-meta {
  color: var(--text-muted);
  font-size: 13px;
  margin: 8px 0 0;
  max-width: 620px;
}

.eyebrow {
  color: var(--nv-green);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.matrix-summary {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 2px;
}

.matrix-summary strong {
  color: var(--nv-green);
  font-size: 28px;
  line-height: 1;
}

.matrix-summary span,
.product-heading span {
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}

.heatmap-panel {
  border-bottom: 1px solid var(--border-color);
  padding: 22px 24px 18px;
}

.heatmap-caption {
  align-items: center;
  color: var(--text-muted);
  display: grid;
  font-size: 11px;
  grid-template-columns: 1fr auto 1fr;
  margin-bottom: 12px;
}

.heatmap-caption span:last-child {
  text-align: right;
}

.heatmap-caption span:nth-child(2) {
  text-align: center;
}

.heatmap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.heatmap-column {
  display: grid;
  gap: 4px;
  grid-template-rows: repeat(7, 16px);
}

.heatmap-cell,
.legend i {
  background: #202527;
  border: 1px solid transparent;
  border-radius: 3px;
}

.heatmap-cell {
  cursor: pointer;
  height: 16px;
  padding: 0;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  width: 16px;
}

.heatmap-cell:hover {
  border-color: #b7ee67;
  transform: scale(1.2);
}

.heatmap-cell:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.heatmap-cell.selected {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(118, 185, 0, 0.4);
}

.level-0 { background: #202527; }
.level-1 { background: #1f5f35; }
.level-2 { background: #238636; }
.level-3 { background: #2ea043; }
.level-4 { background: #56d364; }

.legend {
  align-items: center;
  color: var(--text-muted);
  display: flex;
  font-size: 11px;
  gap: 5px;
  justify-content: flex-end;
  margin-top: 16px;
}

.legend i {
  display: block;
  height: 12px;
  width: 12px;
}

.legend span:first-child {
  margin-right: 4px;
}

.legend span:last-child {
  margin-left: 2px;
}

.driver-detail {
  padding: 22px 24px 24px;
}

.detail-heading h3 {
  font-size: 19px;
}

.detail-heading p:not(.eyebrow) {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 8px 0 0;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-actions a {
  background: rgba(118, 185, 0, 0.09);
  border: 1px solid rgba(118, 185, 0, 0.28);
  border-radius: 6px;
  color: var(--nv-green);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;
}

.detail-actions a:hover {
  background: rgba(118, 185, 0, 0.16);
  color: #9edb37;
  text-decoration: none;
}

.product-heading {
  align-items: baseline;
  display: flex;
  gap: 7px;
  margin: 22px 0 10px;
}

.product-heading strong {
  color: var(--nv-green);
  font-size: 18px;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.product-pill {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.3;
  padding: 5px 9px;
}

.empty-products {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
}

.sr-only {
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

@media (max-width: 620px) {
  .matrix-title,
  .detail-heading {
    flex-direction: column;
  }

  .matrix-summary {
    align-items: flex-start;
    flex-direction: row;
  }

  .matrix-summary span {
    align-self: flex-end;
  }

  .heatmap-panel,
  .matrix-title,
  .driver-detail {
    padding-left: 16px;
    padding-right: 16px;
  }

  .heatmap-caption {
    display: flex;
    justify-content: space-between;
  }

  .heatmap-caption span:nth-child(2) {
    display: none;
  }

  .heatmap {
    gap: 3px;
  }

  .heatmap-column {
    gap: 3px;
    grid-template-rows: repeat(7, 13px);
  }

  .heatmap-cell {
    height: 13px;
    width: 13px;
  }

  .legend {
    justify-content: flex-start;
  }
}
</style>

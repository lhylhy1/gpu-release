<script setup>
import { ref, computed, watch } from 'vue'
import { useDrivers } from './composables/useDrivers.js'
import { useCuda } from './composables/useCuda.js'
import AppBanner from './components/AppBanner.vue'
import AppFooter from './components/AppFooter.vue'
import SearchBox from './components/SearchBox.vue'
import FilterChips from './components/FilterChips.vue'
import StatsBar from './components/StatsBar.vue'
import DriverTable from './components/DriverTable.vue'
import DriverMatrixTable from './components/DriverMatrixTable.vue'
import CudaTable from './components/CudaTable.vue'
import ComputeCapabilityTable from './components/ComputeCapabilityTable.vue'

const { drivers, families, loading: driversLoading, error: driversError } = useDrivers()
const { cuda, majorVersions: cudaMajorVersions, loading: cudaLoading, error: cudaError } = useCuda()

const activeTab = ref('drivers')
const searchQuery = ref('')
const activeFamily = ref('all')
const cudaSearchQuery = ref('')
const activeCudaMajor = ref('all')

const filteredDrivers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return drivers.value.filter(d => {
    if (activeFamily.value !== 'all' && String(d.releaseFamily) !== String(activeFamily.value)) return false
    if (!q) return true
    return (
      d.version.toLowerCase().includes(q) ||
      d.releaseFamily.includes(q) ||
      d.cudaVersion.toLowerCase().includes(q) ||
      d.releaseDate.includes(q) ||
      d.fixedIssues.some(i => i.toLowerCase().includes(q)) ||
      (d.supportedGpus || []).some(g => g.toLowerCase().includes(q))
    )
  })
})

const filteredCuda = computed(() => {
  const q = cudaSearchQuery.value.toLowerCase().trim()
  return cuda.value.filter(c => {
    if (activeCudaMajor.value !== 'all' && !c.version.startsWith(activeCudaMajor.value + '.')) return false
    if (!q) return true
    return (
      c.version.toLowerCase().includes(q) ||
      c.versionLabel.toLowerCase().includes(q) ||
      c.linuxDriver.toLowerCase().includes(q)
    )
  })
})

const driverStats = computed(() => ({
  total: filteredDrivers.value.length,
  issues: filteredDrivers.value.reduce((s, d) => s + d.fixedIssues.length, 0),
  latest: filteredDrivers.value.length ? filteredDrivers.value[0].version : '—',
}))

const cudaStats = computed(() => ({
  total: filteredCuda.value.length,
  latest: filteredCuda.value.length ? filteredCuda.value[0].version : '—',
  driverLatest: filteredCuda.value.length ? filteredCuda.value[0].linuxDriver : '—',
}))

watch([searchQuery, activeFamily], () => {
  driverCurrentPage.value = 1
})

watch([cudaSearchQuery, activeCudaMajor], () => {
  cudaCurrentPage.value = 1
})

watch(activeTab, () => {
  searchQuery.value = ''
  activeFamily.value = 'all'
  cudaSearchQuery.value = ''
  activeCudaMajor.value = 'all'
})

const driverCurrentPage = ref(1)
const cudaCurrentPage = ref(1)
</script>

<template>
  <AppBanner />

  <div class="container">
    <div class="tab-bar" role="tablist">
      <button
        class="tab"
        :class="{ active: activeTab === 'drivers' }"
        role="tab"
        :aria-selected="activeTab === 'drivers'"
        @click="activeTab = 'drivers'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        GPU Drivers
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'cuda' }"
        role="tab"
        :aria-selected="activeTab === 'cuda'"
        @click="activeTab = 'cuda'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        CUDA Toolkit
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'matrix' }"
        role="tab"
        :aria-selected="activeTab === 'matrix'"
        @click="activeTab = 'matrix'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
        Matrix
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'capability' }"
        role="tab"
        :aria-selected="activeTab === 'capability'"
        @click="activeTab = 'capability'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 12h16"/><path d="M12 4v16"/></svg>
        Capability
      </button>
    </div>

    <template v-if="activeTab === 'drivers' || activeTab === 'matrix'">
      <div class="toolbar">
        <SearchBox v-model="searchQuery" placeholder="Search driver version, CUDA version, date, issues, or GPU model..." />
        <FilterChips :families="families" v-model="activeFamily" />
      </div>

      <template v-if="activeTab === 'drivers'">
        <div v-if="driversLoading" class="loading" aria-live="polite">Loading drivers...</div>
        <div v-else-if="driversError" class="error" aria-live="assertive">Failed to load: {{ driversError }}</div>
        <template v-else>
          <StatsBar
            :total="driverStats.total"
            :issues="driverStats.issues"
            :latest="driverStats.latest"
          />

          <div v-if="filteredDrivers.length === 0" class="no-results" aria-live="polite">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/></svg>
            <p>No drivers match your search.</p>
          </div>

          <DriverTable v-else :drivers="filteredDrivers" />
        </template>
      </template>

      <DriverMatrixTable v-else :search-query="searchQuery" :active-family="activeFamily" />
    </template>

    <template v-else-if="activeTab === 'cuda'">
      <div class="toolbar">
        <SearchBox v-model="cudaSearchQuery" placeholder="Search CUDA version, driver version..." />
        <FilterChips :families="cudaMajorVersions" v-model="activeCudaMajor" prefix="v" />
      </div>

      <div v-if="cudaLoading" class="loading" aria-live="polite">Loading CUDA toolkit data...</div>
      <div v-else-if="cudaError" class="error" aria-live="assertive">Failed to load: {{ cudaError }}</div>
      <template v-else>
        <StatsBar
          :total="cudaStats.total"
          :latest="cudaStats.latest"
          :issues="0"
          total-label="Releases"
          latest-label="Latest CUDA"
          issues-label=""
        />

        <div v-if="filteredCuda.length === 0" class="no-results" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/></svg>
          <p>No CUDA toolkit entries match your search.</p>
        </div>

        <CudaTable v-else :drivers="filteredCuda" />
      </template>
    </template>

    <template v-else-if="activeTab === 'capability'">
      <ComputeCapabilityTable />
    </template>
  </div>

  <AppFooter />
</template>

<style>
:root {
  --nv-green: #76B900;
  --nv-green-dark: #5a8f00;
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-card: #1a1a1a;
  --bg-hover: #222222;
  --text-primary: #e0e0e0;
  --text-secondary: #999999;
  --text-muted: #666666;
  --border-color: #2a2a2a;
  --border-hover: #3a3a3a;
  --tooltip-bg: #2a2a2a;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

a {
  color: var(--nv-green);
  text-decoration: none;
  transition: color 0.2s;
}

a:hover {
  color: var(--nv-green-dark);
  text-decoration: underline;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  width: fit-content;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.tab:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tab:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: -2px;
}

.tab.active {
  background: var(--nv-green);
  color: #000;
  font-weight: 600;
}

.tab svg {
  flex-shrink: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.loading,
.error {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  font-size: 16px;
}

.error {
  color: #e05050;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.no-results svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.no-results p {
  font-size: 16px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}

@media (max-width: 480px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-bar {
    width: 100%;
  }

  .tab {
    flex: 1;
    justify-content: center;
  }
}
</style>

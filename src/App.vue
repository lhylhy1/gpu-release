<script setup>
import { ref, computed, watch } from 'vue'
import { useDrivers } from './composables/useDrivers.js'
import AppBanner from './components/AppBanner.vue'
import AppFooter from './components/AppFooter.vue'
import SearchBox from './components/SearchBox.vue'
import FilterChips from './components/FilterChips.vue'
import StatsBar from './components/StatsBar.vue'
import DriverTable from './components/DriverTable.vue'

const { drivers, families, loading, error } = useDrivers()

const searchQuery = ref('')
const activeFamily = ref('all')

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return drivers.value.filter(d => {
    if (activeFamily.value !== 'all' && String(d.releaseFamily) !== String(activeFamily.value)) return false
    if (!q) return true
    return (
      d.version.toLowerCase().includes(q) ||
      d.releaseFamily.includes(q) ||
      d.cudaVersion.toLowerCase().includes(q) ||
      d.releaseDate.includes(q) ||
      d.fixedIssues.some(i => i.toLowerCase().includes(q))
    )
  })
})

const stats = computed(() => ({
  total: filtered.value.length,
  issues: filtered.value.reduce((s, d) => s + d.fixedIssues.length, 0),
  latest: filtered.value.length ? filtered.value[0].version : '—',
}))

watch([searchQuery, activeFamily], () => {
  currentPage.value = 1
})

const currentPage = ref(1)
</script>

<template>
  <AppBanner />

  <div class="container">
    <div class="toolbar">
      <SearchBox v-model="searchQuery" />
      <FilterChips :families="families" v-model="activeFamily" />
    </div>

    <div v-if="loading" class="loading" aria-live="polite">Loading drivers...</div>
    <div v-else-if="error" class="error" aria-live="assertive">Failed to load: {{ error }}</div>
    <template v-else>
      <StatsBar
        :total="stats.total"
        :issues="stats.issues"
        :latest="stats.latest"
      />

      <div v-if="filtered.length === 0" class="no-results" aria-live="polite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/></svg>
        <p>No drivers match your search.</p>
      </div>

      <DriverTable v-else :drivers="filtered" />
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
}
</style>
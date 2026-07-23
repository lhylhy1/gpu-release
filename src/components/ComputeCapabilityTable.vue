<script setup>
import { computed } from 'vue'
import { useDownloadMap } from '../composables/useDownloadMap.js'

// Reuses the shared matrix.json singleton — no separate fetch. The compute
// capability table is static reference data transcribed from the spreadsheet
// (source: developer.nvidia.com/cuda-gpus).
const { data } = useDownloadMap()

const rows = computed(() => data.value?.computeCapability || [])
const ready = computed(() => data.value !== null)
</script>

<template>
  <section class="cc-shell" aria-label="Compute Capability reference">
    <header class="cc-title">
      <div>
        <p class="eyebrow">Reference</p>
        <h2>Compute Capability</h2>
        <p class="cc-meta">GPU → Compute Capability → architecture family. Source: <a href="https://developer.nvidia.com/cuda-gpus" target="_blank" rel="noopener">developer.nvidia.com/cuda-gpus</a>. Useful for picking <code>-arch</code>/<code>-gencode</code> flags when compiling CUDA kernels.</p>
      </div>
    </header>

    <div v-if="!ready" class="state" aria-live="polite">Loading reference…</div>

    <div v-else class="table-scroll">
      <table class="cc-table" role="grid">
        <thead>
          <tr>
            <th scope="col">Compute Capability</th>
            <th scope="col">Data Center</th>
            <th scope="col">GeForce / RTX</th>
            <th scope="col">Jetson</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.cc">
            <th scope="row" class="cc-cell">{{ row.cc }}</th>
            <td>
              <span v-for="g in row.dataCenter" :key="g" class="pill">{{ g }}</span>
              <span v-if="!row.dataCenter?.length" class="dash">—</span>
            </td>
            <td>
              <span v-for="g in row.geforce" :key="g" class="pill">{{ g }}</span>
              <span v-if="!row.geforce?.length" class="dash">—</span>
            </td>
            <td>
              <span v-for="g in row.jetson" :key="g" class="pill">{{ g }}</span>
              <span v-if="!row.jetson?.length" class="dash">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.cc-shell {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.cc-title {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 22px 24px;
}
.cc-title h2 { font-size: 22px; font-weight: 700; margin: 0; }
.eyebrow { color: var(--nv-green); font-size: 11px; font-weight: 700; letter-spacing: 1px; margin: 0 0 8px; text-transform: uppercase; }
.cc-meta { color: var(--text-muted); font-size: 13px; margin: 8px 0 0; max-width: 640px; }
.cc-meta code { background: var(--bg-hover); padding: 1px 5px; border-radius: 3px; color: var(--nv-green); font-size: 12px; }
.state { text-align: center; padding: 60px 20px; color: var(--text-muted); }

.table-scroll { overflow-x: auto; padding: 8px 24px 22px; }
.cc-table { border-collapse: collapse; width: 100%; }
.cc-table thead th {
  text-align: left; padding: 10px 12px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  color: var(--text-muted); border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; background: var(--bg-card);
}
.cc-table tbody th, .cc-table tbody td {
  padding: 12px; border-bottom: 1px solid var(--border-color); vertical-align: top;
}
.cc-table tbody tr:hover { background: var(--bg-hover); }
.cc-cell { font-weight: 700; color: var(--nv-green); font-size: 15px; white-space: nowrap; width: 160px; }
.pill {
  display: inline-block; margin: 2px 4px 2px 0; padding: 3px 8px;
  background: rgba(255, 255, 255, 0.045); border: 1px solid var(--border-color);
  border-radius: 999px; font-size: 12px; color: var(--text-secondary); line-height: 1.3;
}
.dash { color: var(--text-muted); }

@media (max-width: 620px) {
  .cc-cell { width: 110px; }
  .table-scroll { padding: 8px 12px 18px; }
}
</style>

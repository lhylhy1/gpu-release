<script setup>
defineProps({
  total: { type: Number, default: 0 },
  issues: { type: Number, default: 0 },
  latest: { type: String, default: '—' },
  totalLabel: { type: String, default: 'Drivers' },
  issuesLabel: { type: String, default: 'Fixed Issues' },
  latestLabel: { type: String, default: 'Latest' },
})
</script>

<template>
  <div class="stats-bar">
    <div class="stat">
      <span class="stat-value">{{ total }}</span>
      <span class="stat-label">{{ totalLabel }}</span>
    </div>
    <div v-if="issuesLabel" class="stat">
      <span class="stat-value">{{ issues }}</span>
      <span class="stat-label">{{ issuesLabel }}</span>
    </div>
    <div class="stat">
      <span class="stat-value">{{ latest }}</span>
      <span class="stat-label">{{ latestLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--nv-green);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 900px) {
  .stats-bar {
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>
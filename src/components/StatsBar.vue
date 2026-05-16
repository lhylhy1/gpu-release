<script setup>
defineProps({
  total: { type: Number, default: 0 },
  issues: { type: Number, default: 0 },
  latest: { type: String, default: '—' },
})
</script>

<template>
  <div class="stats-bar">
    <div class="stat">
      <span class="stat-value">{{ total }}</span>
      <span class="stat-label">Drivers</span>
    </div>
    <div class="stat">
      <span class="stat-value">{{ issues }}</span>
      <span class="stat-label">Fixed Issues</span>
    </div>
    <div class="stat">
      <span class="stat-value">{{ latest }}</span>
      <span class="stat-label">Latest</span>
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
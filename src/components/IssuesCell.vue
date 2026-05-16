<script setup>
import { computed } from 'vue'

const props = defineProps({
  issues: { type: Array, required: true },
  version: { type: String, required: true },
  activeVersion: { type: String, default: null },
})

const emit = defineEmits(['update:activeVersion'])

const expanded = computed(() => props.activeVersion === props.version)

function toggle() {
  emit('update:activeVersion', expanded.value ? null : props.version)
}
</script>

<template>
  <div class="issues-cell">
    <button
      class="issues-preview"
      @click="toggle"
      :aria-expanded="expanded"
      :aria-controls="`issues-${version}`"
    >
      <span class="issue-count">{{ issues.length }}</span>
      <span class="issues-label">fixed issues</span>
      <svg
        class="chevron"
        :class="{ rotated: expanded }"
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      ><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <Transition name="slide">
      <div
        v-if="expanded"
        :id="`issues-${version}`"
        class="issue-panel"
        role="region"
        :aria-label="`Fixed issues for v${version}`"
      >
        <div class="issue-panel-header">
          <span class="issue-panel-title">Fixed Issues</span>
          <span class="issue-panel-version">v{{ version }}</span>
        </div>
        <ul class="issue-list">
          <li v-for="(issue, i) in issues" :key="i">{{ issue }}</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.issues-cell {
  position: relative;
}

.issues-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 0;
  background: none;
  border: none;
  font-family: inherit;
  color: inherit;
}

.issues-preview:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: 2px;
  border-radius: 4px;
}

.issue-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.issues-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.chevron {
  transition: transform 0.2s;
  color: var(--text-muted);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.issue-panel {
  margin-top: 8px;
  min-width: 0;
  background: var(--tooltip-bg);
  border: 1px solid var(--border-hover);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 20px;
}

.issue-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.issue-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.issue-panel-version {
  font-size: 12px;
  color: var(--nv-green);
  font-weight: 500;
}

.issue-list {
  list-style: none;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.issue-list::-webkit-scrollbar {
  width: 6px;
}

.issue-list::-webkit-scrollbar-track {
  background: var(--tooltip-bg);
  border-radius: 3px;
}

.issue-list::-webkit-scrollbar-thumb {
  background: var(--border-hover);
  border-radius: 3px;
}

.issue-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.issue-list li {
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.issue-list li:last-child {
  border-bottom: none;
}

.issue-list li::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--nv-green);
  border-radius: 50%;
  margin-right: 10px;
  vertical-align: middle;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (min-width: 901px) {
  .issue-panel {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 100;
    min-width: 450px;
    max-width: 550px;
  }
}

@media (max-width: 900px) {
  .issue-panel {
    max-width: 90vw;
  }
}
</style>
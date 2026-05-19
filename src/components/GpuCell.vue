<script setup>
import { computed } from 'vue'

const props = defineProps({
  gpus: { type: Array, default: () => [] },
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
  <div class="gpu-cell">
    <button
      class="gpu-preview"
      @click="toggle"
      :aria-expanded="expanded"
      :aria-controls="`gpus-${version}`"
    >
      <span class="gpu-count">{{ gpus.length }}</span>
      <span class="gpu-label">GPUs</span>
      <svg
        class="chevron"
        :class="{ rotated: expanded }"
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      ><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <Transition name="slide">
      <div
        v-if="expanded"
        :id="`gpus-${version}`"
        class="gpu-panel"
        role="region"
        :aria-label="`Supported GPUs for v${version}`"
      >
        <div class="gpu-panel-header">
          <span class="gpu-panel-title">Supported Data Center GPUs</span>
          <span class="gpu-panel-version">v{{ version }}</span>
        </div>
        <ul class="gpu-list">
          <li v-for="(gpu, i) in gpus" :key="i">{{ gpu }}</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gpu-cell {
  position: relative;
}

.gpu-preview {
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

.gpu-preview:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: 2px;
  border-radius: 4px;
}

.gpu-count {
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

.gpu-label {
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

.gpu-panel {
  margin-top: 8px;
  min-width: 0;
  background: var(--tooltip-bg);
  border: 1px solid var(--border-hover);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 20px;
}

.gpu-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.gpu-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.gpu-panel-version {
  font-size: 12px;
  color: var(--nv-green);
  font-weight: 500;
}

.gpu-list {
  list-style: none;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.gpu-list::-webkit-scrollbar {
  width: 6px;
}

.gpu-list::-webkit-scrollbar-track {
  background: var(--tooltip-bg);
  border-radius: 3px;
}

.gpu-list::-webkit-scrollbar-thumb {
  background: var(--border-hover);
  border-radius: 3px;
}

.gpu-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.gpu-list li {
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.gpu-list li:last-child {
  border-bottom: none;
}

.gpu-list li::before {
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
  .gpu-panel {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 100;
    min-width: 400px;
    max-width: 500px;
  }
}

@media (max-width: 900px) {
  .gpu-panel {
    max-width: 90vw;
  }
}
</style>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  version: { type: String, required: true },
})

const copied = ref(false)

function getDownloadUrl(version) {
  return `https://us.download.nvidia.com/tesla/${version}/NVIDIA-Linux-x86_64-${version}.run`
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(getDownloadUrl(props.version))
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard not available */ }
}
</script>

<template>
  <div class="version-cell">
    <a
      class="version-link"
      :href="getDownloadUrl(version)"
      :title="`Download NVIDIA-Linux-x86_64-${version}.run`"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      {{ version }}
    </a>
    <div class="version-meta">
      <span class="version-badge">.run</span>
      <button
        class="copy-btn"
        :class="{ copied }"
        :title="copied ? 'Copied!' : 'Copy download link'"
        @click.prevent.stop="copyLink"
        :aria-label="copied ? 'Link copied' : 'Copy download link'"
      >
        <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.version-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.version-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--nv-green);
  text-decoration: none;
  transition: color 0.2s;
}

.version-link:hover {
  color: #8ed600;
}

.version-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.version-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(118, 185, 0, 0.1);
  border: 1px solid rgba(118, 185, 0, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: var(--nv-green);
  font-weight: 500;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.copy-btn:hover {
  border-color: var(--nv-green);
  color: var(--nv-green);
}

.copy-btn:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: 2px;
}

.copy-btn.copied {
  border-color: var(--nv-green);
  color: var(--nv-green);
}
</style>
<script setup>
defineProps({
  families: { type: Array, required: true },
  modelValue: { type: [String, Number], default: 'all' },
  prefix: { type: String, default: 'R' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="filter-chips" role="tablist" aria-label="Filter by branch">
    <button
      class="chip"
      :class="{ active: modelValue === 'all' }"
      role="tab"
      :aria-selected="modelValue === 'all'"
      tabindex="0"
      @click="$emit('update:modelValue', 'all')"
      @keydown.enter="$emit('update:modelValue', 'all')"
      @keydown.space.prevent="$emit('update:modelValue', 'all')"
    >All</button>
    <button
      v-for="f in families"
      :key="f"
      class="chip"
      :class="{ active: String(modelValue) === String(f) }"
      role="tab"
      :aria-selected="String(modelValue) === String(f)"
      tabindex="0"
      @click="$emit('update:modelValue', f)"
      @keydown.enter="$emit('update:modelValue', f)"
      @keydown.space.prevent="$emit('update:modelValue', f)"
    >{{ prefix }}{{ f }}</button>
  </div>
</template>

<style scoped>
.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  font-family: inherit;
}

.chip:hover {
  border-color: var(--nv-green);
  color: var(--nv-green);
}

.chip:focus-visible {
  outline: 2px solid var(--nv-green);
  outline-offset: 2px;
}

.chip.active {
  background: var(--nv-green);
  border-color: var(--nv-green);
  color: #000;
  font-weight: 600;
}
</style>
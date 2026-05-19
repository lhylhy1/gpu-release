<script setup>
defineProps({
  modelValue: String,
  placeholder: { type: String, default: 'Search driver version, CUDA version, date, or issues...' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="search-box">
    <span class="search-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </span>
    <input
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      aria-label="Search"
    />
  </div>
</template>

<style scoped>
.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-box input:focus {
  border-color: var(--nv-green);
  box-shadow: 0 0 0 3px rgba(118, 185, 0, 0.1);
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.search-box .search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
</style>
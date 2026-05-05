<template>
  <select class="format-select" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option disabled value="">选择格式</option>
    <option v-for="f in formats" :key="f.formatId" :value="f.formatId">
      {{ f.resolution }} · {{ f.ext.toUpperCase() }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  formats: { type: Array, required: true },
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.format-select {
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.format-select:focus {
  border-color: var(--accent);
}
</style>

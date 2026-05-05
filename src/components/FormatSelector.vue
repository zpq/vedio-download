<template>
  <select class="format-select" @change="handleChange">
    <option disabled value="">选择格式</option>
    <option v-for="f in formats" :key="f.formatId" :value="f.formatId" :selected="selected?.formatId === f.formatId">
      {{ f.resolution }} · {{ f.ext.toUpperCase() }}
    </option>
  </select>
</template>

<script setup>
const props = defineProps({
  formats: { type: Array, required: true },
  selected: { type: Object, default: null },
})
const emit = defineEmits(['update:selected'])

function handleChange(e) {
  const formatId = e.target.value
  const format = props.formats.find(f => f.formatId === formatId)
  emit('update:selected', format)
}
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
  min-width: 180px;
}
.format-select:focus {
  border-color: var(--accent);
}
</style>

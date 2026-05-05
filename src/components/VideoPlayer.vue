<template>
  <div class="video-player" v-if="src">
    <video controls :src="src" preload="metadata" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { previewUrl } from '../services/api'

const props = defineProps({
  recordId: { type: String, required: true },
})

const src = computed(() => previewUrl(props.recordId))
</script>

<style scoped>
.video-player {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  width: 100%;
}
.video-player video {
  width: 100%;
  display: block;
  max-height: 360px;
}
</style>

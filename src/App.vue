<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">Video Downloader</h1>
      <ThemeToggle />
    </header>
    <TabBar v-model="activeTab" />
    <main class="app-main">
      <DownloadTab v-if="activeTab === 'download'" />
      <HistoryTab v-if="activeTab === 'history'" />
      <SettingsTab v-if="activeTab === 'settings'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DownloadTab from './components/DownloadTab.vue'
import HistoryTab from './components/HistoryTab.vue'
import SettingsTab from './components/SettingsTab.vue'

const activeTab = ref('download')
</script>

<style scoped>
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.app-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.app-main {
  margin-top: 20px;
}
</style>

import { ref } from 'vue'
import { fetchSettings, updateSettings } from '../services/api'

export function useSettings() {
  const settings = ref({ downloadDir: '', proxy: '' })
  const saving = ref(false)
  const message = ref('')

  async function load() {
    const res = await fetchSettings()
    if (res.success) settings.value = res.data
  }

  async function save() {
    saving.value = true
    message.value = ''
    const res = await updateSettings(settings.value)
    saving.value = false
    if (res.success) {
      settings.value = res.data
      message.value = '设置已保存'
      setTimeout(() => message.value = '', 3000)
    } else {
      message.value = res.error || '保存失败'
    }
  }

  return { settings, saving, message, load, save }
}

import { ref, computed, onMounted } from 'vue'

export function useDrivers() {
  const drivers = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function fetchDrivers() {
    try {
      loading.value = true
      const res = await fetch(import.meta.env.BASE_URL + 'drivers.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      drivers.value = await res.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchDrivers)

  const families = computed(() =>
    [...new Set(drivers.value.map(d => d.releaseFamily))].sort((a, b) => b - a)
  )

  return { drivers, families, loading, error }
}
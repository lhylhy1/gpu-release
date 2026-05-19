import { ref, computed, onMounted } from 'vue'

export function useCuda() {
  const cuda = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function fetchCuda() {
    try {
      loading.value = true
      const res = await fetch(import.meta.env.BASE_URL + 'cuda.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      cuda.value = await res.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchCuda)

  const majorVersions = computed(() => {
    const set = new Set(cuda.value.map(c => c.version.split('.').slice(0, 2).join('.')))
    return [...set].sort((a, b) => {
      const pa = a.split('.').map(Number)
      const pb = b.split('.').map(Number)
      return pb[0] - pa[0] || pb[1] - pa[1]
    })
  })

  return { cuda, majorVersions, loading, error }
}
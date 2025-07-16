export const useProfile = () => {
  const profileData = ref<any>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchProfile = async () => {
    try {
      loading.value = true
      error.value = null
      const { data } = await $fetch('/api/profile')
      profileData.value = data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch profile'
      console.error('Profile fetch error:', err)
      
      // Set default values to prevent UI errors
      profileData.value = {
        user: {
          name: 'Guest User',
          email: 'user@example.com',
          avatarUrl: '/images/profile/user6.jpg',
          role: 'User'
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          testsCompleted: 0,
          totalTests: 0
        },
        social: {
          facebook: null,
          twitter: null,
          dribbble: null,
          youtube: null
        }
      }
    } finally {
      loading.value = false
    }
  }

  // Fetch profile on composable initialization
  onMounted(() => {
    fetchProfile()
  })

  return {
    profileData: readonly(profileData),
    loading: readonly(loading),
    error: readonly(error),
    fetchProfile
  }
}
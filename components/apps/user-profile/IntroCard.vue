<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { BriefcaseIcon, MailIcon, DeviceDesktopIcon, MapPinIcon, BadgesIcon, BookIcon } from 'vue-tabler-icons';

// Use the profile composable
const { profile, loading, fetchProfile } = useProfile();

// Fetch profile data on mount
onMounted(async () => {
  await fetchProfile();
});

// Computed values with fallbacks
const userName = computed(() => profile.value?.user?.name || 'Loading...');
const userEmail = computed(() => profile.value?.user?.email || 'Loading...');
const userRole = computed(() => profile.value?.user?.role || 'User');
const questionsAnswered = computed(() => profile.value?.stats?.questionsAnswered || 0);
const testsCompleted = computed(() => profile.value?.stats?.testsCompleted || 0);
const accuracy = computed(() => {
  const correct = profile.value?.stats?.correctAnswers || 0;
  const total = profile.value?.stats?.questionsAnswered || 0;
  return total > 0 ? Math.round((correct / total) * 100) : 0;
});
</script>
<template>
    <v-row>
        <v-col cols="12">
            <v-card elevation="10" class="bg-surface">
                <v-card-item>
                    <h4 class="text-h4">About Me</h4>
                    <p class="my-5 text-subtitle-1 lh-md">
                        Hello, I am {{ userName }}. I'm here to master IT certifications and advance my career in technology.
                    </p>
                    <div class="d-flex gap-3 mb-5">
                        <BadgesIcon size="21" />
                        <span class="text-h6">{{ userRole }}</span>
                    </div>
                    <div class="d-flex gap-3 mb-5">
                        <MailIcon size="21" />
                        <span class="text-h6">{{ userEmail }}</span>
                    </div>
                    <div class="d-flex gap-3 mb-5">
                        <BookIcon size="21" />
                        <span class="text-h6">{{ questionsAnswered }} questions answered ({{ accuracy }}% accuracy)</span>
                    </div>
                    <div class="d-flex gap-3 mb-5">
                        <DeviceDesktopIcon size="21" />
                        <span class="text-h6">{{ testsCompleted }} practice tests completed</span>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>

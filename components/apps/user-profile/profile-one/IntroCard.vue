<script setup lang="ts">
import { BrandSkypeIcon, LanguageIcon, MailIcon, MapPinIcon, PhoneIcon, SchoolIcon, PercentageIcon, FileDescriptionIcon } from 'vue-tabler-icons';

const { profileData } = useProfile();

// Calculate accuracy percentage
const accuracyPercentage = computed(() => {
    const questions = profileData.value?.stats?.questionsAnswered || 0;
    const correct = profileData.value?.stats?.correctAnswers || 0;
    if (questions === 0) return 0;
    return Math.round((correct / questions) * 100);
});
</script>
<template>
    <v-row>
        <v-col cols="12">
            <v-card elevation="10" class="bg-surface">
                <v-card-item>
                    <h4 class="text-h5">About me</h4>
                    <p class="my-5 text-subtitle-1 lh-md font-weight-medium">
                        Hello, I'm {{ profileData?.user?.name || 'User' }}. I'm working towards my IT certifications using PingToPass.
                    </p>
                    <v-divider class="mb-4"></v-divider>
                    <h4 class="text-h5 mb-4">Profile Info</h4>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightsuccess">
                            <MailIcon size="20" stroke-width="1.5" class="text-success"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Email</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ profileData?.user?.email || 'Not provided' }}</p>
                        </div> 
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightprimary">
                            <SchoolIcon size="20" stroke-width="1.5" class="text-primary"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Role</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ profileData?.user?.role || 'User' }}</p>
                        </div> 
                    </div>
                    <v-divider class="mb-4"></v-divider>
                    <h4 class="text-h5 mb-4">Study Statistics</h4>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightwarning">
                            <FileDescriptionIcon size="20" stroke-width="1.5" class="text-warning"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Questions Answered</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                {{ profileData?.stats?.questionsAnswered || 0 }} questions
                                <span v-if="profileData?.stats?.questionsAnswered > 0" class="text-success">
                                    ({{ accuracyPercentage }}% accuracy)
                                </span>
                            </p>
                        </div> 
                    </div>
                    <div class="d-flex align-center">
                        <v-avatar size="40" class="bg-lightindigo">
                            <PercentageIcon size="20" stroke-width="1.5" class="text-indigo"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Tests Completed</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                {{ profileData?.stats?.testsCompleted || 0 }} of {{ profileData?.stats?.totalTests || 0 }} practice tests
                            </p>
                        </div> 
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>

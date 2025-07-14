<script setup lang="ts">
import { ref } from 'vue';

/*Social icons*/
import google from '/images/svgs/google-icon.svg';

const isLoading = ref(false);
const error = ref('');

// Removed auth check to prevent redirect loops

async function signInWithGoogle() {
  isLoading.value = true;
  error.value = '';
  
  try {
    // Redirect to Google OAuth
    await navigateTo('/auth/oauth/google', { external: true });
  } catch (err) {
    error.value = 'Failed to initiate Google sign-in. Please try again.';
    isLoading.value = false;
  }
}
</script>

<template>
    <div class="text-center">
        <!-- Welcome message -->
        <p class="text-body-1 text-grey-darken-1 mb-6">
            Sign in to access your study materials and track your certification progress
        </p>

        <!-- Google Sign In Button -->
        <v-btn
            size="x-large"
            color="white"
            variant="outlined"
            block
            @click="signInWithGoogle"
            :loading="isLoading"
            class="mb-4"
        >
            <img :src="google" height="20" class="mr-3" alt="Google" />
            Continue with Google
        </v-btn>

        <!-- Error Alert -->
        <v-alert
            v-if="error"
            type="error"
            density="compact"
            class="mt-4"
            closable
            @click:close="error = ''"
        >
            {{ error }}
        </v-alert>

        <!-- Privacy Notice -->
        <p class="text-caption text-grey-darken-1 mt-6">
            By signing in, you agree to our 
            <a href="/terms" class="text-primary text-decoration-none">Terms of Service</a>
            and 
            <a href="/privacy" class="text-primary text-decoration-none">Privacy Policy</a>
        </p>
    </div>
</template>

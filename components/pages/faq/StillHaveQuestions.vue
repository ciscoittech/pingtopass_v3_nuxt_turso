<script setup lang="ts">
/* user icon */
import img1 from '/images/profile/user1.jpg';
import img2 from '/images/profile/user2.jpg';
import img3 from '/images/profile/user3.jpg';
</script>
<template>
    <v-card elevation="10" class="bg-lightinfo mt-sm-13 mt-8">
        <v-card-item class="pa-sm-10 pa-6">
            <div class="text-center">
                <div class="ml-2 d-flex justify-center flex-row-reverse mb-5">
                    <v-avatar size="44" class="ml-n2 avtar-border">
                        <img :src="img1" alt="avatar" height="44" />
                    </v-avatar>
                    <v-avatar size="44" class="ml-n2 avtar-border">
                        <img :src="img2" alt="avatar" height="44" />
                    </v-avatar>
                    <v-avatar size="44" class="ml-n2 avtar-border">
                        <img :src="img3" alt="avatar" height="44" />
                    </v-avatar>
                </div>
                <h3 class="text-h3 font-weight-semibold">Still have questions</h3>
                <h6 class="text-h6 text-grey100 font-weight-medium mt-2">
                    Can't find the answer your're looking for ? Please chat to our friendly team.
                </h6>
                <v-btn color="primary" rounded="pill" size="large" class="mt-6 mb-3">Chat with us</v-btn>
            </div>
        </v-card-item>
    </v-card>
</template>

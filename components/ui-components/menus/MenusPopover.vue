<script setup lang="ts">
import { ref } from "vue";
const fav = ref(true);
const menu = ref(false);
const message = ref(false);
const hints = ref(true);
</script>

<template>
  <div class="text-center mt-4">
    <v-menu v-model="menu" :close-on-content-click="false" anchor="top">
      <template v-slot:activator="{ props }">
        <v-btn color="secondary" v-bind="props" class="px-4 rounded-pill"> Menu as Popover </v-btn>
      </template>

      <v-card min-width="300">
        <v-list>
          <v-list-item
            prepend-avatar="https://cdn.vuetifyjs.com/images/john.jpg"
            title="John Leider"
            subtitle="Founder of Vuetify"
          >
            <template v-slot:append>
              <v-btn
                variant="text"
                :class="fav ? 'text-primary' : ''"
                icon="mdi-heart"
                @click="fav = !fav"
              flat></v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-list-item >
            <v-switch
              v-model="message"
              color="primary"
              label="Enable messages"
              hide-details
              class="pl-2"
            ></v-switch>
          </v-list-item>

          <v-list-item>
            <v-switch
              v-model="hints"
              color="primary"
              label="Enable hints"
              hide-details
              class="pl-2"
            ></v-switch>
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="menu = false" flat> Cancel </v-btn>
          <v-btn color="primary" text @click="menu = false" flat> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>


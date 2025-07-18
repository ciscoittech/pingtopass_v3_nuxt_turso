import { createVuetify } from "vuetify";
import "@mdi/font/css/materialdesignicons.css";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { BLUE_THEME } from "@/theme/LightTheme";
import { DARK_BLUE_THEME } from "@/theme/DarkTheme";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "BLUE_THEME",
      themes: {
        BLUE_THEME,
        DARK_BLUE_THEME,
      },
    },
    defaults: {
      VCard: {
        rounded: "xl",
        elevation: 10,
      },
      VTextField: {
        variant: "outlined",
        density: "comfortable",
        color: "primary",
      },
      VTextarea: {
        variant: "outlined",
        density: "comfortable",
        color: "primary",
      },
      VSelect: {
        variant: "outlined",
        density: "comfortable",
        color: "primary",
      },
      VListItem: {
        minHeight: "45px",
      },
      VTooltip: {
        location: "top",
      },
      VBtn: {
        style: "text-transform: capitalize; letter-spacing:0",
        rounded: "md",
      },
      VSkeletonLoader: {
        type: "text",
        boilerplate: false,
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
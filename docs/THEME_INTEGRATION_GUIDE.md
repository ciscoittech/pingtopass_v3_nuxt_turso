# 🎨 Spike Theme Integration Guide

**Created:** 2025-01-14  
**Purpose:** Technical requirements and guidelines for Spike theme integration  
**Reference:** https://spike-nuxtjs-pro-dark.netlify.app/

## 📋 Integration Requirements

### 1. Theme Structure Preservation

The Spike theme has a specific structure that must be maintained:

```
components/
├── lc/                    # Layout Components
│   ├── Full/             # Full layout components
│   │   ├── vertical-sidebar/
│   │   ├── vertical-header/
│   │   └── horizontal-sidebar/
│   └── customizer/       # Theme customizer
├── dashboards/           # Dashboard-specific components
├── forms/                # Form components
├── ui-components/        # UI elements
└── widgets/              # Widget components
```

### 2. Component Usage Patterns

#### Layout Components
```vue
<!-- Default Layout -->
<template>
  <v-app>
    <LcFullVerticalSidebar v-if="customizer.sidebar" />
    <LcFullVerticalHeader />
    <v-main>
      <v-container fluid class="page-wrapper">
        <NuxtPage />
      </v-container>
    </v-main>
    <LcCustomizer />
  </v-app>
</template>
```

#### Card Components
```vue
<!-- Always use UiParentCard for consistent styling -->
<UiParentCard title="Section Title">
  <!-- Content goes here -->
</UiParentCard>
```

#### Form Components
```vue
<!-- Use theme's form layout patterns -->
<v-form>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="formData.field"
        label="Field Label"
        variant="outlined"
        color="primary"
      />
    </v-col>
  </v-row>
</v-form>
```

### 3. Styling Guidelines

#### Color System
- **Primary**: Use theme's primary color (customizable)
- **Secondary**: Use for less prominent elements
- **Success/Error/Warning/Info**: Use semantic colors consistently
- **Surface colors**: Use for backgrounds and cards

#### Typography
- Use theme's typography scale
- Maintain consistent heading hierarchy
- Apply proper text colors for contrast

#### Spacing
- Use Vuetify's spacing utilities (pa-*, ma-*)
- Follow theme's spacing patterns
- Maintain consistent gaps between elements

### 4. Icon Integration

The theme uses multiple icon libraries:
- **Solar Icons**: Primary icon set
- **Tabler Icons**: Secondary icon set
- **Iconify**: For additional icons

```vue
<!-- Solar Icon usage -->
<Icon icon="solar:user-bold" class="text-primary" />

<!-- Tabler Icon usage -->
<TablerIcon name="home" />
```

### 5. Component Customization

#### Extending Theme Components
```vue
<!-- Extend theme component while preserving functionality -->
<script setup>
import BaseComponent from '@/components/theme/BaseComponent.vue'

// Add custom logic here
</script>

<template>
  <BaseComponent v-bind="$attrs">
    <!-- Custom content -->
  </BaseComponent>
</template>
```

#### Theme Store Integration
```javascript
// Use theme customizer store
import { useCustomizerStore } from '@/stores/customizer'

const customizer = useCustomizerStore()

// Access theme settings
customizer.darkMode
customizer.primaryColor
customizer.sidebar
```

### 6. Migration Best Practices

#### DO:
- ✅ Use existing theme components whenever possible
- ✅ Follow theme's naming conventions
- ✅ Maintain consistent styling patterns
- ✅ Test in both light and dark modes
- ✅ Preserve all existing functionality
- ✅ Use theme's responsive breakpoints

#### DON'T:
- ❌ Create custom components that duplicate theme functionality
- ❌ Override theme styles with !important
- ❌ Mix different UI frameworks
- ❌ Ignore theme's accessibility features
- ❌ Hard-code colors instead of using theme variables

### 7. File Organization

```
pages/
├── dashboard.vue         # Use dashboard components
├── admin/               # Admin pages with consistent layout
│   ├── vendors.vue
│   ├── exams.vue
│   └── questions.vue
├── study/               # Study pages with theme styling
└── test/                # Test pages with theme styling

components/
├── dashboards/
│   └── pingtopass/      # Custom dashboard components
├── study/               # Study-specific components
└── test/                # Test-specific components
```

### 8. Data Table Integration

```vue
<!-- Use theme's table patterns -->
<v-data-table
  :headers="headers"
  :items="items"
  class="rounded-md"
  color="primary"
  :sort-by="[{ key: 'name', order: 'asc' }]"
>
  <template v-slot:top>
    <!-- Table toolbar -->
  </template>
  
  <template v-slot:item.actions="{ item }">
    <!-- Action buttons -->
  </template>
</v-data-table>
```

### 9. Form Validation

```vue
<!-- Use theme's validation patterns -->
<v-text-field
  v-model="email"
  :rules="[rules.required, rules.email]"
  label="Email"
  variant="outlined"
/>

<script setup>
const rules = {
  required: value => !!value || 'Required.',
  email: value => /.+@.+\..+/.test(value) || 'Email must be valid.',
}
</script>
```

### 10. Performance Considerations

- **Lazy Loading**: Use for heavy components
- **Code Splitting**: Leverage Nuxt's automatic code splitting
- **Image Optimization**: Use Nuxt Image for theme assets
- **CSS Purging**: Remove unused theme styles

### 11. Testing Requirements

#### Component Testing
- Test all interactive elements
- Verify theme switching works
- Check responsive behavior
- Validate form submissions

#### Visual Testing
- Screenshot comparison with theme demo
- Cross-browser visual consistency
- Dark/light mode appearance
- Mobile layout verification

### 12. Documentation Updates

After migration, update:
- Component usage examples
- Theme customization guide
- Developer onboarding docs
- Deployment considerations

## 🔗 Resources

- **Theme Demo**: https://spike-nuxtjs-pro-dark.netlify.app/
- **Vuetify 3 Docs**: https://vuetifyjs.com/
- **Nuxt 3 Docs**: https://nuxt.com/
- **Icon References**: 
  - Solar: https://icon-sets.iconify.design/solar/
  - Tabler: https://tabler-icons.io/

## 📝 Migration Workflow

1. **Analyze**: Review current component usage
2. **Map**: Identify theme component equivalents
3. **Replace**: Swap custom components with theme ones
4. **Style**: Apply theme styling patterns
5. **Test**: Verify functionality and appearance
6. **Document**: Update component documentation

---

**Goal**: Achieve professional UI consistency matching the Spike theme demo while maintaining all PingToPass functionality.
# Vendor Icons Documentation

## Overview

The PingToPass platform includes a comprehensive vendor icon system that provides professional branding for IT certification vendors. This system includes icons for 30+ major vendors and an elegant fallback system for unknown vendors.

## Components

### VendorIcon Component

The main component for displaying vendor icons is `VendorIcon.vue` located at `/components/shared/VendorIcon.vue`.

#### Usage

```vue
<VendorIcon 
  :vendor="vendorName"
  :size="64"
  :icon-size="40"
  elevation
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vendor` | String | Required | The vendor name (e.g., "Microsoft", "AWS") |
| `size` | Number/String | 48 | Size of the avatar container in pixels |
| `iconSize` | Number/String | 28 | Size of the icon inside the avatar |
| `elevation` | Boolean | false | Whether to show elevation shadow |
| `customColor` | String | null | Override the default background color |

### Vendor Icon Mapping

The vendor icon mapping is defined in `/utils/vendorIcons.ts`. This file contains:

1. **Icon configurations** for each vendor including:
   - Icon name (from Iconify)
   - Background color
   - Text color
   - Fallback initials

2. **Helper functions**:
   - `getVendorIcon(vendorName)` - Returns icon configuration for a vendor
   - `generateVendorColor(vendorName)` - Generates consistent colors for unknown vendors

## Supported Vendors

The system currently supports icons for the following vendors:

### Cloud Providers
- Microsoft / Microsoft Corporation
- Amazon Web Services / AWS
- Google Cloud / Google / GCP
- Oracle / Oracle Corporation
- IBM
- Salesforce
- ServiceNow
- Databricks
- Snowflake

### Networking & Security
- Cisco / Cisco Systems
- Juniper / Juniper Networks
- F5 / F5 Networks
- Palo Alto / Palo Alto Networks
- Fortinet
- Splunk

### Infrastructure & DevOps
- VMware
- Red Hat / RedHat
- Docker
- Kubernetes / K8s
- HashiCorp
- Terraform
- Ansible
- Jenkins
- GitLab
- GitHub
- Atlassian

### Certification Bodies
- CompTIA
- Linux / Linux Foundation

### Data & Analytics
- MongoDB
- Elastic / Elasticsearch
- Confluent
- Tableau

### Other
- Adobe

## Fallback System

For vendors not in the predefined list, the system:

1. Generates initials from the vendor name (first 2 letters)
2. Assigns a consistent color based on the vendor name hash
3. Displays the initials in a colored avatar

## Examples

### Basic Usage

```vue
<!-- Known vendor -->
<VendorIcon vendor="Microsoft" />

<!-- Unknown vendor with fallback -->
<VendorIcon vendor="Acme Corp" />

<!-- Large icon with elevation -->
<VendorIcon 
  vendor="AWS" 
  :size="100" 
  :icon-size="60"
  elevation
/>
```

### In Exam Cards

```vue
<v-card>
  <div class="exam-header">
    <VendorIcon 
      :vendor="exam.vendorName"
      :size="80"
      :icon-size="48"
      elevation
    />
  </div>
  <!-- Rest of card content -->
</v-card>
```

## Adding New Vendors

To add a new vendor icon:

1. Find the appropriate icon on [Iconify](https://iconify.design/)
2. Add the configuration to `vendorIconMap` in `/utils/vendorIcons.ts`:

```typescript
'new vendor': {
  icon: 'simple-icons:vendorname',  // or 'logos:vendorname'
  backgroundColor: '#HEX_COLOR',
  color: '#FFFFFF'  // or '#000000' for light backgrounds
}
```

3. Test the icon using the demo page at `/vendor-icons-demo`

## Icon Sources

The system uses icons from these Iconify collections:

- **logos:** - Full-color brand logos
- **simple-icons:** - Monochrome brand icons
- **mdi:** - Material Design Icons (for generic icons)

## Demo Page

Visit `/vendor-icons-demo` to see:
- Common vendor icons
- Different size variations
- Unknown vendor fallbacks
- All available vendor icons

## Best Practices

1. **Use consistent sizes** across similar contexts:
   - Card headers: 80-100px
   - List items: 48-64px
   - Inline references: 24-32px

2. **Enable elevation** for card displays to add depth

3. **Let the system handle colors** - avoid using `customColor` unless necessary

4. **Use exact vendor names** when possible for better matching

## Performance

- Icons are loaded on-demand via Iconify
- Vendor configurations are cached after first lookup
- Fallback colors are deterministic (same vendor always gets same color)
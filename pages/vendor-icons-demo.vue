<template>
  <v-container>
    <h1 class="text-h4 mb-6">Vendor Icons Demo</h1>
    
    <!-- Common Vendors -->
    <v-card class="mb-6">
      <v-card-title>Common Vendors</v-card-title>
      <v-card-text>
        <v-row>
          <v-col 
            v-for="vendor in commonVendors" 
            :key="vendor"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="text-center"
          >
            <VendorIcon 
              :vendor="vendor"
              :size="64"
              :icon-size="40"
              elevation
              class="mb-2"
            />
            <p class="text-caption">{{ vendor }}</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Different Sizes -->
    <v-card class="mb-6">
      <v-card-title>Different Sizes</v-card-title>
      <v-card-text>
        <v-row align="center">
          <v-col 
            v-for="size in sizes" 
            :key="size"
            cols="auto"
            class="text-center"
          >
            <VendorIcon 
              vendor="Microsoft"
              :size="size"
              :icon-size="size * 0.6"
              elevation
              class="mb-2"
            />
            <p class="text-caption">{{ size }}px</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Unknown Vendors (Fallback) -->
    <v-card class="mb-6">
      <v-card-title>Unknown Vendors (Fallback)</v-card-title>
      <v-card-text>
        <v-row>
          <v-col 
            v-for="vendor in unknownVendors" 
            :key="vendor"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="text-center"
          >
            <VendorIcon 
              :vendor="vendor"
              :size="64"
              :icon-size="40"
              elevation
              class="mb-2"
            />
            <p class="text-caption">{{ vendor }}</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- All Available Vendors -->
    <v-card>
      <v-card-title>All Available Vendor Icons</v-card-title>
      <v-card-text>
        <v-row>
          <v-col 
            v-for="vendor in allVendors" 
            :key="vendor"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            class="text-center"
          >
            <VendorIcon 
              :vendor="vendor"
              :size="48"
              :icon-size="28"
              elevation
              class="mb-2"
            />
            <p class="text-caption text-truncate">{{ vendor }}</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const commonVendors = [
  'Microsoft',
  'Amazon Web Services',
  'Google Cloud',
  'Cisco',
  'CompTIA',
  'VMware',
  'Oracle',
  'Red Hat'
]

const sizes = [32, 48, 64, 80, 100, 128]

const unknownVendors = [
  'Acme Corp',
  'Tech Solutions',
  'Future Systems',
  'Quantum Computing',
  'AI Dynamics',
  'Cyber Defense'
]

const allVendors = [
  'Microsoft',
  'Amazon Web Services',
  'AWS',
  'Google Cloud',
  'Google',
  'Cisco',
  'CompTIA',
  'VMware',
  'Oracle',
  'Red Hat',
  'IBM',
  'Linux',
  'Docker',
  'Kubernetes',
  'HashiCorp',
  'Salesforce',
  'ServiceNow',
  'Juniper Networks',
  'F5 Networks',
  'Palo Alto Networks',
  'Fortinet',
  'Splunk',
  'Tableau',
  'Adobe',
  'Databricks',
  'Snowflake',
  'MongoDB',
  'Elastic',
  'Terraform',
  'Ansible',
  'Jenkins',
  'GitLab',
  'GitHub',
  'Atlassian'
]
</script>
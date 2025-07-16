import type { Component } from 'vue'

export interface VendorIconConfig {
  icon?: string // Iconify icon name
  customIcon?: Component // Custom Vue component
  backgroundColor?: string
  color?: string
  fallbackInitials?: string
}

// Map of vendor names to their icon configurations
export const vendorIconMap: Record<string, VendorIconConfig> = {
  // Microsoft
  'microsoft': {
    icon: 'logos:microsoft-icon',
    backgroundColor: '#0078D4',
    color: '#FFFFFF'
  },
  'microsoft corporation': {
    icon: 'logos:microsoft-icon',
    backgroundColor: '#0078D4',
    color: '#FFFFFF'
  },
  
  // Amazon Web Services
  'amazon web services': {
    icon: 'logos:aws',
    backgroundColor: '#FF9900',
    color: '#232F3E'
  },
  'aws': {
    icon: 'logos:aws',
    backgroundColor: '#FF9900',
    color: '#232F3E'
  },
  
  // Google Cloud
  'google cloud': {
    icon: 'logos:google-cloud',
    backgroundColor: '#4285F4',
    color: '#FFFFFF'
  },
  'google': {
    icon: 'logos:google-icon',
    backgroundColor: '#4285F4',
    color: '#FFFFFF'
  },
  'gcp': {
    icon: 'logos:google-cloud',
    backgroundColor: '#4285F4',
    color: '#FFFFFF'
  },
  
  // Cisco
  'cisco': {
    icon: 'simple-icons:cisco',
    backgroundColor: '#1BA0D7',
    color: '#FFFFFF'
  },
  'cisco systems': {
    icon: 'simple-icons:cisco',
    backgroundColor: '#1BA0D7',
    color: '#FFFFFF'
  },
  
  // CompTIA
  'comptia': {
    icon: 'simple-icons:comptia',
    backgroundColor: '#C8202F',
    color: '#FFFFFF'
  },
  'computing technology industry association': {
    icon: 'simple-icons:comptia',
    backgroundColor: '#C8202F',
    color: '#FFFFFF'
  },
  
  // VMware
  'vmware': {
    icon: 'simple-icons:vmware',
    backgroundColor: '#607078',
    color: '#FFFFFF'
  },
  
  // Oracle
  'oracle': {
    icon: 'simple-icons:oracle',
    backgroundColor: '#F80000',
    color: '#FFFFFF'
  },
  'oracle corporation': {
    icon: 'simple-icons:oracle',
    backgroundColor: '#F80000',
    color: '#FFFFFF'
  },
  
  // Red Hat
  'red hat': {
    icon: 'simple-icons:redhat',
    backgroundColor: '#EE0000',
    color: '#FFFFFF'
  },
  'redhat': {
    icon: 'simple-icons:redhat',
    backgroundColor: '#EE0000',
    color: '#FFFFFF'
  },
  
  // IBM
  'ibm': {
    icon: 'simple-icons:ibm',
    backgroundColor: '#054ADA',
    color: '#FFFFFF'
  },
  
  // Linux
  'linux': {
    icon: 'logos:linux-tux',
    backgroundColor: '#FCC624',
    color: '#000000'
  },
  'linux foundation': {
    icon: 'logos:linux-tux',
    backgroundColor: '#FCC624',
    color: '#000000'
  },
  
  // Docker
  'docker': {
    icon: 'logos:docker-icon',
    backgroundColor: '#2496ED',
    color: '#FFFFFF'
  },
  
  // Kubernetes
  'kubernetes': {
    icon: 'logos:kubernetes',
    backgroundColor: '#326CE5',
    color: '#FFFFFF'
  },
  'k8s': {
    icon: 'logos:kubernetes',
    backgroundColor: '#326CE5',
    color: '#FFFFFF'
  },
  
  // HashiCorp
  'hashicorp': {
    icon: 'simple-icons:hashicorp',
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },
  
  // Salesforce
  'salesforce': {
    icon: 'logos:salesforce',
    backgroundColor: '#00A1E0',
    color: '#FFFFFF'
  },
  
  // ServiceNow
  'servicenow': {
    icon: 'simple-icons:servicenow',
    backgroundColor: '#62D84E',
    color: '#FFFFFF'
  },
  
  // Juniper
  'juniper': {
    icon: 'simple-icons:junipernetworks',
    backgroundColor: '#84C225',
    color: '#FFFFFF'
  },
  'juniper networks': {
    icon: 'simple-icons:junipernetworks',
    backgroundColor: '#84C225',
    color: '#FFFFFF'
  },
  
  // F5
  'f5': {
    icon: 'simple-icons:f5',
    backgroundColor: '#E4002B',
    color: '#FFFFFF'
  },
  'f5 networks': {
    icon: 'simple-icons:f5',
    backgroundColor: '#E4002B',
    color: '#FFFFFF'
  },
  
  // Palo Alto Networks
  'palo alto': {
    icon: 'simple-icons:paloaltosoftware',
    backgroundColor: '#83BEEC',
    color: '#0C1E3E'
  },
  'palo alto networks': {
    icon: 'simple-icons:paloaltosoftware',
    backgroundColor: '#83BEEC',
    color: '#0C1E3E'
  },
  
  // Fortinet
  'fortinet': {
    icon: 'simple-icons:fortinet',
    backgroundColor: '#EE3124',
    color: '#FFFFFF'
  },
  
  // Splunk
  'splunk': {
    icon: 'simple-icons:splunk',
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },
  
  // Tableau
  'tableau': {
    icon: 'simple-icons:tableau',
    backgroundColor: '#E97627',
    color: '#FFFFFF'
  },
  
  // Adobe
  'adobe': {
    icon: 'simple-icons:adobe',
    backgroundColor: '#FF0000',
    color: '#FFFFFF'
  },
  
  // Databricks
  'databricks': {
    icon: 'simple-icons:databricks',
    backgroundColor: '#FF3621',
    color: '#FFFFFF'
  },
  
  // Snowflake
  'snowflake': {
    icon: 'simple-icons:snowflake',
    backgroundColor: '#29B5E8',
    color: '#FFFFFF'
  },
  
  // MongoDB
  'mongodb': {
    icon: 'logos:mongodb-icon',
    backgroundColor: '#47A248',
    color: '#FFFFFF'
  },
  
  // Elastic
  'elastic': {
    icon: 'simple-icons:elastic',
    backgroundColor: '#005571',
    color: '#FFFFFF'
  },
  'elasticsearch': {
    icon: 'simple-icons:elasticsearch',
    backgroundColor: '#005571',
    color: '#FFFFFF'
  },
  
  // Confluent
  'confluent': {
    icon: 'simple-icons:apachekafka',
    backgroundColor: '#231F20',
    color: '#FFFFFF'
  },
  
  // Terraform
  'terraform': {
    icon: 'simple-icons:terraform',
    backgroundColor: '#7B42BC',
    color: '#FFFFFF'
  },
  
  // Ansible
  'ansible': {
    icon: 'simple-icons:ansible',
    backgroundColor: '#EE0000',
    color: '#FFFFFF'
  },
  
  // Jenkins
  'jenkins': {
    icon: 'simple-icons:jenkins',
    backgroundColor: '#D24939',
    color: '#FFFFFF'
  },
  
  // GitLab
  'gitlab': {
    icon: 'simple-icons:gitlab',
    backgroundColor: '#FCA121',
    color: '#FFFFFF'
  },
  
  // GitHub
  'github': {
    icon: 'simple-icons:github',
    backgroundColor: '#181717',
    color: '#FFFFFF'
  },
  
  // Atlassian
  'atlassian': {
    icon: 'simple-icons:atlassian',
    backgroundColor: '#0052CC',
    color: '#FFFFFF'
  },
  
  // Default fallback colors for unknown vendors
  'default': {
    backgroundColor: '#6366F1',
    color: '#FFFFFF'
  }
}

/**
 * Get vendor icon configuration
 * @param vendorName - The name of the vendor
 * @returns VendorIconConfig for the vendor
 */
export function getVendorIcon(vendorName: string): VendorIconConfig {
  if (!vendorName) {
    return vendorIconMap.default
  }
  
  // Normalize vendor name for lookup
  const normalizedName = vendorName.toLowerCase().trim()
  
  // Direct match
  if (vendorIconMap[normalizedName]) {
    return vendorIconMap[normalizedName]
  }
  
  // Partial match (e.g., "AWS" in "Amazon Web Services (AWS)")
  for (const [key, config] of Object.entries(vendorIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return config
    }
  }
  
  // Return default with generated initials
  const initials = vendorName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return {
    ...vendorIconMap.default,
    fallbackInitials: initials
  }
}

/**
 * Generate a consistent color for a vendor based on name
 * @param vendorName - The name of the vendor
 * @returns hex color string
 */
export function generateVendorColor(vendorName: string): string {
  const colors = [
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
    '#84CC16', // Lime
  ]
  
  // Generate a consistent index based on vendor name
  let hash = 0
  for (let i = 0; i < vendorName.length; i++) {
    hash = vendorName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
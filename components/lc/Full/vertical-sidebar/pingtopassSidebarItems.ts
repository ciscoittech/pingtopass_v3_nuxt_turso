export interface menu {
  header?: string;
  title?: string;
  icon?: any;
  to?: string;
  chip?: string;
  BgColor?: string;
  chipBgColor?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: "Main" },
  {
    title: "Dashboard",
    icon: "home-2-linear",
    BgColor: "primary",
    to: "/dashboard",
  },
  {
    title: "Exams",
    icon: "document-text-linear",
    BgColor: "success",
    to: "/exams",
  },
  {
    title: "Study Mode",
    icon: "book-linear",
    BgColor: "info",
    to: "/study",
  },
  {
    title: "Test Mode",
    icon: "timer-linear",
    BgColor: "warning",
    to: "/test",
  },
  {
    title: "Progress",
    icon: "chart-line-duotone",
    BgColor: "primary",
    to: "/progress",
  },
  {
    title: "Achievements",
    icon: "medal-star-linear",
    BgColor: "success",
    to: "/achievements",
  },
  {
    title: "Leaderboard",
    icon: "ranking-linear",
    BgColor: "warning",
    to: "/leaderboard",
  },
  { header: "Study Tools" },
  {
    title: "Study Tools",
    icon: "notebook-bookmark-linear",
    BgColor: "primary",
    to: "/study-tools",
  },
  {
    title: "Bookmarks",
    icon: "bookmark-linear",
    BgColor: "secondary",
    to: "/bookmarks",
  },
  {
    title: "Flagged Questions",
    icon: "flag-linear",
    BgColor: "error",
    to: "/flagged",
  },
  {
    title: "Study Plans",
    icon: "clipboard-text-linear",
    BgColor: "info",
    to: "/study-plans",
  },
  { header: "Twitter Intelligence" },
  {
    title: "Twitter Analytics",
    icon: "chart-square-linear",
    BgColor: "info",
    to: "/admin/twitter",
    children: [
      {
        title: "Dashboard",
        to: "/admin/twitter",
      },
      {
        title: "Competitor Analysis",
        to: "/admin/twitter/competitors",
      },
      {
        title: "Content Strategy",
        to: "/admin/twitter/content",
      },
      {
        title: "Monitoring & Alerts",
        to: "/admin/twitter/monitoring",
      },
    ],
  },
  { header: "Admin" },
  {
    title: "Admin Panel",
    icon: "settings-linear",
    BgColor: "secondary",
    to: "/admin",
    children: [
      {
        title: "Vendors",
        to: "/admin/vendors",
      },
      {
        title: "Exams",
        to: "/admin/exams",
      },
      {
        title: "Questions",
        to: "/admin/questions",
      },
      {
        title: "Objectives",
        to: "/admin/objectives",
      },
      {
        title: "Import Questions",
        to: "/admin/import",
      },
      {
        title: "Analytics",
        to: "/admin/analytics",
      },
      {
        title: "AI Chat (Advanced)",
        to: "/admin/chat",
      },
      {
        title: "AI Settings",
        to: "/admin/ai-settings",
      },
    ],
  },
  { header: "Account" },
  {
    title: "Profile",
    icon: "user-linear",
    BgColor: "primary",
    to: "/profile",
  },
  {
    title: "Settings",
    icon: "setting-2-linear",
    BgColor: "secondary",
    to: "/settings",
  },
  {
    title: "Help & Support",
    icon: "message-question-linear",
    BgColor: "info",
    to: "/help",
  },
];

export { sidebarItem };
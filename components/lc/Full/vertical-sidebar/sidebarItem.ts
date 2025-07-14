import { JumpRopeIcon } from "vue-tabler-icons";

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
  { header: "Home" },
  {
    title: "Dashboard",
    icon: "screencast-2-linear",
    BgColor: "primary",
    to: "/dashboard",
  },
  
  { header: "Certification" },
  {
    title: "Exam Catalog",
    icon: "book-2-line-duotone",
    BgColor: "success",
    to: "/exams",
  },
  {
    title: "My Progress",
    icon: "chart-line-duotone",
    BgColor: "info",
    to: "/progress",
  },
  {
    title: "Achievements",
    icon: "medal-star-circle-line-duotone",
    BgColor: "warning",
    to: "/achievements",
  },
  {
    title: "Leaderboard",
    icon: "cup-line-duotone",
    BgColor: "error",
    to: "/leaderboard",
  },

  { header: "Account" },
  {
    title: "Profile",
    icon: "user-rounded-line-duotone",
    BgColor: "secondary",
    to: "/profile",
  },
  {
    title: "Settings",
    icon: "settings-minimalistic-line-duotone",
    BgColor: "primary",
    to: "/settings",
  },

  { header: "Admin" },
  {
    title: "Admin Panel",
    icon: "shield-keyhole-minimalistic-line-duotone",
    BgColor: "error",
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
        title: "Users",
        to: "/admin/users",
      },
      {
        title: "Analytics",
        to: "/admin/analytics",
      },
    ],
  },
];

export default sidebarItem;

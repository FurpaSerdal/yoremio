import type { Metadata } from "next";

import { YoremioProfilePage } from "@/components/yoremio/profile-page";

export const metadata: Metadata = {
  title: "Profil",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileRoute() {
  return <YoremioProfilePage />;
}

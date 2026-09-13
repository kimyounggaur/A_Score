import type { Metadata } from "next";

import { LibraryView } from "@/components/account/library-view";

export const metadata: Metadata = {
  title: "보관함",
  description: "구매하고 받은 디지털 악보를 확인해요.",
};

export default function LibraryPage() {
  return <LibraryView />;
}

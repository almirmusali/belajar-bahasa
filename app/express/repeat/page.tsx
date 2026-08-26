import { SiteHeader } from "@/components/site-header";
import { RepeatView } from "@/components/express/repeat-view";
import { getAllDrills } from "@/lib/express";

export const metadata = { title: "Экспресс — работа над ошибками" };

export default function RepeatPage() {
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <RepeatView drills={getAllDrills()} />
      </main>
    </>
  );
}

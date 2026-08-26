import { SiteHeader } from "@/components/site-header";
import { ExpressOverview, type UnitCard } from "@/components/express/express-overview";
import { getUnits } from "@/lib/express";

export const metadata = {
  title: "Экспресс — частицы и аффиксы",
};

export default function ExpressPage() {
  const units: UnitCard[] = getUnits().map((u) => ({
    id: u.id,
    track: u.track,
    kind: u.kind,
    week: u.week,
    day: u.day,
    order: u.order,
    title_ru: u.title_ru,
    subtitle_ru: u.subtitle_ru,
    bonus: u.bonus,
    drills: u.drills.length,
    pass_score: u.pass_score,
  }));

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <ExpressOverview units={units} />
      </main>
    </>
  );
}

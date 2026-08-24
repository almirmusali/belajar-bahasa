import { SiteHeader } from "@/components/site-header";
import { ActivityTracker } from "@/components/activity-tracker";
import { MySetView } from "@/components/my-set-view";

// Набор пользователя живёт в localStorage, поэтому страница — оболочка:
// всё содержимое подтягивает клиент. Отсюда же и отсутствие
// generateStaticParams: серверу набор неизвестен.
export default async function MySetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <ActivityTracker />
      <MySetView id={id} />
    </>
  );
}

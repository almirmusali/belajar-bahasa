import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  LessonComingSoon,
  LessonHeader,
  LessonNav,
} from "@/components/lesson-chrome";
import { LessonCompleteButton } from "@/components/lesson-complete-button";
import { getLesson, lessons } from "@/lib/lessons";
import { Lesson01 } from "./lesson-01";

export function generateStaticParams() {
  return lessons.map((l) => ({ id: String(l.id) }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(Number(id));
  if (!lesson) notFound();

  const prev = lessons.find((l) => l.id === lesson.id - 1);
  const next = lessons.find((l) => l.id === lesson.id + 1);

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <LessonHeader lesson={lesson} />

        {lesson.available && lesson.id === 1 ? (
          <Lesson01 />
        ) : (
          <LessonComingSoon />
        )}

        {lesson.available && <LessonCompleteButton lessonId={lesson.id} />}

        <LessonNav prev={prev} next={next} />
      </main>
    </>
  );
}

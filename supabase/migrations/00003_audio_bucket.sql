-- Bucket для предсгенерированных MP3 (озвучка слов на ID / EN / RU).
-- Public read — каждый посетитель может скачать файлы.
-- Запись только service role (через скрипт scripts/generate-audio.mjs).

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Policy: anonymous и authenticated могут читать
create policy "Public audio read"
  on storage.objects for select
  using (bucket_id = 'audio');

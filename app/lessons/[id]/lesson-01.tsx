import { Phrase } from "@/components/phrase";

export function Lesson01() {
  return (
    <article className="prose-zinc mt-8 space-y-10">
      <Section
        title="1. Приветствие по времени суток"
        intro="В индонезийском приветствие зависит от времени: утром, днём, вечером и ночью используются разные слова. Selamat буквально означает «благополучный»."
      >
        <Grid>
          <Phrase id="Selamat pagi" ru="Доброе утро (примерно до 11:00)" />
          <Phrase id="Selamat siang" ru="Добрый день (примерно с 11 до 15)" />
          <Phrase id="Selamat sore" ru="Добрый вечер (15–18)" />
          <Phrase id="Selamat malam" ru="Доброй ночи (после 18, при встрече)" />
        </Grid>
      </Section>

      <Section
        title="2. Как дела"
        intro="Самый частый обмен фразами при встрече."
      >
        <Grid>
          <Phrase id="Apa kabar?" ru="Как дела? (досл. «какие новости?»)" />
          <Phrase id="Baik" ru="Хорошо" />
          <Phrase id="Baik-baik saja" ru="Всё хорошо (нейтрально, очень частый ответ)" />
          <Phrase id="Tidak begitu baik" ru="Не очень хорошо" />
        </Grid>
      </Section>

      <Section
        title="3. Личные местоимения"
        intro="Запомни три ключевых местоимения — этого хватит для половины уроков."
      >
        <Grid>
          <Phrase id="saya" ru="я (нейтрально-вежливо, везде уместно)" />
          <Phrase id="aku" ru="я (с близкими, друзьями, в песнях)" />
          <Phrase id="kamu" ru="ты (с равными, друзьями)" />
          <Phrase id="Anda" ru="Вы (вежливо, к старшему или незнакомому)" />
          <Phrase id="dia" ru="он / она (рода нет!)" />
          <Phrase id="kami" ru="мы (без собеседника)" />
          <Phrase id="kita" ru="мы (включая собеседника)" />
        </Grid>
      </Section>

      <Section
        title="4. Конструкция «Saya …» — без глагола «быть»"
        intro="Главная особенность индонезийского: в простых предложениях глагол-связка «есть/быть» не используется. Подлежащее ставится подряд со сказуемым."
      >
        <FormulaCard
          formula="[ Кто ] + [ кто/что/какой ]"
          example="Saya orang Rusia. = Я (есть) русский."
        />
        <Grid>
          <Phrase id="Saya Andrei." ru="Я Андрей." />
          <Phrase id="Saya orang Rusia." ru="Я русский. (досл. «человек России»)" />
          <Phrase id="Saya mahasiswa." ru="Я студент." />
          <Phrase id="Dia guru." ru="Он/она учитель." />
          <Phrase id="Kami teman." ru="Мы друзья." />
        </Grid>
      </Section>

      <Section
        title="5. Знакомство"
        intro="Стандартный набор фраз при первом знакомстве."
      >
        <Grid>
          <Phrase id="Nama saya Andrei." ru="Меня зовут Андрей. (досл. «имя моё Андрей»)" />
          <Phrase id="Siapa nama Anda?" ru="Как Вас зовут?" />
          <Phrase
            id="Senang berkenalan dengan Anda."
            ru="Рад знакомству с Вами."
          />
          <Phrase id="Saya dari Rusia." ru="Я из России." />
          <Phrase id="Anda dari mana?" ru="Вы откуда?" />
        </Grid>
      </Section>

      <Section
        title="6. Спасибо и прощание"
      >
        <Grid>
          <Phrase id="Terima kasih" ru="Спасибо" />
          <Phrase id="Sama-sama" ru="Пожалуйста (в ответ на спасибо)" />
          <Phrase id="Tolong" ru="Пожалуйста (просьба о помощи)" />
          <Phrase id="Maaf" ru="Извините" />
          <Phrase id="Sampai jumpa" ru="До свидания (до встречи)" />
          <Phrase id="Sampai besok" ru="До завтра" />
        </Grid>
      </Section>

      <Section
        title="7. Мини-диалог"
        intro="Соберём всё вместе. Прочитай вслух дважды."
      >
        <div className="space-y-2 rounded-xl border bg-card p-5">
          <DialogLine who="A" id="Selamat pagi!" ru="Доброе утро!" />
          <DialogLine who="B" id="Selamat pagi! Apa kabar?" ru="Доброе утро! Как дела?" />
          <DialogLine who="A" id="Baik-baik saja. Siapa nama Anda?" ru="Всё хорошо. Как Вас зовут?" />
          <DialogLine who="B" id="Nama saya Budi. Anda?" ru="Меня зовут Буди. А Вас?" />
          <DialogLine who="A" id="Nama saya Andrei. Saya dari Rusia." ru="Меня зовут Андрей. Я из России." />
          <DialogLine who="B" id="Senang berkenalan dengan Anda." ru="Рад знакомству." />
          <DialogLine who="A" id="Sama-sama. Sampai jumpa!" ru="Взаимно. До встречи!" />
        </div>
      </Section>

      <Section
        title="Упражнение"
        intro="Скажи вслух по-индонезийски. Подсказки — под спойлерами (но сначала попробуй сам)."
      >
        <div className="space-y-2">
          <Exercise ru="Я Мария." answer="Saya Maria." />
          <Exercise ru="Меня зовут Иван." answer="Nama saya Ivan." />
          <Exercise ru="Я из России." answer="Saya dari Rusia." />
          <Exercise ru="Как Вас зовут?" answer="Siapa nama Anda?" />
          <Exercise ru="Он студент." answer="Dia mahasiswa." />
          <Exercise ru="Мы друзья." answer="Kami teman." />
          <Exercise ru="Спасибо, до свидания!" answer="Terima kasih, sampai jumpa!" />
        </div>
      </Section>
    </article>
  );
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function FormulaCard({ formula, example }: { formula: string; example: string }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="font-mono text-sm text-primary">{formula}</div>
      <div className="mt-1 text-sm text-foreground">{example}</div>
    </div>
  );
}

function DialogLine({ who, id, ru }: { who: string; id: string; ru: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
        {who}
      </span>
      <div>
        <div className="font-medium">{id}</div>
        <div className="text-sm text-muted-foreground">{ru}</div>
      </div>
    </div>
  );
}

function Exercise({ ru, answer }: { ru: string; answer: string }) {
  return (
    <details className="group rounded-lg border bg-card p-3 open:bg-secondary/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span>{ru}</span>
        <span className="text-xs text-muted-foreground group-open:hidden">
          показать
        </span>
        <span className="hidden text-xs text-muted-foreground group-open:inline">
          скрыть
        </span>
      </summary>
      <div className="mt-2 text-primary font-medium">{answer}</div>
    </details>
  );
}

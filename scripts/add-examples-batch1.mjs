// Добавляет примеры для следующих наборов:
// pronouns, question-words, demonstratives, yes-no, grammar-particles, prepositions, conjunctions.
// Запуск: node scripts/add-examples-batch1.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = path.join(__dirname, "..", "data", "vocab");

const BY_SET = {
  pronouns: {
    "saya": [
      { id: "Saya orang Rusia.", ru: "Я русский." },
      { id: "Saya senang hari ini.", ru: "Я сегодня рад." },
      { id: "Saya tidak tahu jawabannya.", ru: "Я не знаю ответа." },
    ],
    "aku": [
      { id: "Aku cinta kamu.", ru: "Я тебя люблю." },
      { id: "Aku lapar.", ru: "Я голоден." },
      { id: "Aku mau pulang.", ru: "Я хочу домой." },
    ],
    "kamu": [
      { id: "Kamu di mana?", ru: "Ты где?" },
      { id: "Kamu mau apa?", ru: "Что ты хочешь?" },
      { id: "Apa kamu sudah makan?", ru: "Ты уже поел?" },
    ],
    "kau": [
      { id: "Kau di mana sekarang?", ru: "Где ты сейчас?" },
      { id: "Aku kira kau sudah pergi.", ru: "Я думал, ты уже ушёл." },
      { id: "Hanya kau yang aku mau.", ru: "Только ты мне нужен." },
    ],
    "Anda": [
      { id: "Apa kabar Anda?", ru: "Как Ваши дела?" },
      { id: "Silakan, Anda duluan.", ru: "Пожалуйста, Вы первый." },
      { id: "Anda dari mana?", ru: "Вы откуда?" },
    ],
    "dia": [
      { id: "Dia teman saya.", ru: "Он/она — мой друг." },
      { id: "Dia tidak datang hari ini.", ru: "Он/она сегодня не пришёл." },
      { id: "Apa dia tahu?", ru: "Он/она знает?" },
    ],
    "ia": [
      { id: "Ia pergi kemarin sore.", ru: "Он/она ушёл вчера вечером." },
      { id: "Ia sedang membaca buku.", ru: "Он/она читает книгу." },
      { id: "Ia tidak setuju dengan saya.", ru: "Он/она со мной не согласен." },
    ],
    "beliau": [
      { id: "Beliau adalah guru saya.", ru: "Он/она — мой учитель." },
      { id: "Beliau orang yang baik.", ru: "Он/она — хороший человек." },
      { id: "Beliau presiden kami.", ru: "Он — наш президент." },
    ],
    "kita": [
      { id: "Kita pergi sekarang!", ru: "Мы идём сейчас!" },
      { id: "Kita semua teman.", ru: "Мы все друзья." },
      { id: "Kita harus belajar lebih giat.", ru: "Нам надо учиться усерднее." },
    ],
    "kami": [
      { id: "Kami dari Rusia.", ru: "Мы из России." },
      { id: "Kami senang bertemu Anda.", ru: "Мы рады с Вами познакомиться." },
      { id: "Kami tinggal di Jakarta.", ru: "Мы живём в Джакарте." },
    ],
    "kalian": [
      { id: "Kalian mau ke mana?", ru: "Вы куда?" },
      { id: "Kalian semua sudah datang!", ru: "Вы все уже пришли!" },
      { id: "Kalian sudah makan?", ru: "Вы поели?" },
    ],
    "mereka": [
      { id: "Mereka teman saya.", ru: "Они мои друзья." },
      { id: "Mereka tidak di rumah.", ru: "Их нет дома." },
      { id: "Apa mereka tahu?", ru: "Они знают?" },
    ],
    "diri": [
      { id: "Jaga diri baik-baik!", ru: "Береги себя!" },
      { id: "Saya bicara dengan diri sendiri.", ru: "Я говорю сам с собой." },
      { id: "Lihat diri di cermin.", ru: "Посмотри на себя в зеркало." },
    ],
    "diri sendiri": [
      { id: "Saya percaya diri sendiri.", ru: "Я верю в себя." },
      { id: "Cintai diri sendiri dulu.", ru: "Сначала полюби себя." },
      { id: "Dia bicara dengan diri sendiri.", ru: "Он разговаривает сам с собой." },
    ],
  },

  "question-words": {
    "apa": [
      { id: "Apa itu?", ru: "Что это?" },
      { id: "Apa kamu mengerti?", ru: "Ты понимаешь?" },
      { id: "Apa kabar hari ini?", ru: "Как дела сегодня?" },
    ],
    "siapa": [
      { id: "Siapa namamu?", ru: "Как тебя зовут?" },
      { id: "Siapa dia?", ru: "Кто он/она?" },
      { id: "Siapa yang datang?", ru: "Кто пришёл?" },
    ],
    "mana": [
      { id: "Mana bukumu?", ru: "Где твоя книга?" },
      { id: "Yang mana kamu suka?", ru: "Какой тебе нравится?" },
      { id: "Mana yang lebih baik?", ru: "Какой лучше?" },
    ],
    "di mana": [
      { id: "Di mana toilet?", ru: "Где туалет?" },
      { id: "Kamu tinggal di mana?", ru: "Где ты живёшь?" },
      { id: "Di mana kunci saya?", ru: "Где мой ключ?" },
    ],
    "ke mana": [
      { id: "Mau ke mana?", ru: "Куда собираешься?" },
      { id: "Bus ini ke mana?", ru: "Куда идёт этот автобус?" },
      { id: "Anak-anak pergi ke mana?", ru: "Куда ушли дети?" },
    ],
    "dari mana": [
      { id: "Kamu dari mana?", ru: "Откуда ты?" },
      { id: "Dari mana asal kamu?", ru: "Откуда ты родом?" },
      { id: "Dari mana mereka datang?", ru: "Откуда они пришли?" },
    ],
    "kapan": [
      { id: "Kapan kamu pulang?", ru: "Когда ты вернёшься?" },
      { id: "Kapan rapat dimulai?", ru: "Когда начинается встреча?" },
      { id: "Kapan saja boleh.", ru: "Когда угодно." },
    ],
    "mengapa": [
      { id: "Mengapa kamu sedih?", ru: "Почему ты грустишь?" },
      { id: "Mengapa dia terlambat?", ru: "Почему он опоздал?" },
      { id: "Mengapa harus saya?", ru: "Почему именно я?" },
    ],
    "kenapa": [
      { id: "Kenapa kamu nangis?", ru: "Почему ты плачешь?" },
      { id: "Kenapa kamu di sini?", ru: "Почему ты здесь?" },
      { id: "Kenapa tidak datang?", ru: "Почему не пришёл?" },
    ],
    "bagaimana": [
      { id: "Bagaimana caranya?", ru: "Как это сделать?" },
      { id: "Bagaimana hari Anda?", ru: "Как Ваш день?" },
      { id: "Bagaimana kalau makan dulu?", ru: "Как насчёт сначала поесть?" },
    ],
    "berapa": [
      { id: "Berapa harga ini?", ru: "Сколько это стоит?" },
      { id: "Berapa umurmu?", ru: "Сколько тебе лет?" },
      { id: "Berapa lama lagi?", ru: "Сколько ещё?" },
    ],
    "yang mana": [
      { id: "Yang mana kamu suka?", ru: "Какой тебе нравится?" },
      { id: "Yang mana milikmu?", ru: "Какой твой?" },
      { id: "Yang mana yang benar?", ru: "Какой правильный?" },
    ],
    "apakah": [
      { id: "Apakah kamu mengerti?", ru: "Понимаешь ли ты?" },
      { id: "Apakah ini benar?", ru: "Это правда?" },
      { id: "Apakah dia akan datang?", ru: "Придёт ли он?" },
    ],
  },

  demonstratives: {
    "ini": [
      { id: "Ini buku saya.", ru: "Это моя книга." },
      { id: "Apa ini?", ru: "Что это?" },
      { id: "Ini sangat enak.", ru: "Это очень вкусно." },
    ],
    "itu": [
      { id: "Itu rumah Andi.", ru: "Это дом Анди." },
      { id: "Apa itu?", ru: "Что это (там)?" },
      { id: "Itu tidak benar.", ru: "Это неправда." },
    ],
    "sini": [
      { id: "Datang ke sini!", ru: "Иди сюда!" },
      { id: "Kamu di sini?", ru: "Ты здесь?" },
      { id: "Sini saja, nyaman.", ru: "Лучше тут, уютно." },
    ],
    "sana": [
      { id: "Pergi ke sana dulu.", ru: "Сначала иди туда." },
      { id: "Mereka di sana.", ru: "Они там." },
      { id: "Lihat ke sana!", ru: "Смотри туда!" },
    ],
    "situ": [
      { id: "Tunggu di situ.", ru: "Подожди там." },
      { id: "Apa kabar di situ?", ru: "Как дела у вас там?" },
      { id: "Sudah di situ?", ru: "Уже там?" },
    ],
    "begini": [
      { id: "Caranya begini.", ru: "Делается вот так." },
      { id: "Jangan begini terus.", ru: "Не делай так больше." },
      { id: "Begini lebih baik.", ru: "Так лучше." },
    ],
    "begitu": [
      { id: "Mengapa begitu?", ru: "Почему так?" },
      { id: "Jangan begitu.", ru: "Не надо так." },
      { id: "Begitu juga saya.", ru: "Я тоже так." },
    ],
    "seperti ini": [
      { id: "Buatlah seperti ini.", ru: "Сделай как это." },
      { id: "Mau seperti ini?", ru: "Хочешь такой?" },
      { id: "Sama seperti ini.", ru: "Точно как это." },
    ],
    "seperti itu": [
      { id: "Jangan seperti itu.", ru: "Не надо так." },
      { id: "Sama seperti itu.", ru: "Точно как то." },
      { id: "Tidak seperti itu.", ru: "Не так." },
    ],
  },

  "yes-no": {
    "ya": [
      { id: "Ya, saya mengerti.", ru: "Да, я понимаю." },
      { id: "Ya, betul.", ru: "Да, верно." },
      { id: "Ya atau tidak?", ru: "Да или нет?" },
    ],
    "iya": [
      { id: "Iya, dong!", ru: "Да, конечно!" },
      { id: "Iya, saya tahu.", ru: "Да, я знаю." },
      { id: "Iya juga, ya.", ru: "Да, точно." },
    ],
    "betul": [
      { id: "Betul sekali!", ru: "Совершенно верно!" },
      { id: "Itu betul.", ru: "Это правильно." },
      { id: "Apa betul?", ru: "Правда?" },
    ],
    "benar": [
      { id: "Jawabanmu benar.", ru: "Твой ответ правильный." },
      { id: "Itu benar.", ru: "Это правда." },
      { id: "Apa benar dia datang?", ru: "Правда что он придёт?" },
    ],
    "salah": [
      { id: "Jawaban itu salah.", ru: "Тот ответ неправильный." },
      { id: "Saya salah, maaf.", ru: "Я ошибся, извини." },
      { id: "Itu nomor salah.", ru: "Это не тот номер." },
    ],
    "tentu": [
      { id: "Tentu saya datang.", ru: "Конечно я приду." },
      { id: "Tentu boleh.", ru: "Конечно можно." },
      { id: "Tentu, kenapa tidak?", ru: "Конечно, почему нет?" },
    ],
    "tentu saja": [
      { id: "Tentu saja saya mau!", ru: "Конечно я хочу!" },
      { id: "Tentu saja boleh.", ru: "Конечно можно." },
      { id: "Tentu saja dia tahu.", ru: "Конечно он знает." },
    ],
    "pasti": [
      { id: "Saya pasti datang besok.", ru: "Я точно приду завтра." },
      { id: "Pasti enak.", ru: "Точно вкусно." },
      { id: "Itu pasti dia.", ru: "Это точно он." },
    ],
    "mungkin": [
      { id: "Mungkin besok.", ru: "Может завтра." },
      { id: "Mungkin dia lupa.", ru: "Может он забыл." },
      { id: "Mungkin tidak.", ru: "Возможно нет." },
    ],
    "barangkali": [
      { id: "Barangkali besok hujan.", ru: "Может быть завтра дождь." },
      { id: "Barangkali dia tidur.", ru: "Может быть он спит." },
      { id: "Barangkali sudah pulang.", ru: "Возможно уже ушёл домой." },
    ],
    "mustahil": [
      { id: "Mustahil dia tahu.", ru: "Невозможно чтобы он знал." },
      { id: "Itu mustahil.", ru: "Это невозможно." },
      { id: "Tidak ada yang mustahil.", ru: "Нет ничего невозможного." },
    ],
  },

  "grammar-particles": {
    "tidak": [
      { id: "Saya tidak tahu.", ru: "Я не знаю." },
      { id: "Tidak masalah.", ru: "Без проблем." },
      { id: "Dia tidak datang.", ru: "Он не пришёл." },
    ],
    "tak": [
      { id: "Tak apa-apa.", ru: "Ничего страшного." },
      { id: "Saya tak mengerti.", ru: "Я не понимаю." },
      { id: "Tak ada uang.", ru: "Денег нет." },
    ],
    "bukan": [
      { id: "Ini bukan milik saya.", ru: "Это не моё." },
      { id: "Bukan saya yang melakukannya.", ru: "Это сделал не я." },
      { id: "Bukan begitu.", ru: "Не так." },
    ],
    "belum": [
      { id: "Saya belum makan.", ru: "Я ещё не ел." },
      { id: "Belum tahu.", ru: "Ещё не знаю." },
      { id: "Apakah sudah? Belum.", ru: "Уже? Ещё нет." },
    ],
    "sudah": [
      { id: "Saya sudah makan.", ru: "Я уже поел." },
      { id: "Sudah jam berapa?", ru: "Уже сколько времени?" },
      { id: "Sudah selesai.", ru: "Уже закончено." },
    ],
    "telah": [
      { id: "Dia telah pergi.", ru: "Он уже ушёл." },
      { id: "Saya telah membaca buku itu.", ru: "Я прочитал ту книгу." },
      { id: "Telah lama tidak bertemu.", ru: "Давно не виделись." },
    ],
    "pernah": [
      { id: "Apakah kamu pernah ke Bali?", ru: "Ты когда-нибудь был на Бали?" },
      { id: "Saya pernah belajar bahasa Spanyol.", ru: "Я когда-то учил испанский." },
      { id: "Pernah dengar lagu ini?", ru: "Слышал эту песню?" },
    ],
    "masih": [
      { id: "Saya masih di kantor.", ru: "Я ещё в офисе." },
      { id: "Masih hidup.", ru: "Ещё жив." },
      { id: "Masih bisa belajar.", ru: "Ещё можно учиться." },
    ],
    "baru": [
      { id: "Baru saja sampai.", ru: "Только что приехал." },
      { id: "Buku baru.", ru: "Новая книга." },
      { id: "Saya baru tahu.", ru: "Я только что узнал." },
    ],
    "akan": [
      { id: "Saya akan pergi besok.", ru: "Я уеду завтра." },
      { id: "Akan hujan sebentar lagi.", ru: "Скоро будет дождь." },
      { id: "Dia akan datang.", ru: "Он придёт." },
    ],
    "mau": [
      { id: "Saya mau kopi.", ru: "Я хочу кофе." },
      { id: "Mau ke mana?", ru: "Куда собираешься?" },
      { id: "Apa kamu mau ini?", ru: "Ты хочешь это?" },
    ],
    "ingin": [
      { id: "Saya ingin pulang.", ru: "Я хочу домой." },
      { id: "Ingin tahu kebenaran.", ru: "Хочу знать правду." },
      { id: "Ingin sekali bertemu.", ru: "Очень хочу встретиться." },
    ],
    "hendak": [
      { id: "Saya hendak bicara dengan Anda.", ru: "Я хочу с Вами поговорить." },
      { id: "Dia hendak pergi.", ru: "Он намеревается уйти." },
      { id: "Hendak ke mana?", ru: "Куда направляешься?" },
    ],
    "sedang": [
      { id: "Saya sedang makan.", ru: "Я сейчас ем." },
      { id: "Dia sedang tidur.", ru: "Он спит." },
      { id: "Mereka sedang belajar.", ru: "Они учатся." },
    ],
    "lagi": [
      { id: "Saya lagi sibuk.", ru: "Я сейчас занят." },
      { id: "Coba lagi!", ru: "Попробуй ещё раз!" },
      { id: "Mau lagi?", ru: "Ещё хочешь?" },
    ],
    "harus": [
      { id: "Saya harus pergi.", ru: "Я должен идти." },
      { id: "Kamu harus makan.", ru: "Ты должен поесть." },
      { id: "Harus rajin belajar.", ru: "Надо усердно учиться." },
    ],
    "wajib": [
      { id: "Wajib hadir di rapat.", ru: "Обязательно присутствовать на встрече." },
      { id: "Pelajaran wajib.", ru: "Обязательный предмет." },
      { id: "Wajib mengikuti aturan.", ru: "Обязательно соблюдать правила." },
    ],
    "perlu": [
      { id: "Saya perlu air.", ru: "Мне нужна вода." },
      { id: "Perlu istirahat.", ru: "Нужно отдохнуть." },
      { id: "Tidak perlu khawatir.", ru: "Не нужно волноваться." },
    ],
    "butuh": [
      { id: "Saya butuh bantuan.", ru: "Мне нужна помощь." },
      { id: "Butuh waktu lebih.", ru: "Нужно больше времени." },
      { id: "Apa kamu butuh sesuatu?", ru: "Тебе что-то нужно?" },
    ],
    "boleh": [
      { id: "Boleh saya masuk?", ru: "Можно мне войти?" },
      { id: "Boleh saja.", ru: "Можно." },
      { id: "Tidak boleh merokok.", ru: "Курить нельзя." },
    ],
    "bisa": [
      { id: "Saya bisa berbahasa Inggris.", ru: "Я могу говорить по-английски." },
      { id: "Apa kamu bisa berenang?", ru: "Ты умеешь плавать?" },
      { id: "Bisa membantu?", ru: "Можешь помочь?" },
    ],
    "dapat": [
      { id: "Saya dapat hadiah.", ru: "Я получил подарок." },
      { id: "Dia dapat juara.", ru: "Он занял первое место." },
      { id: "Dapatkah kamu datang?", ru: "Сможешь прийти?" },
    ],
    "mampu": [
      { id: "Saya mampu membayar.", ru: "Я в состоянии заплатить." },
      { id: "Dia mampu lulus.", ru: "Он способен сдать." },
      { id: "Tidak mampu lari jauh.", ru: "Не в силах бежать далеко." },
    ],
    "jangan": [
      { id: "Jangan menangis.", ru: "Не плачь." },
      { id: "Jangan pergi!", ru: "Не уходи!" },
      { id: "Jangan begitu.", ru: "Не надо так." },
    ],
    "yang": [
      { id: "Buku yang saya beli kemarin.", ru: "Книга которую я купил вчера." },
      { id: "Orang yang baik.", ru: "Хороший человек." },
      { id: "Yang mana?", ru: "Какой?" },
    ],
    "ada": [
      { id: "Ada apa?", ru: "В чём дело?" },
      { id: "Ada makanan di kulkas.", ru: "В холодильнике есть еда." },
      { id: "Tidak ada uang.", ru: "Денег нет." },
    ],
    "adalah": [
      { id: "Saya adalah guru.", ru: "Я учитель." },
      { id: "Cinta adalah indah.", ru: "Любовь прекрасна." },
      { id: "Indonesia adalah negara besar.", ru: "Индонезия — большая страна." },
    ],
  },

  prepositions: {
    "di": [
      { id: "Saya di rumah.", ru: "Я дома." },
      { id: "Di mana kunci?", ru: "Где ключ?" },
      { id: "Di sini ramai.", ru: "Здесь людно." },
    ],
    "ke": [
      { id: "Saya pergi ke pasar.", ru: "Я иду на рынок." },
      { id: "Ke mana kamu?", ru: "Ты куда?" },
      { id: "Ayo ke pantai!", ru: "Пошли на пляж!" },
    ],
    "dari": [
      { id: "Saya dari Rusia.", ru: "Я из России." },
      { id: "Dari mana asalnya?", ru: "Откуда он родом?" },
      { id: "Hadiah dari ibu.", ru: "Подарок от мамы." },
    ],
    "pada": [
      { id: "Pada hari Senin.", ru: "В понедельник." },
      { id: "Pada awalnya susah.", ru: "Сначала было трудно." },
      { id: "Lihat pada saya.", ru: "Посмотри на меня." },
    ],
    "dengan": [
      { id: "Saya pergi dengan teman.", ru: "Я иду с другом." },
      { id: "Bicara dengan ibu.", ru: "Поговори с мамой." },
      { id: "Makan dengan sumpit.", ru: "Есть палочками." },
    ],
    "untuk": [
      { id: "Hadiah untuk kamu.", ru: "Подарок для тебя." },
      { id: "Untuk apa?", ru: "Для чего?" },
      { id: "Saya datang untuk membantu.", ru: "Я пришёл помочь." },
    ],
    "buat": [
      { id: "Buat saya, ya.", ru: "Для меня, пожалуйста." },
      { id: "Buat apa kamu di sini?", ru: "Зачем ты здесь?" },
      { id: "Hadiah buat ibu.", ru: "Подарок для мамы." },
    ],
    "oleh": [
      { id: "Buku ini ditulis oleh dia.", ru: "Эта книга написана им." },
      { id: "Ditemukan oleh polisi.", ru: "Найдено полицией." },
      { id: "Dimasak oleh ibu.", ru: "Приготовлено мамой." },
    ],
    "tentang": [
      { id: "Bicara tentang cuaca.", ru: "Говорить о погоде." },
      { id: "Apa tentang ini?", ru: "О чём это?" },
      { id: "Pikirkan tentang itu.", ru: "Подумай об этом." },
    ],
    "tanpa": [
      { id: "Saya tanpa uang.", ru: "Я без денег." },
      { id: "Tanpa kamu, saya sedih.", ru: "Без тебя я грущу." },
      { id: "Pergi tanpa makan.", ru: "Уйти не поев." },
    ],
    "sampai": [
      { id: "Sampai jumpa!", ru: "До встречи!" },
      { id: "Tunggu sampai besok.", ru: "Жди до завтра." },
      { id: "Sampai sini saja.", ru: "Только до сюда." },
    ],
    "hingga": [
      { id: "Hingga akhir.", ru: "До конца." },
      { id: "Bekerja hingga malam.", ru: "Работать до вечера." },
      { id: "Hingga saat ini.", ru: "До настоящего момента." },
    ],
    "sejak": [
      { id: "Sejak kemarin saya sakit.", ru: "Со вчерашнего дня я болею." },
      { id: "Sejak kecil dia rajin.", ru: "С детства он усердный." },
      { id: "Sejak kapan kamu di sini?", ru: "С каких пор ты здесь?" },
    ],
    "antara": [
      { id: "Antara kamu dan saya.", ru: "Между тобой и мной." },
      { id: "Pilih antara dua.", ru: "Выбери из двух." },
      { id: "Antara hidup dan mati.", ru: "Между жизнью и смертью." },
    ],
    "melalui": [
      { id: "Pergi melalui jalan ini.", ru: "Идти этой дорогой." },
      { id: "Belajar melalui pengalaman.", ru: "Учиться через опыт." },
      { id: "Kirim melalui email.", ru: "Отправь по электронной почте." },
    ],
    "terhadap": [
      { id: "Sikap terhadap orang tua.", ru: "Отношение к родителям." },
      { id: "Sayang terhadap anak.", ru: "Любовь к ребёнку." },
      { id: "Hormat terhadap guru.", ru: "Уважение к учителю." },
    ],
    "kepada": [
      { id: "Surat kepada ibu.", ru: "Письмо маме." },
      { id: "Bicara kepada guru.", ru: "Говорить с учителем." },
      { id: "Kepada siapa ini?", ru: "Кому это?" },
    ],
    "atas": [
      { id: "Buku di atas meja.", ru: "Книга на столе." },
      { id: "Terima kasih atas bantuan.", ru: "Спасибо за помощь." },
      { id: "Atas izin Anda.", ru: "С Вашего разрешения." },
    ],
    "bawah": [
      { id: "Kucing di bawah meja.", ru: "Кошка под столом." },
      { id: "Suhu di bawah nol.", ru: "Температура ниже нуля." },
      { id: "Di bawah jembatan.", ru: "Под мостом." },
    ],
    "dalam": [
      { id: "Air dalam gelas.", ru: "Вода в стакане." },
      { id: "Dalam kamar saya.", ru: "В моей комнате." },
      { id: "Dalam hati saya tahu.", ru: "В глубине души я знаю." },
    ],
    "luar": [
      { id: "Hujan di luar.", ru: "На улице дождь." },
      { id: "Luar negeri.", ru: "За границей." },
      { id: "Di luar rumah.", ru: "Вне дома." },
    ],
    "depan": [
      { id: "Di depan pintu.", ru: "Перед дверью." },
      { id: "Maju ke depan.", ru: "Шаг вперёд." },
      { id: "Depan rumah saya ada taman.", ru: "Перед моим домом парк." },
    ],
    "belakang": [
      { id: "Di belakang rumah.", ru: "За домом." },
      { id: "Mundur ke belakang.", ru: "Назад." },
      { id: "Belakang sekolah ada lapangan.", ru: "За школой площадка." },
    ],
    "samping": [
      { id: "Dia duduk di samping saya.", ru: "Он сидит рядом со мной." },
      { id: "Samping kanan.", ru: "Справа." },
      { id: "Berjalan di samping sungai.", ru: "Идти вдоль реки." },
    ],
    "tengah": [
      { id: "Di tengah jalan.", ru: "Посреди дороги." },
      { id: "Tengah malam.", ru: "Полночь." },
      { id: "Tengah-tengah ruangan.", ru: "Прямо в центре комнаты." },
    ],
    "sekitar": [
      { id: "Sekitar jam sepuluh.", ru: "Около десяти часов." },
      { id: "Lihat sekitar.", ru: "Посмотри вокруг." },
      { id: "Di sekitar rumah saya hijau.", ru: "Вокруг моего дома зелено." },
    ],
    "dekat": [
      { id: "Toko dekat sekolah.", ru: "Магазин рядом со школой." },
      { id: "Saya dekat dengan ibu.", ru: "Я близок с мамой." },
      { id: "Dekat sini ada warung.", ru: "Рядом есть закусочная." },
    ],
    "jauh": [
      { id: "Jauh dari rumah.", ru: "Далеко от дома." },
      { id: "Bali jauh dari Jakarta.", ru: "Бали далеко от Джакарты." },
      { id: "Jauh lebih baik.", ru: "Намного лучше." },
    ],
  },

  conjunctions: {
    "dan": [
      { id: "Saya dan kamu.", ru: "Я и ты." },
      { id: "Hujan dan dingin.", ru: "Дождь и холодно." },
      { id: "Makan dan minum.", ru: "Есть и пить." },
    ],
    "atau": [
      { id: "Teh atau kopi?", ru: "Чай или кофе?" },
      { id: "Kiri atau kanan?", ru: "Налево или направо?" },
      { id: "Pergi atau tinggal?", ru: "Уйти или остаться?" },
    ],
    "tapi": [
      { id: "Suka tapi tidak beli.", ru: "Нравится, но не куплю." },
      { id: "Mau tapi sibuk.", ru: "Хочу, но занят." },
      { id: "Lapar tapi tidak ada makanan.", ru: "Голоден, но еды нет." },
    ],
    "tetapi": [
      { id: "Saya senang tetapi lelah.", ru: "Я рад, но устал." },
      { id: "Indah tetapi mahal.", ru: "Красиво, но дорого." },
      { id: "Mau tetapi tidak bisa.", ru: "Хочу, но не могу." },
    ],
    "namun": [
      { id: "Hujan, namun saya pergi.", ru: "Дождь, однако я пошёл." },
      { id: "Susah, namun bisa.", ru: "Сложно, но возможно." },
      { id: "Namun saya mengerti.", ru: "Тем не менее я понимаю." },
    ],
    "karena": [
      { id: "Sedih karena hujan.", ru: "Грустно из-за дождя." },
      { id: "Terlambat karena macet.", ru: "Опоздал из-за пробок." },
      { id: "Karena itu saya datang.", ru: "Поэтому я пришёл." },
    ],
    "sebab": [
      { id: "Sebab apa?", ru: "По какой причине?" },
      { id: "Apa sebabnya?", ru: "В чём причина?" },
      { id: "Bukan sebab itu.", ru: "Не по этой причине." },
    ],
    "supaya": [
      { id: "Belajar supaya pintar.", ru: "Учиться, чтобы стать умным." },
      { id: "Tidur supaya sehat.", ru: "Спать, чтобы быть здоровым." },
      { id: "Supaya tidak terlambat.", ru: "Чтобы не опоздать." },
    ],
    "agar": [
      { id: "Berdoa agar selamat.", ru: "Молиться, чтобы быть в безопасности." },
      { id: "Agar lebih baik.", ru: "Чтобы было лучше." },
      { id: "Agar tidak lupa.", ru: "Чтобы не забыть." },
    ],
    "kalau": [
      { id: "Kalau hujan, jangan pergi.", ru: "Если дождь, не ходи." },
      { id: "Kalau lapar, makan.", ru: "Если голоден, ешь." },
      { id: "Kalau begitu, ya sudah.", ru: "Если так, ладно." },
    ],
    "jika": [
      { id: "Jika kamu datang, telepon.", ru: "Если придёшь, позвони." },
      { id: "Jika perlu, tanya.", ru: "Если нужно, спроси." },
      { id: "Jika ada masalah, hubungi saya.", ru: "Если будут проблемы, свяжись со мной." },
    ],
    "walaupun": [
      { id: "Walaupun hujan, saya pergi.", ru: "Хотя дождь, я пошёл." },
      { id: "Walaupun susah, bisa.", ru: "Хоть и сложно, возможно." },
      { id: "Walaupun jauh, datang.", ru: "Хоть и далеко, пришёл." },
    ],
    "meskipun": [
      { id: "Meskipun lelah, lanjut.", ru: "Хоть и устал, продолжу." },
      { id: "Meskipun mahal, beli.", ru: "Хоть и дорого, куплю." },
      { id: "Meskipun tidak suka, makan.", ru: "Хоть и не нравится, поел." },
    ],
    "sebelum": [
      { id: "Sebelum makan, cuci tangan.", ru: "Перед едой помой руки." },
      { id: "Sebelum tidur, baca buku.", ru: "Перед сном читай книгу." },
      { id: "Sebelum kamu pergi.", ru: "Перед тем как ты уйдёшь." },
    ],
    "sesudah": [
      { id: "Sesudah makan, istirahat.", ru: "После еды отдохни." },
      { id: "Sesudah hujan, ada pelangi.", ru: "После дождя радуга." },
      { id: "Sesudah pulang kerja.", ru: "После возвращения с работы." },
    ],
    "setelah": [
      { id: "Setelah rapat, pulang.", ru: "После встречи я пошёл домой." },
      { id: "Setelah lima menit.", ru: "Через пять минут." },
      { id: "Setelah itu kami makan.", ru: "После этого мы поели." },
    ],
    "ketika": [
      { id: "Ketika saya kecil.", ru: "Когда я был маленьким." },
      { id: "Ketika hujan datang.", ru: "Когда пошёл дождь." },
      { id: "Ketika dia tertawa.", ru: "Когда он смеялся." },
    ],
    "saat": [
      { id: "Saat ini.", ru: "В данный момент." },
      { id: "Saat itu juga saya tahu.", ru: "В тот момент я понял." },
      { id: "Saat saya datang, dia tidur.", ru: "Когда я пришёл, он спал." },
    ],
    "sambil": [
      { id: "Makan sambil menonton TV.", ru: "Есть, смотря телевизор." },
      { id: "Bicara sambil tertawa.", ru: "Говорить, смеясь." },
      { id: "Berjalan sambil bernyanyi.", ru: "Идти, напевая." },
    ],
    "sementara": [
      { id: "Sementara menunggu, baca buku.", ru: "Пока ждёшь, почитай книгу." },
      { id: "Sementara itu, dia tidur.", ru: "Тем временем он спал." },
      { id: "Sementara saya pergi.", ru: "Пока меня нет." },
    ],
    "selama": [
      { id: "Selama dua jam saya menunggu.", ru: "Я ждал два часа." },
      { id: "Selama hidup.", ru: "Всю жизнь." },
      { id: "Selama ini saya salah.", ru: "Всё это время я ошибался." },
    ],
    "lalu": [
      { id: "Saya makan, lalu tidur.", ru: "Я поел, потом лёг спать." },
      { id: "Pergi ke kantor, lalu pulang.", ru: "Идти в офис, потом домой." },
      { id: "Beli kopi, lalu duduk.", ru: "Купи кофе и сядь." },
    ],
    "kemudian": [
      { id: "Kemudian dia pergi.", ru: "Потом он ушёл." },
      { id: "Beberapa menit kemudian.", ru: "Несколько минут спустя." },
      { id: "Kemudian datang Andi.", ru: "Затем пришёл Анди." },
    ],
    "jadi": [
      { id: "Jadi, mau ke mana?", ru: "Ну так куда идём?" },
      { id: "Saya mau jadi guru.", ru: "Я хочу стать учителем." },
      { id: "Saya lelah, jadi pulang.", ru: "Я устал, поэтому пошёл домой." },
    ],
    "juga": [
      { id: "Saya juga lelah.", ru: "Я тоже устал." },
      { id: "Dia juga datang.", ru: "Он тоже пришёл." },
      { id: "Mau juga ya?", ru: "Тоже хочешь?" },
    ],
    "saja": [
      { id: "Saya saja yang pergi.", ru: "Только я пойду." },
      { id: "Lihat saja!", ru: "Просто посмотри!" },
      { id: "Begitu saja.", ru: "Вот так." },
    ],
    "pun": [
      { id: "Saya pun mau ikut.", ru: "Я тоже хочу пойти." },
      { id: "Tidak satu pun datang.", ru: "Никто не пришёл." },
      { id: "Apa pun jadi.", ru: "Что угодно подойдёт." },
    ],
    "bahkan": [
      { id: "Bahkan anak kecil tahu.", ru: "Даже маленький ребёнок знает." },
      { id: "Bahkan saya terkejut.", ru: "Даже я удивился." },
      { id: "Bahkan lebih baik.", ru: "Даже лучше." },
    ],
    "misalnya": [
      { id: "Misalnya buku ini.", ru: "Например, эта книга." },
      { id: "Misalnya kamu datang besok.", ru: "Например, если ты придёшь завтра." },
      { id: "Sayur, misalnya bayam.", ru: "Овощи, например шпинат." },
    ],
    "sebagai": [
      { id: "Sebagai guru saya bangga.", ru: "Как учитель, я горжусь." },
      { id: "Sebagai teman, saya datang.", ru: "Как друг, я пришёл." },
      { id: "Sebagai contoh.", ru: "В качестве примера." },
    ],
  },
};

let totalAdded = 0;
let totalSets = 0;
for (const [slug, examples] of Object.entries(BY_SET)) {
  const file = path.join(VOCAB_DIR, slug, "index.json");
  if (!fs.existsSync(file)) {
    console.warn(`!! Set "${slug}" not found, skip`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let added = 0;
  for (const w of data.words ?? []) {
    if (!w.examples && examples[w.id]) {
      w.examples = examples[w.id];
      added++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`${slug}: +${added} (of ${data.words.length})`);
  totalAdded += added;
  totalSets++;
}
console.log(`\nDone. ${totalAdded} words got examples across ${totalSets} sets.`);

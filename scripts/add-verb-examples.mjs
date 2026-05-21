// Добавляет примеры использования к каждому глаголу в data/vocab/verbs/index.json.
// Запуск: node scripts/add-verb-examples.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "vocab", "verbs", "index.json");

const E = {
  pergi: [
    { id: "Saya pergi ke pasar.", ru: "Я иду на рынок." },
    { id: "Mereka pergi kemarin.", ru: "Они ушли вчера." },
    { id: "Mau pergi ke mana?", ru: "Куда собираешься?" },
  ],
  datang: [
    { id: "Dia datang dari Jakarta.", ru: "Он приехал из Джакарты." },
    { id: "Tamu sudah datang.", ru: "Гости уже пришли." },
    { id: "Kapan kamu datang?", ru: "Когда ты придёшь?" },
  ],
  kembali: [
    { id: "Saya akan kembali besok.", ru: "Я вернусь завтра." },
    { id: "Buku ini kembali ke perpustakaan.", ru: "Эта книга возвращается в библиотеку." },
    { id: "Tolong kembali tepat waktu.", ru: "Пожалуйста, вернись вовремя." },
  ],
  pulang: [
    { id: "Saya pulang jam tujuh.", ru: "Я иду домой в семь." },
    { id: "Anak-anak sudah pulang sekolah.", ru: "Дети уже вернулись из школы." },
    { id: "Aku mau pulang sekarang.", ru: "Я хочу домой сейчас." },
  ],
  masuk: [
    { id: "Silakan masuk!", ru: "Заходите, пожалуйста!" },
    { id: "Saya masuk kamar pelan-pelan.", ru: "Я тихо вошёл в комнату." },
    { id: "Dia masuk kerja jam delapan.", ru: "Он выходит на работу в восемь." },
  ],
  keluar: [
    { id: "Saya keluar rumah pagi-pagi.", ru: "Я выхожу из дома рано утром." },
    { id: "Mereka keluar dari toko.", ru: "Они вышли из магазина." },
    { id: "Jangan keluar saat hujan.", ru: "Не выходи, когда идёт дождь." },
  ],
  naik: [
    { id: "Kami naik bus ke kota.", ru: "Мы садимся на автобус в город." },
    { id: "Saya naik tangga ke lantai dua.", ru: "Я поднимаюсь по лестнице на второй этаж." },
    { id: "Harga naik lagi.", ru: "Цена снова выросла." },
  ],
  turun: [
    { id: "Saya turun di halte berikutnya.", ru: "Я выхожу на следующей остановке." },
    { id: "Hujan turun deras.", ru: "Идёт сильный дождь." },
    { id: "Tolong turun pelan-pelan.", ru: "Пожалуйста, спускайся медленно." },
  ],
  lewat: [
    { id: "Bus lewat setiap lima menit.", ru: "Автобус проходит каждые пять минут." },
    { id: "Saya lewat depan rumahmu.", ru: "Я прошёл перед твоим домом." },
    { id: "Sudah lewat tengah malam.", ru: "Уже за полночь." },
  ],
  berjalan: [
    { id: "Saya suka berjalan di taman.", ru: "Я люблю гулять в парке." },
    { id: "Anak itu sudah bisa berjalan.", ru: "Этот ребёнок уже умеет ходить." },
    { id: "Kami berjalan ke sekolah.", ru: "Мы идём пешком в школу." },
  ],
  "jalan-jalan": [
    { id: "Mari kita jalan-jalan!", ru: "Пойдём прогуляемся!" },
    { id: "Mereka jalan-jalan di pantai.", ru: "Они прогуливаются по пляжу." },
    { id: "Saya jalan-jalan tiap sore.", ru: "Я гуляю каждый вечер." },
  ],
  berlari: [
    { id: "Anjing itu berlari cepat.", ru: "Эта собака быстро бежит." },
    { id: "Saya berlari setiap pagi.", ru: "Я бегаю каждое утро." },
    { id: "Mereka berlari ke pantai.", ru: "Они побежали к пляжу." },
  ],
  lari: [
    { id: "Lari! Hujan deras!", ru: "Беги! Сильный дождь!" },
    { id: "Dia lari setiap pagi.", ru: "Он бегает каждое утро." },
    { id: "Kucing lari dari anjing.", ru: "Кошка убегает от собаки." },
  ],
  berenang: [
    { id: "Saya berenang di laut.", ru: "Я плаваю в море." },
    { id: "Dia tidak bisa berenang.", ru: "Он не умеет плавать." },
    { id: "Ikan berenang di sungai.", ru: "Рыба плывёт в реке." },
  ],
  terbang: [
    { id: "Pesawat terbang tinggi.", ru: "Самолёт летит высоко." },
    { id: "Burung terbang di langit.", ru: "Птица летит в небе." },
    { id: "Kami terbang ke Bali besok.", ru: "Мы летим на Бали завтра." },
  ],
  duduk: [
    { id: "Silakan duduk di kursi.", ru: "Садитесь, пожалуйста, на стул." },
    { id: "Saya duduk di depan komputer.", ru: "Я сижу за компьютером." },
    { id: "Mereka duduk di kafe.", ru: "Они сидят в кафе." },
  ],
  berdiri: [
    { id: "Tolong berdiri.", ru: "Пожалуйста, встаньте." },
    { id: "Dia berdiri di depan pintu.", ru: "Он стоит перед дверью." },
    { id: "Saya berdiri di bus.", ru: "Я стою в автобусе." },
  ],
  berbaring: [
    { id: "Saya berbaring di kasur.", ru: "Я лежу на матрасе." },
    { id: "Anjing itu berbaring di lantai.", ru: "Эта собака лежит на полу." },
    { id: "Tolong berbaring sebentar.", ru: "Полежи немного, пожалуйста." },
  ],
  makan: [
    { id: "Saya makan nasi goreng.", ru: "Я ем жареный рис." },
    { id: "Kami makan bersama.", ru: "Мы едим вместе." },
    { id: "Apa kamu sudah makan?", ru: "Ты уже поел?" },
  ],
  minum: [
    { id: "Saya minum air putih.", ru: "Я пью воду." },
    { id: "Dia minum kopi tiap pagi.", ru: "Он пьёт кофе каждое утро." },
    { id: "Jangan minum terlalu banyak.", ru: "Не пей слишком много." },
  ],
  masak: [
    { id: "Ibu masak di dapur.", ru: "Мама готовит на кухне." },
    { id: "Saya bisa masak nasi.", ru: "Я умею варить рис." },
    { id: "Hari ini saya masak ikan.", ru: "Сегодня я готовлю рыбу." },
  ],
  memasak: [
    { id: "Saya sedang memasak.", ru: "Я сейчас готовлю." },
    { id: "Memasak adalah hobi saya.", ru: "Готовка — моё хобби." },
    { id: "Dia memasak untuk keluarga.", ru: "Он готовит для семьи." },
  ],
  membeli: [
    { id: "Saya membeli buku baru.", ru: "Я купил новую книгу." },
    { id: "Dia membeli mobil mahal.", ru: "Он купил дорогую машину." },
    { id: "Mereka membeli rumah di Bali.", ru: "Они купили дом на Бали." },
  ],
  beli: [
    { id: "Beli dua, gratis satu.", ru: "Купи два, один в подарок." },
    { id: "Mau beli apa?", ru: "Что хочешь купить?" },
    { id: "Saya beli kopi tadi.", ru: "Я только что купил кофе." },
  ],
  menjual: [
    { id: "Toko itu menjual makanan.", ru: "Этот магазин продаёт еду." },
    { id: "Saya menjual sepeda lama saya.", ru: "Я продал свой старый велосипед." },
    { id: "Mereka menjual rumah.", ru: "Они продают дом." },
  ],
  jual: [
    { id: "Apa kamu jual handphone?", ru: "Ты продаёшь телефон?" },
    { id: "Saya jual mobil minggu lalu.", ru: "Я продал машину на прошлой неделе." },
    { id: "Mereka jual buah segar.", ru: "Они продают свежие фрукты." },
  ],
  membayar: [
    { id: "Saya membayar dengan kartu.", ru: "Я плачу картой." },
    { id: "Tolong membayar di kasir.", ru: "Пожалуйста, оплатите в кассе." },
    { id: "Dia membayar tunai.", ru: "Он платит наличными." },
  ],
  bayar: [
    { id: "Mau bayar bagaimana?", ru: "Как будете оплачивать?" },
    { id: "Saya bayar besok.", ru: "Я заплачу завтра." },
    { id: "Sudah bayar semuanya.", ru: "Уже всё оплатил." },
  ],
  menerima: [
    { id: "Saya menerima hadiah dari teman.", ru: "Я получил подарок от друга." },
    { id: "Kami menerima tamu hari ini.", ru: "Мы сегодня принимаем гостей." },
    { id: "Dia menerima pekerjaan baru.", ru: "Он получил новую работу." },
  ],
  terima: [
    { id: "Sudah terima paketnya?", ru: "Уже получил посылку?" },
    { id: "Saya terima pesan kamu.", ru: "Я получил твоё сообщение." },
    { id: "Terima undangan ini.", ru: "Прими это приглашение." },
  ],
  mengembalikan: [
    { id: "Saya mengembalikan buku ke perpustakaan.", ru: "Я вернул книгу в библиотеку." },
    { id: "Tolong mengembalikan kunci.", ru: "Пожалуйста, верни ключ." },
    { id: "Dia mengembalikan uang itu.", ru: "Он вернул эти деньги." },
  ],
  melihat: [
    { id: "Saya melihat pelangi di langit.", ru: "Я вижу радугу в небе." },
    { id: "Apa kamu melihat kucing saya?", ru: "Ты видел мою кошку?" },
    { id: "Mereka melihat film di bioskop.", ru: "Они смотрят фильм в кинотеатре." },
  ],
  lihat: [
    { id: "Lihat ke sini!", ru: "Посмотри сюда!" },
    { id: "Saya lihat dia kemarin.", ru: "Я видел его вчера." },
    { id: "Lihat saja, jangan beli.", ru: "Просто смотри, не покупай." },
  ],
  menonton: [
    { id: "Saya menonton TV malam ini.", ru: "Я смотрю телевизор вечером." },
    { id: "Mereka menonton sepak bola.", ru: "Они смотрят футбол." },
    { id: "Mari menonton film bersama.", ru: "Давайте вместе посмотрим фильм." },
  ],
  memperhatikan: [
    { id: "Tolong memperhatikan dengan baik.", ru: "Пожалуйста, внимательно слушайте." },
    { id: "Saya memperhatikan suaranya.", ru: "Я обращаю внимание на его голос." },
    { id: "Dia tidak memperhatikan saya.", ru: "Он не обращает на меня внимания." },
  ],
  mendengar: [
    { id: "Saya mendengar suara aneh.", ru: "Я слышу странный звук." },
    { id: "Apa kamu mendengar saya?", ru: "Ты меня слышишь?" },
    { id: "Mereka tidak mendengar berita itu.", ru: "Они не слышали эту новость." },
  ],
  dengar: [
    { id: "Dengar baik-baik!", ru: "Слушай внимательно!" },
    { id: "Saya dengar kabar dari ibu.", ru: "Я услышал новости от мамы." },
    { id: "Dengar suara hujan?", ru: "Слышишь шум дождя?" },
  ],
  mendengarkan: [
    { id: "Saya mendengarkan musik.", ru: "Я слушаю музыку." },
    { id: "Tolong mendengarkan guru.", ru: "Пожалуйста, слушайте учителя." },
    { id: "Mereka mendengarkan radio.", ru: "Они слушают радио." },
  ],
  berbicara: [
    { id: "Saya berbicara bahasa Indonesia.", ru: "Я говорю по-индонезийски." },
    { id: "Dia berbicara dengan ibunya.", ru: "Он разговаривает с мамой." },
    { id: "Tolong berbicara pelan-pelan.", ru: "Пожалуйста, говорите помедленнее." },
  ],
  bicara: [
    { id: "Mau bicara apa?", ru: "О чём хочешь поговорить?" },
    { id: "Saya bicara dengan bos kemarin.", ru: "Я говорил с боссом вчера." },
    { id: "Jangan bicara sambil makan.", ru: "Не говори с набитым ртом." },
  ],
  ngomong: [
    { id: "Ngomong apa, sih?", ru: "Что ты болтаешь?" },
    { id: "Saya ngomong sama dia tadi.", ru: "Я болтал с ним только что." },
    { id: "Jangan ngomong keras-keras.", ru: "Не говори громко." },
  ],
  berkata: [
    { id: "Dia berkata 'selamat'.", ru: "Он сказал «поздравляю»." },
    { id: "Saya berkata yang sebenarnya.", ru: "Я говорю правду." },
    { id: "Mereka berkata tidak ada masalah.", ru: "Они сказали, что нет проблем." },
  ],
  mengatakan: [
    { id: "Saya mengatakan kebenaran.", ru: "Я говорю правду." },
    { id: "Dia tidak mau mengatakan apa-apa.", ru: "Он не хочет ничего говорить." },
    { id: "Mereka mengatakan akan datang.", ru: "Они сказали, что придут." },
  ],
  menjawab: [
    { id: "Tolong menjawab pertanyaan saya.", ru: "Пожалуйста, ответьте на мой вопрос." },
    { id: "Dia menjawab dengan cepat.", ru: "Он отвечает быстро." },
    { id: "Saya tidak tahu cara menjawab.", ru: "Я не знаю, как ответить." },
  ],
  bertanya: [
    { id: "Saya mau bertanya sesuatu.", ru: "Я хочу кое-что спросить." },
    { id: "Anak itu bertanya banyak.", ru: "Этот ребёнок много спрашивает." },
    { id: "Mereka bertanya tentang rumah.", ru: "Они спрашивали о доме." },
  ],
  memanggil: [
    { id: "Ibu memanggil anak-anak.", ru: "Мама зовёт детей." },
    { id: "Saya memanggil taksi.", ru: "Я зову такси." },
    { id: "Tolong memanggil dokter.", ru: "Пожалуйста, вызовите врача." },
  ],
  membaca: [
    { id: "Saya membaca buku setiap malam.", ru: "Я читаю книгу каждый вечер." },
    { id: "Dia tidak suka membaca.", ru: "Он не любит читать." },
    { id: "Tolong membaca dengan keras.", ru: "Пожалуйста, читай вслух." },
  ],
  menulis: [
    { id: "Saya menulis surat untuk ibu.", ru: "Я пишу письмо маме." },
    { id: "Dia sedang menulis buku.", ru: "Он пишет книгу." },
    { id: "Tolong menulis nama Anda.", ru: "Пожалуйста, напишите ваше имя." },
  ],
  mencatat: [
    { id: "Saya mencatat semuanya.", ru: "Я записываю всё." },
    { id: "Tolong mencatat alamat ini.", ru: "Пожалуйста, запиши этот адрес." },
    { id: "Mereka mencatat hasil rapat.", ru: "Они записали итоги совещания." },
  ],
  menggambar: [
    { id: "Anak-anak suka menggambar.", ru: "Дети любят рисовать." },
    { id: "Saya menggambar pemandangan.", ru: "Я рисую пейзаж." },
    { id: "Dia menggambar wajah saya.", ru: "Он нарисовал моё лицо." },
  ],
  mencari: [
    { id: "Saya mencari kunci rumah.", ru: "Я ищу ключ от дома." },
    { id: "Mereka mencari pekerjaan baru.", ru: "Они ищут новую работу." },
    { id: "Tolong mencari di laci.", ru: "Пожалуйста, поищи в ящике." },
  ],
  menemukan: [
    { id: "Saya menemukan dompet di jalan.", ru: "Я нашёл кошелёк на улице." },
    { id: "Dia menemukan jawaban.", ru: "Он нашёл ответ." },
    { id: "Akhirnya kami menemukan rumahnya.", ru: "Наконец мы нашли его дом." },
  ],
  kehilangan: [
    { id: "Saya kehilangan dompet.", ru: "Я потерял кошелёк." },
    { id: "Dia kehilangan ayahnya.", ru: "Он потерял отца." },
    { id: "Jangan sampai kehilangan kunci!", ru: "Только не теряй ключ!" },
  ],
  mengambil: [
    { id: "Saya mengambil buku dari rak.", ru: "Я беру книгу с полки." },
    { id: "Tolong mengambil air.", ru: "Пожалуйста, принеси воды." },
    { id: "Dia mengambil uang dari bank.", ru: "Он снимает деньги в банке." },
  ],
  memberikan: [
    { id: "Saya memberikan hadiah kepada ibu.", ru: "Я дарю подарок маме." },
    { id: "Dia memberikan kunci kepada saya.", ru: "Он дал мне ключ." },
    { id: "Mereka memberikan uang kepada anak-anak.", ru: "Они дают детям деньги." },
  ],
  memberi: [
    { id: "Saya memberi dia bunga.", ru: "Я подарил ей цветы." },
    { id: "Tolong memberi tahu saya.", ru: "Пожалуйста, скажите мне." },
    { id: "Mereka memberi kami makanan.", ru: "Они дали нам еду." },
  ],
  membawa: [
    { id: "Saya membawa payung.", ru: "Я взял зонт." },
    { id: "Tolong membawa buku kemari.", ru: "Пожалуйста, принеси сюда книгу." },
    { id: "Dia membawa anjingnya.", ru: "Он привёл свою собаку." },
  ],
  mengirim: [
    { id: "Saya mengirim surat ke teman.", ru: "Я отправил письмо другу." },
    { id: "Dia mengirim email setiap hari.", ru: "Он отправляет email каждый день." },
    { id: "Mereka mengirim paket.", ru: "Они отправляют посылку." },
  ],
  mengantar: [
    { id: "Saya mengantar anak ke sekolah.", ru: "Я отвожу ребёнка в школу." },
    { id: "Tolong mengantar tamu ke ruang tamu.", ru: "Пожалуйста, проводите гостей в гостиную." },
    { id: "Dia mengantar saya pulang.", ru: "Он проводил меня домой." },
  ],
  membuka: [
    { id: "Saya membuka pintu.", ru: "Я открываю дверь." },
    { id: "Toko membuka jam delapan.", ru: "Магазин открывается в восемь." },
    { id: "Dia membuka surat itu.", ru: "Он открыл это письмо." },
  ],
  menutup: [
    { id: "Tolong menutup jendela.", ru: "Пожалуйста, закрой окно." },
    { id: "Toko menutup jam sepuluh.", ru: "Магазин закрывается в десять." },
    { id: "Dia menutup buku.", ru: "Он закрыл книгу." },
  ],
  memulai: [
    { id: "Kami memulai rapat sekarang.", ru: "Мы начинаем совещание сейчас." },
    { id: "Saya memulai kerja jam tujuh.", ru: "Я начинаю работу в семь." },
    { id: "Mari memulai pelajaran.", ru: "Давайте начнём урок." },
  ],
  mulai: [
    { id: "Mari kita mulai!", ru: "Давайте начнём!" },
    { id: "Hujan mulai turun.", ru: "Начался дождь." },
    { id: "Saya mulai belajar bahasa Indonesia.", ru: "Я начал учить индонезийский." },
  ],
  mengakhiri: [
    { id: "Saya mengakhiri pekerjaan ini.", ru: "Я заканчиваю эту работу." },
    { id: "Mari mengakhiri rapat.", ru: "Давайте закончим собрание." },
    { id: "Dia mengakhiri ceritanya.", ru: "Он закончил свой рассказ." },
  ],
  selesai: [
    { id: "Pekerjaan saya sudah selesai.", ru: "Моя работа уже закончена." },
    { id: "Selesai makan, kami pulang.", ru: "Закончив есть, мы ушли домой." },
    { id: "Apa sudah selesai?", ru: "Уже готово?" },
  ],
  beristirahat: [
    { id: "Saya mau beristirahat sebentar.", ru: "Я хочу немного отдохнуть." },
    { id: "Mereka beristirahat di taman.", ru: "Они отдыхают в парке." },
    { id: "Tolong beristirahat dulu.", ru: "Пожалуйста, сначала отдохни." },
  ],
  mencuci: [
    { id: "Saya mencuci baju hari ini.", ru: "Я сегодня стираю одежду." },
    { id: "Tolong mencuci tangan dulu.", ru: "Пожалуйста, сначала помой руки." },
    { id: "Dia mencuci mobil setiap minggu.", ru: "Он моет машину каждую неделю." },
  ],
  membersihkan: [
    { id: "Saya membersihkan kamar.", ru: "Я убираю комнату." },
    { id: "Tolong membersihkan meja.", ru: "Пожалуйста, убери со стола." },
    { id: "Mereka membersihkan rumah.", ru: "Они убираются в доме." },
  ],
  menyapu: [
    { id: "Ibu menyapu lantai pagi-pagi.", ru: "Мама подметает пол рано утром." },
    { id: "Saya menyapu halaman.", ru: "Я мету двор." },
    { id: "Tolong menyapu di sini.", ru: "Пожалуйста, подмети здесь." },
  ],
  membantu: [
    { id: "Bolehkah saya membantu?", ru: "Могу я помочь?" },
    { id: "Dia selalu membantu temannya.", ru: "Он всегда помогает своему другу." },
    { id: "Tolong membantu ibu.", ru: "Помоги маме, пожалуйста." },
  ],
  menolong: [
    { id: "Tolong menolong saya!", ru: "Помогите мне, пожалуйста!" },
    { id: "Dia menolong orang tua di jalan.", ru: "Он помог пожилому человеку на улице." },
    { id: "Polisi menolong anak hilang.", ru: "Полиция помогла потерявшемуся ребёнку." },
  ],
  berpikir: [
    { id: "Saya berpikir tentang hidup.", ru: "Я размышляю о жизни." },
    { id: "Dia berpikir dulu sebelum bicara.", ru: "Он сначала думает, потом говорит." },
    { id: "Tolong berpikir baik-baik.", ru: "Пожалуйста, хорошо подумай." },
  ],
  memikirkan: [
    { id: "Saya memikirkan masalah itu.", ru: "Я думаю об этой проблеме." },
    { id: "Dia memikirkan keluarganya.", ru: "Он думает о своей семье." },
    { id: "Tolong memikirkan baik-baik.", ru: "Пожалуйста, подумай хорошо." },
  ],
  percaya: [
    { id: "Saya percaya pada Tuhan.", ru: "Я верю в Бога." },
    { id: "Apa kamu percaya cerita itu?", ru: "Ты веришь этой истории?" },
    { id: "Mereka percaya pada keajaiban.", ru: "Они верят в чудеса." },
  ],
  mengerti: [
    { id: "Saya mengerti bahasa Inggris.", ru: "Я понимаю английский." },
    { id: "Apa kamu mengerti?", ru: "Ты понимаешь?" },
    { id: "Dia tidak mengerti soal ini.", ru: "Он не понимает этот вопрос." },
  ],
  memahami: [
    { id: "Saya memahami situasinya.", ru: "Я понимаю ситуацию." },
    { id: "Dia memahami bahasa Jawa.", ru: "Он понимает яванский язык." },
    { id: "Mari memahami dulu.", ru: "Давайте сначала разберёмся." },
  ],
  mengetahui: [
    { id: "Saya tidak mengetahui hal itu.", ru: "Я этого не знал." },
    { id: "Polisi mengetahui semua.", ru: "Полиция знает всё." },
    { id: "Mereka mengetahui kebenaran.", ru: "Они знают правду." },
  ],
  ingat: [
    { id: "Saya masih ingat nama dia.", ru: "Я ещё помню его имя." },
    { id: "Ingat membawa payung!", ru: "Не забудь взять зонт!" },
    { id: "Apa kamu ingat saya?", ru: "Помнишь меня?" },
  ],
  mengingat: [
    { id: "Saya selalu mengingat ibu.", ru: "Я всегда помню маму." },
    { id: "Dia mengingat hari ulang tahun.", ru: "Он помнит день рождения." },
    { id: "Tolong mengingat alamat ini.", ru: "Пожалуйста, запомни этот адрес." },
  ],
  lupa: [
    { id: "Saya lupa kunci di rumah.", ru: "Я забыл ключ дома." },
    { id: "Jangan lupa makan!", ru: "Не забудь поесть!" },
    { id: "Dia lupa nama saya.", ru: "Он забыл моё имя." },
  ],
  melupakan: [
    { id: "Saya tidak bisa melupakan dia.", ru: "Я не могу его забыть." },
    { id: "Tolong jangan melupakan saya.", ru: "Пожалуйста, не забывай меня." },
    { id: "Dia melupakan janjinya.", ru: "Он забыл своё обещание." },
  ],
  suka: [
    { id: "Saya suka kopi.", ru: "Я люблю кофе." },
    { id: "Anak-anak suka cokelat.", ru: "Дети любят шоколад." },
    { id: "Apa kamu suka musik?", ru: "Любишь музыку?" },
  ],
  menyukai: [
    { id: "Saya menyukai cerita itu.", ru: "Мне нравится эта история." },
    { id: "Dia menyukai semua hewan.", ru: "Он любит всех животных." },
    { id: "Mereka menyukai film Indonesia.", ru: "Им нравятся индонезийские фильмы." },
  ],
  cinta: [
    { id: "Saya cinta padamu.", ru: "Я люблю тебя." },
    { id: "Dia cinta keluarganya.", ru: "Он любит свою семью." },
    { id: "Cinta itu indah.", ru: "Любовь прекрасна." },
  ],
  mencintai: [
    { id: "Saya mencintai istri saya.", ru: "Я люблю свою жену." },
    { id: "Dia mencintai anak-anaknya.", ru: "Он любит своих детей." },
    { id: "Mereka mencintai tanah air.", ru: "Они любят родину." },
  ],
  sayang: [
    { id: "Saya sayang sama kamu.", ru: "Я тебя люблю." },
    { id: "Dia sayang adiknya.", ru: "Он любит младшего брата." },
    { id: "Sayang sekali, sudah habis.", ru: "Очень жаль, уже кончилось." },
  ],
  benci: [
    { id: "Saya benci nyamuk.", ru: "Я ненавижу комаров." },
    { id: "Dia benci hujan.", ru: "Он ненавидит дождь." },
    { id: "Jangan benci siapa-siapa.", ru: "Никого не ненавидь." },
  ],
  marah: [
    { id: "Ibu marah sama saya.", ru: "Мама на меня сердится." },
    { id: "Jangan marah, ya?", ru: "Не сердись, ладно?" },
    { id: "Dia marah karena terlambat.", ru: "Он злится из-за опоздания." },
  ],
  senang: [
    { id: "Saya senang bertemu kamu.", ru: "Я рад тебя видеть." },
    { id: "Anak-anak senang main di taman.", ru: "Дети рады играть в парке." },
    { id: "Senang sekali hari ini!", ru: "Очень радостный день!" },
  ],
  gembira: [
    { id: "Hati saya gembira.", ru: "На душе радостно." },
    { id: "Mereka gembira menerima hadiah.", ru: "Они радостно приняли подарок." },
    { id: "Wajahmu kelihatan gembira.", ru: "У тебя радостное лицо." },
  ],
  bahagia: [
    { id: "Saya bahagia bersama kamu.", ru: "Я счастлив с тобой." },
    { id: "Keluarga kami bahagia.", ru: "Наша семья счастлива." },
    { id: "Semoga kamu bahagia selalu.", ru: "Пусть ты будешь всегда счастлив." },
  ],
  sedih: [
    { id: "Saya sedih hari ini.", ru: "Мне сегодня грустно." },
    { id: "Cerita itu membuat sedih.", ru: "Эта история печальная." },
    { id: "Jangan sedih, semua akan baik.", ru: "Не грусти, всё будет хорошо." },
  ],
  takut: [
    { id: "Anak itu takut anjing.", ru: "Этот ребёнок боится собак." },
    { id: "Saya takut gelap.", ru: "Я боюсь темноты." },
    { id: "Jangan takut, ada saya.", ru: "Не бойся, я рядом." },
  ],
  kaget: [
    { id: "Saya kaget mendengar berita.", ru: "Я шокирован новостью." },
    { id: "Dia kaget melihat saya.", ru: "Он удивился, увидев меня." },
    { id: "Maaf, saya kaget.", ru: "Извини, я опешил." },
  ],
  terkejut: [
    { id: "Mereka terkejut sekali.", ru: "Они очень удивились." },
    { id: "Saya terkejut dengan hadiah.", ru: "Я удивлён подарку." },
    { id: "Wajahnya terkejut.", ru: "У него удивлённое лицо." },
  ],
  malu: [
    { id: "Anak itu malu kepada orang.", ru: "Этот ребёнок стесняется людей." },
    { id: "Saya malu bicara di depan.", ru: "Я стесняюсь говорить впереди." },
    { id: "Jangan malu, bicara saja.", ru: "Не стесняйся, просто говори." },
  ],
  bangga: [
    { id: "Saya bangga dengan anak saya.", ru: "Я горжусь своим ребёнком." },
    { id: "Ibu bangga padamu.", ru: "Мама тобой гордится." },
    { id: "Mereka bangga jadi orang Indonesia.", ru: "Они гордятся, что индонезийцы." },
  ],
  kecewa: [
    { id: "Saya kecewa dengan hasilnya.", ru: "Я разочарован результатом." },
    { id: "Dia kecewa pada temannya.", ru: "Он разочарован в друге." },
    { id: "Tolong jangan kecewa.", ru: "Пожалуйста, не разочаровывайся." },
  ],
  bingung: [
    { id: "Saya bingung dengan soal ini.", ru: "Я запутался в этом вопросе." },
    { id: "Dia bingung mau ke mana.", ru: "Он не знает, куда идти." },
    { id: "Jangan bingung, tanya saja.", ru: "Не путайся, просто спрашивай." },
  ],
  kesal: [
    { id: "Saya kesal karena hujan.", ru: "Меня раздражает дождь." },
    { id: "Dia kesal sama saya.", ru: "Он злится на меня." },
    { id: "Jangan kesal, sabar saja.", ru: "Не раздражайся, потерпи." },
  ],
  menangis: [
    { id: "Anak itu menangis keras.", ru: "Этот ребёнок громко плачет." },
    { id: "Saya tidak mau menangis.", ru: "Я не хочу плакать." },
    { id: "Mereka menangis karena bahagia.", ru: "Они плачут от счастья." },
  ],
  tertawa: [
    { id: "Kami tertawa keras-keras.", ru: "Мы громко смеялись." },
    { id: "Cerita itu lucu, saya tertawa.", ru: "Эта история смешная, я засмеялся." },
    { id: "Dia tertawa sendirian.", ru: "Он смеётся один." },
  ],
  tersenyum: [
    { id: "Dia tersenyum kepada saya.", ru: "Он улыбается мне." },
    { id: "Anak itu tersenyum lucu.", ru: "Этот ребёнок мило улыбается." },
    { id: "Tolong tersenyum untuk foto.", ru: "Улыбнись для фото." },
  ],
  merasa: [
    { id: "Saya merasa lelah.", ru: "Я чувствую усталость." },
    { id: "Dia merasa senang.", ru: "Он чувствует радость." },
    { id: "Bagaimana kamu merasa?", ru: "Как ты себя чувствуешь?" },
  ],
  hidup: [
    { id: "Saya hidup di Jakarta.", ru: "Я живу в Джакарте." },
    { id: "Kakek masih hidup.", ru: "Дедушка ещё жив." },
    { id: "Hidup ini singkat.", ru: "Жизнь коротка." },
  ],
  mati: [
    { id: "Lampu mati.", ru: "Свет погас." },
    { id: "Mesin mobil mati.", ru: "Мотор машины заглох." },
    { id: "Bunga itu sudah mati.", ru: "Этот цветок уже погиб." },
  ],
  lahir: [
    { id: "Saya lahir di Moskow.", ru: "Я родился в Москве." },
    { id: "Bayi itu baru lahir.", ru: "Этот малыш только что родился." },
    { id: "Tahun berapa kamu lahir?", ru: "В каком году ты родился?" },
  ],
  meninggal: [
    { id: "Kakek meninggal tahun lalu.", ru: "Дедушка умер в прошлом году." },
    { id: "Saya turut berduka, dia meninggal.", ru: "Соболезную, он скончался." },
    { id: "Tetangga kami meninggal kemarin.", ru: "Наш сосед умер вчера." },
  ],
  menikah: [
    { id: "Mereka menikah bulan depan.", ru: "Они женятся в следующем месяце." },
    { id: "Saya akan menikah tahun depan.", ru: "Я выйду замуж в следующем году." },
    { id: "Kapan kamu menikah?", ru: "Когда ты женишься?" },
  ],
  bertemu: [
    { id: "Saya bertemu teman di kafe.", ru: "Я встретился с другом в кафе." },
    { id: "Senang bertemu Anda.", ru: "Рад встрече." },
    { id: "Kami akan bertemu besok.", ru: "Мы встретимся завтра." },
  ],
  ketemu: [
    { id: "Sampai ketemu lagi!", ru: "До встречи!" },
    { id: "Saya ketemu dia tadi.", ru: "Я только что его встретил." },
    { id: "Yuk, ketemu nanti malam.", ru: "Давай встретимся вечером." },
  ],
  berpisah: [
    { id: "Mereka berpisah tahun lalu.", ru: "Они расстались в прошлом году." },
    { id: "Sedih sekali harus berpisah.", ru: "Очень грустно расставаться." },
    { id: "Kami berpisah di stasiun.", ru: "Мы попрощались на станции." },
  ],
  menunggu: [
    { id: "Saya menunggu bus di halte.", ru: "Я жду автобус на остановке." },
    { id: "Tolong menunggu sebentar.", ru: "Подождите, пожалуйста, немного." },
    { id: "Dia menunggu jawaban saya.", ru: "Он ждёт моего ответа." },
  ],
  tunggu: [
    { id: "Tunggu sebentar, ya?", ru: "Подожди немного, ладно?" },
    { id: "Saya tunggu di sini.", ru: "Я жду здесь." },
    { id: "Tunggu, jangan pergi!", ru: "Подожди, не уходи!" },
  ],
  terlambat: [
    { id: "Maaf, saya terlambat.", ru: "Извините, я опоздал." },
    { id: "Jangan terlambat besok.", ru: "Не опаздывай завтра." },
    { id: "Dia selalu terlambat.", ru: "Он всегда опаздывает." },
  ],
  bermain: [
    { id: "Anak-anak bermain di taman.", ru: "Дети играют в парке." },
    { id: "Saya bermain piano.", ru: "Я играю на пианино." },
    { id: "Mari bermain sepak bola!", ru: "Давайте играть в футбол!" },
  ],
  main: [
    { id: "Anak suka main air.", ru: "Дети любят играть с водой." },
    { id: "Yuk main bola!", ru: "Давай в мяч!" },
    { id: "Saya main game di rumah.", ru: "Я играю в игру дома." },
  ],
  menari: [
    { id: "Dia menari dengan indah.", ru: "Она красиво танцует." },
    { id: "Mari menari bersama!", ru: "Давайте потанцуем вместе!" },
    { id: "Saya tidak bisa menari.", ru: "Я не умею танцевать." },
  ],
  menyanyi: [
    { id: "Anak itu suka menyanyi.", ru: "Этот ребёнок любит петь." },
    { id: "Mari menyanyi bersama!", ru: "Давайте петь вместе!" },
    { id: "Saya menyanyi di kamar mandi.", ru: "Я пою в ванной." },
  ],
  bernyanyi: [
    { id: "Burung bernyanyi pagi-pagi.", ru: "Птицы поют рано утром." },
    { id: "Dia bernyanyi sambil masak.", ru: "Она поёт во время готовки." },
    { id: "Mereka bernyanyi di gereja.", ru: "Они поют в церкви." },
  ],
  menggunakan: [
    { id: "Saya menggunakan komputer.", ru: "Я пользуюсь компьютером." },
    { id: "Tolong menggunakan masker.", ru: "Пожалуйста, носите маску." },
    { id: "Dia menggunakan kamus.", ru: "Он использует словарь." },
  ],
  memakai: [
    { id: "Saya memakai jaket.", ru: "Я надеваю куртку." },
    { id: "Anak-anak memakai sepatu.", ru: "Дети надевают обувь." },
    { id: "Tolong memakai sabuk pengaman.", ru: "Пожалуйста, пристегните ремни." },
  ],
  pakai: [
    { id: "Pakai jaket, dingin di luar.", ru: "Надень куртку, на улице холодно." },
    { id: "Saya pakai sepatu hitam.", ru: "Я надел чёрную обувь." },
    { id: "Mau pakai apa hari ini?", ru: "Что наденешь сегодня?" },
  ],
  mencoba: [
    { id: "Saya mencoba makanan baru.", ru: "Я пробую новую еду." },
    { id: "Mari mencoba sekali lagi.", ru: "Давайте попробуем ещё раз." },
    { id: "Dia mencoba bicara bahasa Inggris.", ru: "Он пытается говорить по-английски." },
  ],
  berusaha: [
    { id: "Saya berusaha keras.", ru: "Я очень стараюсь." },
    { id: "Tolong berusaha lebih baik.", ru: "Пожалуйста, постарайся лучше." },
    { id: "Mereka berusaha mencari kerja.", ru: "Они пытаются найти работу." },
  ],
  berhasil: [
    { id: "Akhirnya saya berhasil!", ru: "Наконец я добился успеха!" },
    { id: "Dia berhasil lulus ujian.", ru: "Он сдал экзамен." },
    { id: "Tim kami berhasil menang.", ru: "Наша команда выиграла." },
  ],
  gagal: [
    { id: "Saya gagal ujian matematika.", ru: "Я провалил экзамен по математике." },
    { id: "Rencana itu gagal.", ru: "Этот план провалился." },
    { id: "Jangan takut gagal.", ru: "Не бойся неудачи." },
  ],
  menang: [
    { id: "Tim kami menang!", ru: "Наша команда победила!" },
    { id: "Dia menang lotere.", ru: "Он выиграл в лотерею." },
    { id: "Siapa yang menang?", ru: "Кто выиграл?" },
  ],
  kalah: [
    { id: "Tim kami kalah hari ini.", ru: "Наша команда сегодня проиграла." },
    { id: "Saya kalah main catur.", ru: "Я проиграл в шахматы." },
    { id: "Jangan sampai kalah!", ru: "Только не проиграй!" },
  ],
  mengubah: [
    { id: "Saya mengubah rencana.", ru: "Я меняю план." },
    { id: "Dia mengubah pikirannya.", ru: "Он изменил мнение." },
    { id: "Tolong mengubah jadwal.", ru: "Пожалуйста, измените расписание." },
  ],
  mengganti: [
    { id: "Saya mengganti baju basah.", ru: "Я переодеваюсь из мокрой одежды." },
    { id: "Tolong mengganti lampu.", ru: "Пожалуйста, замени лампу." },
    { id: "Dia mengganti pekerjaan.", ru: "Он сменил работу." },
  ],
  menambah: [
    { id: "Saya menambah gula sedikit.", ru: "Я добавил немного сахара." },
    { id: "Tolong menambah air.", ru: "Пожалуйста, добавьте воды." },
    { id: "Dia menambah berat badan.", ru: "Он набрал вес." },
  ],
  mengurangi: [
    { id: "Saya mengurangi gula di kopi.", ru: "Я уменьшаю сахар в кофе." },
    { id: "Tolong mengurangi suara.", ru: "Пожалуйста, уменьшите громкость." },
    { id: "Dia mengurangi kerja.", ru: "Он сократил работу." },
  ],
  memperbaiki: [
    { id: "Saya memperbaiki sepeda.", ru: "Я ремонтирую велосипед." },
    { id: "Tolong memperbaiki kunci pintu.", ru: "Пожалуйста, почини замок двери." },
    { id: "Dia memperbaiki nilainya.", ru: "Он улучшил свои оценки." },
  ],
  merusak: [
    { id: "Anak itu merusak mainan.", ru: "Этот ребёнок ломает игрушку." },
    { id: "Hujan deras merusak atap.", ru: "Сильный дождь повредил крышу." },
    { id: "Jangan merusak buku!", ru: "Не порти книгу!" },
  ],
  membuat: [
    { id: "Ibu membuat kue.", ru: "Мама печёт пирог." },
    { id: "Saya membuat rencana.", ru: "Я составляю план." },
    { id: "Dia membuat saya senang.", ru: "Он меня радует." },
  ],
  bikin: [
    { id: "Bikin kopi, dong!", ru: "Свари кофе, пожалуйста!" },
    { id: "Saya bikin sarapan.", ru: "Я готовлю завтрак." },
    { id: "Mau bikin apa?", ru: "Что хочешь приготовить?" },
  ],
  melakukan: [
    { id: "Saya melakukan pekerjaan.", ru: "Я делаю работу." },
    { id: "Dia melakukan yang terbaik.", ru: "Он делает всё возможное." },
    { id: "Mari melakukan ini bersama.", ru: "Давайте сделаем это вместе." },
  ],
  mempunyai: [
    { id: "Saya mempunyai dua anak.", ru: "У меня двое детей." },
    { id: "Mereka mempunyai rumah besar.", ru: "У них большой дом." },
    { id: "Dia mempunyai banyak teman.", ru: "У него много друзей." },
  ],
  punya: [
    { id: "Saya punya uang sedikit.", ru: "У меня немного денег." },
    { id: "Apa kamu punya pulpen?", ru: "У тебя есть ручка?" },
    { id: "Mereka punya mobil baru.", ru: "У них новая машина." },
  ],
  memiliki: [
    { id: "Dia memiliki perusahaan.", ru: "Он владеет компанией." },
    { id: "Saya memiliki sepeda.", ru: "У меня есть велосипед." },
    { id: "Mereka memiliki rumah di Bali.", ru: "У них есть дом на Бали." },
  ],
  menjadi: [
    { id: "Saya mau menjadi dokter.", ru: "Я хочу стать врачом." },
    { id: "Dia menjadi guru sekarang.", ru: "Он теперь учитель." },
    { id: "Mereka menjadi sahabat.", ru: "Они стали лучшими друзьями." },
  ],
  mengajar: [
    { id: "Ibu mengajar bahasa Inggris.", ru: "Мама преподаёт английский." },
    { id: "Dia mengajar anak-anak.", ru: "Он учит детей." },
    { id: "Saya mengajar matematika.", ru: "Я преподаю математику." },
  ],
  mengajari: [
    { id: "Saya mengajari adik membaca.", ru: "Я учу младшего брата читать." },
    { id: "Tolong mengajari saya.", ru: "Пожалуйста, научи меня." },
    { id: "Dia mengajari kami bahasa Indonesia.", ru: "Он учит нас индонезийскому." },
  ],
  belajar: [
    { id: "Saya belajar bahasa Indonesia.", ru: "Я учу индонезийский." },
    { id: "Anak-anak belajar di sekolah.", ru: "Дети учатся в школе." },
    { id: "Tolong belajar lebih giat.", ru: "Пожалуйста, занимайся усерднее." },
  ],
  mempelajari: [
    { id: "Saya mempelajari budaya Bali.", ru: "Я изучаю балийскую культуру." },
    { id: "Dia mempelajari sejarah.", ru: "Он изучает историю." },
    { id: "Mari mempelajari ini bersama.", ru: "Давайте изучим это вместе." },
  ],
  berlatih: [
    { id: "Saya berlatih setiap hari.", ru: "Я тренируюсь каждый день." },
    { id: "Tim kami berlatih keras.", ru: "Наша команда упорно тренируется." },
    { id: "Tolong berlatih lebih banyak.", ru: "Пожалуйста, тренируйся больше." },
  ],
  berolahraga: [
    { id: "Saya berolahraga di pagi hari.", ru: "Я занимаюсь спортом утром." },
    { id: "Dia berolahraga tiap minggu.", ru: "Он тренируется каждую неделю." },
    { id: "Berolahraga itu sehat.", ru: "Спорт полезен." },
  ],
  berlibur: [
    { id: "Kami berlibur di Bali.", ru: "Мы отдыхаем на Бали." },
    { id: "Saya mau berlibur ke pantai.", ru: "Я хочу отдохнуть на пляже." },
    { id: "Mereka berlibur tiap tahun.", ru: "Они отдыхают каждый год." },
  ],
  bersantai: [
    { id: "Saya bersantai di rumah.", ru: "Я отдыхаю дома." },
    { id: "Mari bersantai sebentar.", ru: "Давайте немного расслабимся." },
    { id: "Dia bersantai di pantai.", ru: "Он отдыхает на пляже." },
  ],
  berbohong: [
    { id: "Jangan berbohong!", ru: "Не ври!" },
    { id: "Dia sering berbohong.", ru: "Он часто врёт." },
    { id: "Saya tidak pernah berbohong.", ru: "Я никогда не вру." },
  ],
  jujur: [
    { id: "Anak itu jujur sekali.", ru: "Этот ребёнок очень честный." },
    { id: "Saya selalu jujur.", ru: "Я всегда честен." },
    { id: "Tolong jujur kepada saya.", ru: "Пожалуйста, будь со мной честен." },
  ],
  mencuri: [
    { id: "Mereka mencuri uang.", ru: "Они украли деньги." },
    { id: "Jangan mencuri!", ru: "Не воруй!" },
    { id: "Dia mencuri ide saya.", ru: "Он украл мою идею." },
  ],
  menipu: [
    { id: "Dia menipu saya.", ru: "Он обманул меня." },
    { id: "Jangan menipu orang.", ru: "Не обманывай людей." },
    { id: "Mereka menipu pelanggan.", ru: "Они обманывают клиентов." },
  ],
  mengundang: [
    { id: "Saya mengundang teman ke rumah.", ru: "Я приглашаю друга домой." },
    { id: "Mereka mengundang kami ke pesta.", ru: "Они пригласили нас на вечеринку." },
    { id: "Tolong mengundang dia juga.", ru: "Пожалуйста, пригласи и его." },
  ],
  menolak: [
    { id: "Saya menolak ajakannya.", ru: "Я отказался от его приглашения." },
    { id: "Dia menolak makanan.", ru: "Он отказался от еды." },
    { id: "Tolong jangan menolak.", ru: "Пожалуйста, не отказывайся." },
  ],
  menyetujui: [
    { id: "Saya menyetujui rencana ini.", ru: "Я согласен с этим планом." },
    { id: "Dia menyetujui semua syarat.", ru: "Он согласился со всеми условиями." },
    { id: "Mereka menyetujui kontrak.", ru: "Они подписали контракт." },
  ],
  setuju: [
    { id: "Saya setuju dengan kamu.", ru: "Я с тобой согласен." },
    { id: "Apa kamu setuju?", ru: "Ты согласен?" },
    { id: "Mereka tidak setuju.", ru: "Они не согласны." },
  ],
  mengizinkan: [
    { id: "Ibu mengizinkan saya pergi.", ru: "Мама разрешила мне пойти." },
    { id: "Tolong mengizinkan dia masuk.", ru: "Пожалуйста, позвольте ему войти." },
    { id: "Dia tidak mengizinkan saya.", ru: "Он мне не позволил." },
  ],
  melarang: [
    { id: "Ayah melarang saya pulang malam.", ru: "Папа запрещает мне поздно возвращаться." },
    { id: "Tolong jangan melarang dia.", ru: "Пожалуйста, не запрещай ему." },
    { id: "Mereka melarang kami masuk.", ru: "Они не пускают нас." },
  ],
  memesan: [
    { id: "Saya memesan makanan.", ru: "Я заказываю еду." },
    { id: "Dia memesan kamar hotel.", ru: "Он бронирует номер в отеле." },
    { id: "Tolong memesan dua kopi.", ru: "Закажи, пожалуйста, два кофе." },
  ],
  pesan: [
    { id: "Mau pesan apa?", ru: "Что закажете?" },
    { id: "Saya pesan nasi goreng.", ru: "Я заказываю жареный рис." },
    { id: "Tolong pesan tiket.", ru: "Пожалуйста, закажи билет." },
  ],
  mengirimkan: [
    { id: "Saya mengirimkan email tadi.", ru: "Я только что отправил email." },
    { id: "Dia mengirimkan paket.", ru: "Он отправил посылку." },
    { id: "Tolong mengirimkan pesan.", ru: "Пожалуйста, отправь сообщение." },
  ],
  menelpon: [
    { id: "Saya akan menelpon ibu.", ru: "Я позвоню маме." },
    { id: "Dia menelpon setiap hari.", ru: "Он звонит каждый день." },
    { id: "Tolong menelpon dokter.", ru: "Пожалуйста, позвони врачу." },
  ],
  menelepon: [
    { id: "Silakan menelepon ke nomor ini.", ru: "Пожалуйста, позвоните по этому номеру." },
    { id: "Saya menelepon kantor.", ru: "Я звоню в офис." },
    { id: "Dia menelepon kemarin.", ru: "Он звонил вчера." },
  ],
  menjelaskan: [
    { id: "Tolong menjelaskan kepada saya.", ru: "Пожалуйста, объясни мне." },
    { id: "Dia menjelaskan dengan baik.", ru: "Он хорошо объясняет." },
    { id: "Saya menjelaskan situasinya.", ru: "Я объясняю ситуацию." },
  ],
  memilih: [
    { id: "Saya memilih warna merah.", ru: "Я выбираю красный цвет." },
    { id: "Tolong memilih dengan hati-hati.", ru: "Пожалуйста, выбирай осторожно." },
    { id: "Dia memilih mobil itu.", ru: "Он выбрал ту машину." },
  ],
  membayangkan: [
    { id: "Saya membayangkan masa depan.", ru: "Я представляю будущее." },
    { id: "Coba membayangkan pantai itu.", ru: "Попробуй представить тот пляж." },
    { id: "Dia membayangkan rumah baru.", ru: "Он представляет новый дом." },
  ],
  bermimpi: [
    { id: "Saya bermimpi tentang ibu.", ru: "Я видел во сне маму." },
    { id: "Anak-anak bermimpi indah.", ru: "Дети видят сладкие сны." },
    { id: "Dia bermimpi jadi pilot.", ru: "Он мечтает стать пилотом." },
  ],
  menghitung: [
    { id: "Saya menghitung uang.", ru: "Я считаю деньги." },
    { id: "Anak-anak belajar menghitung.", ru: "Дети учатся считать." },
    { id: "Tolong menghitung berapa orang.", ru: "Пожалуйста, посчитай, сколько человек." },
  ],
  menjaga: [
    { id: "Saya menjaga adik.", ru: "Я присматриваю за младшим братом." },
    { id: "Polisi menjaga jalan.", ru: "Полиция охраняет дорогу." },
    { id: "Tolong menjaga kunci.", ru: "Пожалуйста, сохрани ключ." },
  ],
  melindungi: [
    { id: "Ibu melindungi anaknya.", ru: "Мама защищает своего ребёнка." },
    { id: "Hutan melindungi alam.", ru: "Лес охраняет природу." },
    { id: "Tolong melindungi diri sendiri.", ru: "Пожалуйста, защити себя." },
  ],
  menyelamatkan: [
    { id: "Dia menyelamatkan anak hanyut.", ru: "Он спас тонущего ребёнка." },
    { id: "Polisi menyelamatkan kami.", ru: "Полиция нас спасла." },
    { id: "Tolong menyelamatkan kucing ini.", ru: "Пожалуйста, спаси эту кошку." },
  ],
  menyembunyikan: [
    { id: "Saya menyembunyikan kado.", ru: "Я спрятал подарок." },
    { id: "Anak itu menyembunyikan permen.", ru: "Этот ребёнок спрятал конфеты." },
    { id: "Jangan menyembunyikan kebenaran.", ru: "Не скрывай правду." },
  ],
  berhenti: [
    { id: "Bus berhenti di halte.", ru: "Автобус останавливается на остановке." },
    { id: "Saya berhenti merokok.", ru: "Я бросил курить." },
    { id: "Tolong berhenti sebentar.", ru: "Пожалуйста, остановись на минутку." },
  ],
  melanjutkan: [
    { id: "Saya melanjutkan pekerjaan.", ru: "Я продолжаю работу." },
    { id: "Tolong melanjutkan ceritanya.", ru: "Пожалуйста, продолжи рассказ." },
    { id: "Dia melanjutkan kuliah.", ru: "Он продолжает учёбу в вузе." },
  ],
  lanjut: [
    { id: "Lanjut, jangan berhenti!", ru: "Продолжай, не останавливайся!" },
    { id: "Saya lanjut belajar besok.", ru: "Я продолжу учиться завтра." },
    { id: "Mari lanjut kerja.", ru: "Давайте продолжим работу." },
  ],
};

const data = JSON.parse(fs.readFileSync(file, "utf8"));
let added = 0;
let missing = [];
for (const word of data.words) {
  if (E[word.id] && !word.examples) {
    word.examples = E[word.id];
    added++;
  } else if (!E[word.id]) {
    missing.push(word.id);
  }
}
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`Added examples to ${added} verbs (out of ${data.words.length})`);
if (missing.length) {
  console.log(`Missing examples for: ${missing.join(", ")}`);
}

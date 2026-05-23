// Партия 2: numbers, calendar, time, colors, adverbs, phrases-courtesy, phrases-conversation
// Запуск: node scripts/add-examples-batch2.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOCAB_DIR = path.join(__dirname, "..", "data", "vocab");

const BY_SET = {
  numbers: {
    "nol": [
      { id: "Nol derajat Celsius.", ru: "Ноль градусов Цельсия." },
      { id: "Nilai saya nol.", ru: "Моя оценка — ноль." },
      { id: "Mulai dari nol.", ru: "Начнём с нуля." },
    ],
    "satu": [
      { id: "Tunggu satu jam.", ru: "Подожди один час." },
      { id: "Beli satu apel.", ru: "Купи одно яблоко." },
      { id: "Hanya satu kesempatan.", ru: "Только один шанс." },
    ],
    "dua": [
      { id: "Ada dua orang di sini.", ru: "Здесь два человека." },
      { id: "Dua jam lagi.", ru: "Ещё два часа." },
      { id: "Beli dua kopi.", ru: "Купи два кофе." },
    ],
    "tiga": [
      { id: "Saya punya tiga anak.", ru: "У меня трое детей." },
      { id: "Tunggu tiga menit.", ru: "Подожди три минуты." },
      { id: "Tiga kali sehari.", ru: "Три раза в день." },
    ],
    "empat": [
      { id: "Ada empat kursi.", ru: "Тут четыре стула." },
      { id: "Empat hari libur.", ru: "Четыре выходных дня." },
      { id: "Empat orang datang.", ru: "Пришли четыре человека." },
    ],
    "lima": [
      { id: "Tunggu lima menit.", ru: "Подожди пять минут." },
      { id: "Lima ribu rupiah.", ru: "Пять тысяч рупий." },
      { id: "Saya ada lima kelas.", ru: "У меня пять занятий." },
    ],
    "enam": [
      { id: "Saya beli enam buku.", ru: "Я купил шесть книг." },
      { id: "Enam jam tidur.", ru: "Шесть часов сна." },
      { id: "Enam orang di kantor.", ru: "Шесть человек в офисе." },
    ],
    "tujuh": [
      { id: "Seminggu tujuh hari.", ru: "В неделе семь дней." },
      { id: "Saya bangun jam tujuh.", ru: "Я встаю в семь." },
      { id: "Tujuh tahun lalu.", ru: "Семь лет назад." },
    ],
    "delapan": [
      { id: "Delapan jam kerja.", ru: "Восемь часов работы." },
      { id: "Delapan ribu rupiah.", ru: "Восемь тысяч рупий." },
      { id: "Anak saya delapan tahun.", ru: "Моему ребёнку восемь лет." },
    ],
    "sembilan": [
      { id: "Sembilan jam perjalanan.", ru: "Девять часов в дороге." },
      { id: "Sembilan tahun pengalaman.", ru: "Девять лет опыта." },
      { id: "Ada sembilan orang.", ru: "Девять человек." },
    ],
    "sepuluh": [
      { id: "Sepuluh menit lagi.", ru: "Ещё десять минут." },
      { id: "Sepuluh ribu rupiah.", ru: "Десять тысяч рупий." },
      { id: "Sepuluh tahun bersama.", ru: "Десять лет вместе." },
    ],
    "sebelas": [
      { id: "Tim sepak bola sebelas orang.", ru: "Футбольная команда — одиннадцать человек." },
      { id: "Sebelas jam tidur.", ru: "Одиннадцать часов сна." },
      { id: "Anak saya sebelas tahun.", ru: "Моему ребёнку одиннадцать." },
    ],
    "dua belas": [
      { id: "Dua belas bulan setahun.", ru: "Двенадцать месяцев в году." },
      { id: "Dua belas jam.", ru: "Двенадцать часов." },
      { id: "Pukul dua belas siang.", ru: "Двенадцать часов дня." },
    ],
    "tiga belas": [
      { id: "Umur tiga belas tahun.", ru: "Возраст тринадцать лет." },
      { id: "Tiga belas orang datang.", ru: "Пришли тринадцать человек." },
      { id: "Lantai tiga belas.", ru: "Тринадцатый этаж." },
    ],
    "empat belas": [
      { id: "Empat belas hari.", ru: "Четырнадцать дней." },
      { id: "Empat belas tahun.", ru: "Четырнадцать лет." },
      { id: "Empat belas pelajar di kelas.", ru: "Четырнадцать учеников в классе." },
    ],
    "lima belas": [
      { id: "Lima belas menit lagi.", ru: "Ещё пятнадцать минут." },
      { id: "Lima belas tahun yang lalu.", ru: "Пятнадцать лет назад." },
      { id: "Pukul lima belas.", ru: "Пятнадцать часов." },
    ],
    "enam belas": [
      { id: "Umur enam belas tahun.", ru: "Шестнадцать лет." },
      { id: "Enam belas hari libur.", ru: "Шестнадцать выходных дней." },
      { id: "Enam belas orang di rapat.", ru: "Шестнадцать человек на собрании." },
    ],
    "tujuh belas": [
      { id: "Tujuh belas Agustus hari kemerdekaan.", ru: "Семнадцатое августа — день независимости." },
      { id: "Umur tujuh belas tahun.", ru: "Семнадцать лет." },
      { id: "Tujuh belas orang menang.", ru: "Семнадцать человек выиграли." },
    ],
    "delapan belas": [
      { id: "Delapan belas tahun dewasa.", ru: "В восемнадцать — совершеннолетие." },
      { id: "Delapan belas hari.", ru: "Восемнадцать дней." },
      { id: "Delapan belas kursi tersedia.", ru: "Доступно восемнадцать мест." },
    ],
    "sembilan belas": [
      { id: "Umur sembilan belas tahun.", ru: "Девятнадцать лет." },
      { id: "Sembilan belas orang lulus.", ru: "Девятнадцать человек сдали." },
      { id: "Sembilan belas hari libur.", ru: "Девятнадцать выходных." },
    ],
    "dua puluh": [
      { id: "Dua puluh ribu rupiah.", ru: "Двадцать тысяч рупий." },
      { id: "Dua puluh menit lagi.", ru: "Ещё двадцать минут." },
      { id: "Dua puluh tahun pernikahan.", ru: "Двадцать лет в браке." },
    ],
    "tiga puluh": [
      { id: "Tiga puluh hari sebulan.", ru: "Тридцать дней в месяце." },
      { id: "Tiga puluh ribu rupiah.", ru: "Тридцать тысяч рупий." },
      { id: "Tiga puluh menit jalan kaki.", ru: "Тридцать минут пешком." },
    ],
    "empat puluh": [
      { id: "Umur empat puluh tahun.", ru: "Сорок лет." },
      { id: "Empat puluh derajat panas.", ru: "Сорок градусов жары." },
      { id: "Empat puluh ribu rupiah.", ru: "Сорок тысяч рупий." },
    ],
    "lima puluh": [
      { id: "Diskon lima puluh persen.", ru: "Скидка пятьдесят процентов." },
      { id: "Lima puluh ribu rupiah.", ru: "Пятьдесят тысяч рупий." },
      { id: "Lima puluh tahun bersama.", ru: "Пятьдесят лет вместе." },
    ],
    "enam puluh": [
      { id: "Enam puluh menit sejam.", ru: "Шестьдесят минут в часе." },
      { id: "Umur enam puluh tahun.", ru: "Шестьдесят лет." },
      { id: "Enam puluh ribu rupiah.", ru: "Шестьдесят тысяч рупий." },
    ],
    "tujuh puluh": [
      { id: "Tujuh puluh kilometer per jam.", ru: "Семьдесят километров в час." },
      { id: "Kakek umur tujuh puluh tahun.", ru: "Дедушке семьдесят лет." },
      { id: "Tujuh puluh ribu rupiah.", ru: "Семьдесят тысяч рупий." },
    ],
    "delapan puluh": [
      { id: "Delapan puluh persen lulus.", ru: "Восемьдесят процентов сдали." },
      { id: "Nenek umur delapan puluh tahun.", ru: "Бабушке восемьдесят лет." },
      { id: "Delapan puluh derajat.", ru: "Восемьдесят градусов." },
    ],
    "sembilan puluh": [
      { id: "Sembilan puluh menit.", ru: "Девяносто минут." },
      { id: "Sembilan puluh persen yakin.", ru: "Уверен на девяносто процентов." },
      { id: "Sembilan puluh kilometer dari sini.", ru: "Девяносто километров отсюда." },
    ],
    "seratus": [
      { id: "Seratus ribu rupiah.", ru: "Сто тысяч рупий." },
      { id: "Seratus tahun lalu.", ru: "Сто лет назад." },
      { id: "Seratus persen benar.", ru: "Сто процентов правда." },
    ],
    "dua ratus": [
      { id: "Dua ratus ribu rupiah.", ru: "Двести тысяч рупий." },
      { id: "Dua ratus tahun sejarah.", ru: "Двести лет истории." },
      { id: "Dua ratus kilometer dari sini.", ru: "Двести километров отсюда." },
    ],
    "lima ratus": [
      { id: "Lima ratus ribu rupiah.", ru: "Пятьсот тысяч рупий." },
      { id: "Lima ratus tahun yang lalu.", ru: "Пятьсот лет назад." },
      { id: "Lima ratus orang hadir.", ru: "Присутствуют пятьсот человек." },
    ],
    "seribu": [
      { id: "Seribu rupiah.", ru: "Тысяча рупий." },
      { id: "Saya bilang seribu kali!", ru: "Я говорил тысячу раз!" },
      { id: "Seribu tahun.", ru: "Тысяча лет." },
    ],
    "sepuluh ribu": [
      { id: "Sepuluh ribu rupiah.", ru: "Десять тысяч рупий." },
      { id: "Sepuluh ribu orang menonton.", ru: "Десять тысяч человек смотрели." },
      { id: "Berjalan sepuluh ribu langkah.", ru: "Пройти десять тысяч шагов." },
    ],
    "seratus ribu": [
      { id: "Seratus ribu rupiah.", ru: "Сто тысяч рупий." },
      { id: "Seratus ribu pendukung.", ru: "Сто тысяч сторонников." },
      { id: "Sudah seratus ribu pelanggan.", ru: "Уже сто тысяч клиентов." },
    ],
    "sejuta": [
      { id: "Sejuta rupiah.", ru: "Миллион рупий." },
      { id: "Sejuta penonton di stadion.", ru: "Миллион зрителей на стадионе." },
      { id: "Sejuta bintang di langit.", ru: "Миллион звёзд на небе." },
    ],
    "semiliar": [
      { id: "Semiliar rupiah.", ru: "Миллиард рупий." },
      { id: "Semiliar manusia di Bumi.", ru: "Миллиард людей на Земле." },
      { id: "Semiliar dolar.", ru: "Миллиард долларов." },
    ],
    "pertama": [
      { id: "Hari pertama di sekolah.", ru: "Первый день в школе." },
      { id: "Saya yang pertama datang.", ru: "Я пришёл первым." },
      { id: "Tempat pertama!", ru: "Первое место!" },
    ],
    "kedua": [
      { id: "Pelajaran kedua.", ru: "Второй урок." },
      { id: "Anak kedua saya.", ru: "Мой второй ребёнок." },
      { id: "Untuk kali kedua.", ru: "Во второй раз." },
    ],
    "ketiga": [
      { id: "Bulan ketiga.", ru: "Третий месяц." },
      { id: "Pemenang ketiga.", ru: "Третий призёр." },
      { id: "Hari ketiga liburan.", ru: "Третий день отпуска." },
    ],
    "keempat": [
      { id: "Lantai keempat.", ru: "Четвёртый этаж." },
      { id: "Bulan keempat tahun.", ru: "Четвёртый месяц года." },
      { id: "Untuk kali keempat saya kesini.", ru: "Я здесь в четвёртый раз." },
    ],
    "kelima": [
      { id: "Hari kelima liburan.", ru: "Пятый день отпуска." },
      { id: "Anak kelima.", ru: "Пятый ребёнок." },
      { id: "Pelajaran kelima.", ru: "Пятый урок." },
    ],
    "terakhir": [
      { id: "Hari terakhir di Bali.", ru: "Последний день на Бали." },
      { id: "Yang terakhir saja.", ru: "Только последнее." },
      { id: "Saya terakhir datang.", ru: "Я пришёл последним." },
    ],
    "setengah": [
      { id: "Tunggu setengah jam.", ru: "Подожди полчаса." },
      { id: "Setengah kilo apel.", ru: "Полкило яблок." },
      { id: "Setengah harga sale.", ru: "Распродажа за полцены." },
    ],
    "seperempat": [
      { id: "Seperempat jam.", ru: "Четверть часа." },
      { id: "Seperempat kilo.", ru: "Четверть килограмма." },
      { id: "Seperempat pizza saja.", ru: "Только четверть пиццы." },
    ],
    "kali": [
      { id: "Dua kali sehari.", ru: "Два раза в день." },
      { id: "Berapa kali kamu datang?", ru: "Сколько раз ты приходил?" },
      { id: "Beberapa kali saja.", ru: "Всего несколько раз." },
    ],
    "pasang": [
      { id: "Sepasang sepatu baru.", ru: "Пара новой обуви." },
      { id: "Dua pasang kaus kaki.", ru: "Две пары носков." },
      { id: "Pasangan suami istri.", ru: "Супружеская пара." },
    ],
  },

  calendar: {
    "Senin": [
      { id: "Hari Senin saya kerja.", ru: "В понедельник я работаю." },
      { id: "Senin minggu depan.", ru: "В понедельник на следующей неделе." },
      { id: "Mulai hari Senin.", ru: "Начинаем с понедельника." },
    ],
    "Selasa": [
      { id: "Selasa libur sekolah.", ru: "Во вторник в школе выходной." },
      { id: "Selasa malam saya ada rapat.", ru: "Во вторник вечером у меня собрание." },
      { id: "Setiap Selasa saya olahraga.", ru: "Каждый вторник я занимаюсь спортом." },
    ],
    "Rabu": [
      { id: "Hari Rabu hari pasar.", ru: "Среда — день рынка." },
      { id: "Rabu sore saya ada kelas.", ru: "В среду вечером у меня занятие." },
      { id: "Rabu depan saya pergi.", ru: "В следующую среду я уезжаю." },
    ],
    "Kamis": [
      { id: "Kamis pagi saya rapat.", ru: "В четверг утром у меня встреча." },
      { id: "Setiap Kamis saya ke pasar.", ru: "Каждый четверг я хожу на рынок." },
      { id: "Kamis berapa?", ru: "Какого числа четверг?" },
    ],
    "Jumat": [
      { id: "Jumat sore saya pulang awal.", ru: "В пятницу я ухожу пораньше." },
      { id: "Jumat hari ibadah.", ru: "Пятница — день молитвы." },
      { id: "Jumat libur.", ru: "Пятница — выходной." },
    ],
    "Sabtu": [
      { id: "Sabtu malam kami pesta.", ru: "В субботу вечером у нас вечеринка." },
      { id: "Sabtu di rumah saja.", ru: "В субботу просто дома." },
      { id: "Sabtu kemarin saya jalan-jalan.", ru: "В прошлую субботу я гулял." },
    ],
    "Minggu": [
      { id: "Hari Minggu istirahat.", ru: "В воскресенье отдыхаю." },
      { id: "Minggu depan kita bertemu.", ru: "Встретимся на следующей неделе." },
      { id: "Setiap minggu saya ke gereja.", ru: "Каждое воскресенье я хожу в церковь." },
    ],
    "akhir pekan": [
      { id: "Akhir pekan ini saya bebas.", ru: "На этих выходных я свободен." },
      { id: "Akhir pekan saya jalan-jalan.", ru: "На выходных я гуляю." },
      { id: "Selamat akhir pekan!", ru: "Хороших выходных!" },
    ],
    "Januari": [
      { id: "Bulan Januari dingin.", ru: "Январь — холодный месяц." },
      { id: "Saya lahir di Januari.", ru: "Я родился в январе." },
      { id: "Januari tahun lalu.", ru: "В январе прошлого года." },
    ],
    "Februari": [
      { id: "Februari bulan terpendek.", ru: "Февраль — самый короткий месяц." },
      { id: "Valentine di bulan Februari.", ru: "День Валентина в феврале." },
      { id: "Februari hujan terus.", ru: "В феврале постоянно дождь." },
    ],
    "Maret": [
      { id: "Maret mulai musim semi.", ru: "В марте начинается весна." },
      { id: "Bulan Maret hangat.", ru: "Март — тёплый месяц." },
      { id: "Awal Maret saya ke Bali.", ru: "В начале марта я еду на Бали." },
    ],
    "April": [
      { id: "Bulan April hujan.", ru: "В апреле дожди." },
      { id: "April mop.", ru: "Первое апреля — день шуток." },
      { id: "Akhir April libur.", ru: "В конце апреля выходные." },
    ],
    "Mei": [
      { id: "Bulan Mei hangat.", ru: "Май — тёплый месяц." },
      { id: "Mei libur panjang.", ru: "В мае длинные выходные." },
      { id: "Awal Mei bunga mekar.", ru: "В начале мая цветут цветы." },
    ],
    "Juni": [
      { id: "Juni mulai musim panas.", ru: "В июне начинается лето." },
      { id: "Bulan Juni libur sekolah.", ru: "В июне школьные каникулы." },
      { id: "Akhir Juni saya pergi.", ru: "В конце июня я уезжаю." },
    ],
    "Juli": [
      { id: "Juli libur panjang.", ru: "В июле длинные каникулы." },
      { id: "Bulan Juli panas.", ru: "Июль — жаркий месяц." },
      { id: "Awal Juli kami ke pantai.", ru: "В начале июля мы поехали на пляж." },
    ],
    "Agustus": [
      { id: "Tujuh belas Agustus Hari Kemerdekaan.", ru: "Семнадцатое августа — День независимости." },
      { id: "Bulan Agustus panas terik.", ru: "Август — палящий жаркий месяц." },
      { id: "Akhir Agustus kembali sekolah.", ru: "В конце августа возвращаемся в школу." },
    ],
    "September": [
      { id: "September mulai sekolah.", ru: "В сентябре начинается школа." },
      { id: "Bulan September musim gugur.", ru: "Сентябрь — осенний месяц." },
      { id: "Akhir September dingin.", ru: "В конце сентября холодно." },
    ],
    "Oktober": [
      { id: "Oktober daun jatuh.", ru: "В октябре падают листья." },
      { id: "Bulan Oktober hujan.", ru: "В октябре дожди." },
      { id: "Awal Oktober masih hangat.", ru: "В начале октября ещё тепло." },
    ],
    "November": [
      { id: "November dingin.", ru: "Ноябрь холодный." },
      { id: "Bulan November singkat.", ru: "Ноябрь короткий." },
      { id: "Akhir November salju pertama.", ru: "В конце ноября первый снег." },
    ],
    "Desember": [
      { id: "Desember libur Natal.", ru: "В декабре рождественские каникулы." },
      { id: "Bulan Desember akhir tahun.", ru: "Декабрь — конец года." },
      { id: "Akhir Desember tahun baru.", ru: "В конце декабря Новый год." },
    ],
    "musim": [
      { id: "Sekarang musim apa?", ru: "Сейчас какое время года?" },
      { id: "Musim ini hujan.", ru: "В этот сезон дождь." },
      { id: "Berganti musim.", ru: "Сменился сезон." },
    ],
    "musim hujan": [
      { id: "Sekarang musim hujan.", ru: "Сейчас сезон дождей." },
      { id: "Musim hujan dingin.", ru: "В сезон дождей холодно." },
      { id: "Bawa payung di musim hujan.", ru: "В сезон дождей бери зонт." },
    ],
    "musim kemarau": [
      { id: "Musim kemarau panas.", ru: "В сухой сезон жарко." },
      { id: "Musim kemarau langit cerah.", ru: "В сухой сезон чистое небо." },
      { id: "Akhir musim kemarau.", ru: "Конец сухого сезона." },
    ],
    "musim panas": [
      { id: "Musim panas saya berenang.", ru: "Летом я плаваю." },
      { id: "Musim panas waktu liburan.", ru: "Лето — время отпусков." },
      { id: "Musim panas Eropa indah.", ru: "Лето в Европе прекрасно." },
    ],
    "musim dingin": [
      { id: "Musim dingin pakai jaket.", ru: "Зимой надо носить куртку." },
      { id: "Musim dingin Rusia keras.", ru: "Зима в России суровая." },
      { id: "Saya tidak suka musim dingin.", ru: "Я не люблю зиму." },
    ],
    "musim semi": [
      { id: "Musim semi indah.", ru: "Весна прекрасна." },
      { id: "Bunga mekar musim semi.", ru: "Весной цветут цветы." },
      { id: "Musim semi April.", ru: "Весна в апреле." },
    ],
    "musim gugur": [
      { id: "Musim gugur daun jatuh.", ru: "Осенью падают листья." },
      { id: "Musim gugur indah.", ru: "Осень красива." },
      { id: "Musim gugur September.", ru: "Осень в сентябре." },
    ],
  },

  time: {
    "waktu": [
      { id: "Waktu cepat berlalu.", ru: "Время быстро летит." },
      { id: "Tidak ada waktu.", ru: "Времени нет." },
      { id: "Berapa banyak waktu?", ru: "Сколько времени?" },
    ],
    "jam": [
      { id: "Sekarang jam berapa?", ru: "Который сейчас час?" },
      { id: "Tunggu satu jam.", ru: "Подожди час." },
      { id: "Jam dinding rusak.", ru: "Настенные часы сломались." },
    ],
    "menit": [
      { id: "Tunggu lima menit.", ru: "Подожди пять минут." },
      { id: "Setiap menit penting.", ru: "Каждая минута важна." },
      { id: "Sebentar, satu menit.", ru: "Секундочку, одну минуту." },
    ],
    "detik": [
      { id: "Tunggu beberapa detik.", ru: "Подожди несколько секунд." },
      { id: "Setiap detik berharga.", ru: "Каждая секунда дорога." },
      { id: "Tiga detik lagi!", ru: "Ещё три секунды!" },
    ],
    "hari": [
      { id: "Hari ini cerah.", ru: "Сегодня солнечно." },
      { id: "Setiap hari belajar.", ru: "Каждый день учусь." },
      { id: "Hari yang indah!", ru: "Прекрасный день!" },
    ],
    "minggu": [
      { id: "Minggu lalu saya sibuk.", ru: "На прошлой неделе я был занят." },
      { id: "Setiap minggu kami bertemu.", ru: "Каждую неделю мы встречаемся." },
      { id: "Minggu ini panjang.", ru: "Эта неделя долгая." },
    ],
    "bulan": [
      { id: "Bulan ini cepat.", ru: "Этот месяц быстро пролетел." },
      { id: "Bulan lalu saya sakit.", ru: "В прошлом месяце я болел." },
      { id: "Bulan purnama indah.", ru: "Полная луна красива." },
    ],
    "tahun": [
      { id: "Tahun ini lebih baik.", ru: "Этот год лучше." },
      { id: "Tahun lalu saya menikah.", ru: "В прошлом году я женился." },
      { id: "Selamat tahun baru!", ru: "С Новым годом!" },
    ],
    "abad": [
      { id: "Abad ke-21.", ru: "Двадцать первый век." },
      { id: "Abad lalu sejarah.", ru: "Прошлый век — история." },
      { id: "Setengah abad lalu.", ru: "Полвека назад." },
    ],
    "zaman": [
      { id: "Zaman dahulu.", ru: "В старые времена." },
      { id: "Zaman modern.", ru: "Современная эпоха." },
      { id: "Zaman sudah berubah.", ru: "Времена изменились." },
    ],
    "masa": [
      { id: "Masa kecil saya bahagia.", ru: "Моё детство было счастливым." },
      { id: "Masa sulit sudah lewat.", ru: "Тяжёлые времена прошли." },
      { id: "Masa indah bersamamu.", ru: "Прекрасное время с тобой." },
    ],
    "sekarang": [
      { id: "Sekarang jam berapa?", ru: "Сейчас сколько времени?" },
      { id: "Mari kita pergi sekarang.", ru: "Пойдём прямо сейчас." },
      { id: "Sekarang saya sibuk.", ru: "Сейчас я занят." },
    ],
    "nanti": [
      { id: "Nanti saya telepon.", ru: "Я позвоню позже." },
      { id: "Sampai nanti!", ru: "До встречи!" },
      { id: "Nanti malam saja.", ru: "Лучше попозже вечером." },
    ],
    "tadi": [
      { id: "Tadi saya bertemu Andi.", ru: "Только что я встретил Анди." },
      { id: "Apa yang tadi kamu bilang?", ru: "Что ты только что сказал?" },
      { id: "Tadi pagi saya bangun jam enam.", ru: "Сегодня утром я встал в шесть." },
    ],
    "dulu": [
      { id: "Dulu di sini ada toko.", ru: "Раньше здесь был магазин." },
      { id: "Saya dulu tinggal di Moskow.", ru: "Я раньше жил в Москве." },
      { id: "Tunggu dulu!", ru: "Подожди-ка!" },
    ],
    "dahulu": [
      { id: "Dahulu kala hidup raja.", ru: "Давным-давно жил король." },
      { id: "Zaman dahulu.", ru: "В давние времена." },
      { id: "Dahulu rumah ini kecil.", ru: "Раньше этот дом был маленьким." },
    ],
    "kemarin": [
      { id: "Kemarin saya di rumah.", ru: "Вчера я был дома." },
      { id: "Apa kabar kemarin?", ru: "Как вчера прошло?" },
      { id: "Kemarin saya bertemu dia.", ru: "Вчера я его встретил." },
    ],
    "hari ini": [
      { id: "Hari ini saya libur.", ru: "Сегодня у меня выходной." },
      { id: "Apa rencana hari ini?", ru: "Какие планы на сегодня?" },
      { id: "Hari ini panas sekali.", ru: "Сегодня очень жарко." },
    ],
    "besok": [
      { id: "Besok kita bertemu.", ru: "Завтра увидимся." },
      { id: "Besok hari Senin.", ru: "Завтра понедельник." },
      { id: "Sampai besok!", ru: "До завтра!" },
    ],
    "lusa": [
      { id: "Lusa saya berangkat.", ru: "Послезавтра я уезжаю." },
      { id: "Sampai lusa!", ru: "До послезавтра!" },
      { id: "Lusa hari libur.", ru: "Послезавтра выходной." },
    ],
    "pagi": [
      { id: "Saya bangun pagi.", ru: "Я встал утром." },
      { id: "Pagi yang cerah.", ru: "Солнечное утро." },
      { id: "Sampai pagi.", ru: "До утра." },
    ],
    "siang": [
      { id: "Siang sekarang.", ru: "Сейчас день." },
      { id: "Makan siang di kantor.", ru: "Обедаю в офисе." },
      { id: "Pukul dua siang.", ru: "Два часа дня." },
    ],
    "sore": [
      { id: "Sore yang sejuk.", ru: "Прохладный вечер." },
      { id: "Saya pulang sore.", ru: "Я возвращаюсь вечером." },
      { id: "Sore ini ada rapat.", ru: "Сегодня вечером собрание." },
    ],
    "malam": [
      { id: "Malam yang dingin.", ru: "Холодная ночь." },
      { id: "Selamat malam.", ru: "Доброй ночи." },
      { id: "Malam ini hujan.", ru: "Сегодня ночью дождь." },
    ],
    "subuh": [
      { id: "Bangun pada subuh.", ru: "Просыпаюсь на рассвете." },
      { id: "Subuh masih gelap.", ru: "На рассвете ещё темно." },
      { id: "Sholat subuh.", ru: "Утренняя молитва." },
    ],
    "senja": [
      { id: "Senja indah di pantai.", ru: "Закат прекрасен на пляже." },
      { id: "Pulang sebelum senja.", ru: "Вернись до заката." },
      { id: "Warna senja merah.", ru: "Цвет заката красный." },
    ],
    "tengah hari": [
      { id: "Tengah hari panas.", ru: "В полдень жарко." },
      { id: "Makan tengah hari.", ru: "Обед в полдень." },
      { id: "Sampai tengah hari.", ru: "До полудня." },
    ],
    "tengah malam": [
      { id: "Tengah malam saya tidur.", ru: "В полночь я уже сплю." },
      { id: "Pesta sampai tengah malam.", ru: "Вечеринка до полуночи." },
      { id: "Tengah malam sudah lewat.", ru: "Уже за полночь." },
    ],
    "saat ini": [
      { id: "Saat ini saya sibuk.", ru: "В данный момент я занят." },
      { id: "Saat ini cuaca cerah.", ru: "Сейчас погода ясная." },
      { id: "Saat ini lebih baik.", ru: "Сейчас лучше." },
    ],
    "masa depan": [
      { id: "Masa depan cerah.", ru: "Будущее светлое." },
      { id: "Pikirkan masa depan.", ru: "Думай о будущем." },
      { id: "Saya percaya masa depan.", ru: "Я верю в будущее." },
    ],
    "masa lalu": [
      { id: "Masa lalu sudah berlalu.", ru: "Прошлое прошло." },
      { id: "Jangan ingat masa lalu.", ru: "Не вспоминай прошлое." },
      { id: "Masa lalu pengalaman.", ru: "Прошлое — это опыт." },
    ],
    "minggu lalu": [
      { id: "Minggu lalu saya sibuk.", ru: "На прошлой неделе я был занят." },
      { id: "Minggu lalu hujan.", ru: "На прошлой неделе шёл дождь." },
      { id: "Minggu lalu saya bertemu dia.", ru: "На прошлой неделе я встретил его." },
    ],
    "minggu depan": [
      { id: "Minggu depan saya libur.", ru: "На следующей неделе у меня выходной." },
      { id: "Minggu depan kita bertemu.", ru: "Встретимся на следующей неделе." },
      { id: "Minggu depan saya pergi.", ru: "На следующей неделе я уеду." },
    ],
    "bulan lalu": [
      { id: "Bulan lalu saya sakit.", ru: "В прошлом месяце я болел." },
      { id: "Bulan lalu ulang tahun.", ru: "В прошлом месяце был день рождения." },
      { id: "Bulan lalu hujan terus.", ru: "В прошлом месяце постоянно дождь." },
    ],
    "bulan depan": [
      { id: "Bulan depan saya menikah.", ru: "В следующем месяце я женюсь." },
      { id: "Bulan depan liburan.", ru: "В следующем месяце отпуск." },
      { id: "Bulan depan kita pindah.", ru: "В следующем месяце мы переезжаем." },
    ],
    "tahun lalu": [
      { id: "Tahun lalu saya ke Bali.", ru: "В прошлом году я был на Бали." },
      { id: "Tahun lalu lebih baik.", ru: "Прошлый год был лучше." },
      { id: "Tahun lalu saya lulus.", ru: "В прошлом году я выпустился." },
    ],
    "tahun depan": [
      { id: "Tahun depan saya pindah.", ru: "В следующем году я переезжаю." },
      { id: "Tahun depan saya 30 tahun.", ru: "В следующем году мне будет 30." },
      { id: "Tahun depan akan lebih baik.", ru: "Следующий год будет лучше." },
    ],
    "baru-baru ini": [
      { id: "Baru-baru ini saya sakit.", ru: "Я недавно болел." },
      { id: "Baru-baru ini hujan terus.", ru: "В последнее время постоянно дождь." },
      { id: "Baru-baru ini cuaca dingin.", ru: "В последнее время холодно." },
    ],
    "akhir-akhir ini": [
      { id: "Akhir-akhir ini saya lelah.", ru: "В последнее время я устаю." },
      { id: "Akhir-akhir ini sibuk.", ru: "Последнее время занят." },
      { id: "Akhir-akhir ini banyak masalah.", ru: "Последнее время много проблем." },
    ],
    "sebentar": [
      { id: "Tunggu sebentar.", ru: "Подожди минутку." },
      { id: "Sebentar saja.", ru: "Совсем недолго." },
      { id: "Saya pergi sebentar.", ru: "Я отойду ненадолго." },
    ],
    "sebentar lagi": [
      { id: "Sebentar lagi sampai.", ru: "Скоро приедем." },
      { id: "Sebentar lagi makan malam.", ru: "Скоро ужин." },
      { id: "Sebentar lagi selesai.", ru: "Скоро закончу." },
    ],
    "segera": [
      { id: "Segera saya datang.", ru: "Сейчас же приду." },
      { id: "Segera mungkin.", ru: "Как можно скорее." },
      { id: "Segera setelah selesai.", ru: "Сразу как закончу." },
    ],
    "buru-buru": [
      { id: "Maaf, saya buru-buru.", ru: "Извини, я тороплюсь." },
      { id: "Jangan buru-buru.", ru: "Не торопись." },
      { id: "Dia buru-buru pergi.", ru: "Он спешно ушёл." },
    ],
    "awal": [
      { id: "Awal bulan.", ru: "Начало месяца." },
      { id: "Awal yang baik.", ru: "Хорошее начало." },
      { id: "Dari awal lagi.", ru: "Сначала." },
    ],
    "akhir": [
      { id: "Akhir tahun.", ru: "Конец года." },
      { id: "Akhir cerita.", ru: "Конец истории." },
      { id: "Akhirnya selesai.", ru: "Наконец закончилось." },
    ],
    "pertengahan": [
      { id: "Pertengahan bulan.", ru: "Середина месяца." },
      { id: "Pertengahan jalan.", ru: "Середина дороги." },
      { id: "Sampai pertengahan film.", ru: "До середины фильма." },
    ],
    "sering": [
      { id: "Saya sering ke pasar.", ru: "Я часто хожу на рынок." },
      { id: "Dia sering terlambat.", ru: "Он часто опаздывает." },
      { id: "Apa kamu sering datang?", ru: "Ты часто приходишь?" },
    ],
    "jarang": [
      { id: "Saya jarang minum kopi.", ru: "Я редко пью кофе." },
      { id: "Dia jarang tersenyum.", ru: "Он редко улыбается." },
      { id: "Jarang sekali bertemu.", ru: "Очень редко встречаемся." },
    ],
    "kadang-kadang": [
      { id: "Kadang-kadang saya menangis.", ru: "Иногда я плачу." },
      { id: "Dia kadang-kadang datang.", ru: "Он иногда приходит." },
      { id: "Kadang-kadang hujan.", ru: "Иногда дождь." },
    ],
    "selalu": [
      { id: "Saya selalu cinta kamu.", ru: "Я всегда буду любить тебя." },
      { id: "Dia selalu terlambat.", ru: "Он всегда опаздывает." },
      { id: "Selalu ada harapan.", ru: "Всегда есть надежда." },
    ],
    "tidak pernah": [
      { id: "Saya tidak pernah ke Bali.", ru: "Я никогда не был на Бали." },
      { id: "Dia tidak pernah berbohong.", ru: "Он никогда не врёт." },
      { id: "Tidak pernah terlambat.", ru: "Никогда не опаздывает." },
    ],
    "biasanya": [
      { id: "Biasanya saya bangun jam tujuh.", ru: "Обычно я встаю в семь." },
      { id: "Biasanya tidak ada masalah.", ru: "Обычно проблем нет." },
      { id: "Biasanya dia datang sore.", ru: "Обычно он приходит вечером." },
    ],
  },

  colors: {
    "warna": [
      { id: "Warna apa kesukaanmu?", ru: "Какой твой любимый цвет?" },
      { id: "Banyak warna di pasar.", ru: "На рынке много цветов." },
      { id: "Warna ini bagus.", ru: "Этот цвет красивый." },
    ],
    "merah": [
      { id: "Bendera Indonesia merah putih.", ru: "Флаг Индонезии красно-белый." },
      { id: "Mobil merah itu cepat.", ru: "Та красная машина быстрая." },
      { id: "Bunga merah indah.", ru: "Красные цветы красивые." },
    ],
    "hijau": [
      { id: "Daun hijau di pohon.", ru: "Зелёные листья на дереве." },
      { id: "Lampu hijau, jalan!", ru: "Зелёный свет, идём!" },
      { id: "Tanaman hijau segar.", ru: "Зелёные растения свежие." },
    ],
    "biru": [
      { id: "Langit biru cerah.", ru: "Голубое небо ясное." },
      { id: "Laut biru luas.", ru: "Синее море широкое." },
      { id: "Saya suka biru.", ru: "Мне нравится синий." },
    ],
    "kuning": [
      { id: "Matahari kuning terang.", ru: "Солнце ярко-жёлтое." },
      { id: "Pisang kuning manis.", ru: "Жёлтые бананы сладкие." },
      { id: "Saya beli baju kuning.", ru: "Я купил жёлтую рубашку." },
    ],
    "hitam": [
      { id: "Kucing hitam itu cantik.", ru: "Та чёрная кошка красивая." },
      { id: "Rambut hitam panjang.", ru: "Длинные чёрные волосы." },
      { id: "Mobil hitam mahal.", ru: "Чёрная машина дорогая." },
    ],
    "putih": [
      { id: "Salju putih bersih.", ru: "Снег белый и чистый." },
      { id: "Baju putih bersih.", ru: "Белая рубашка чистая." },
      { id: "Susu putih.", ru: "Молоко белое." },
    ],
    "abu-abu": [
      { id: "Langit abu-abu hari ini.", ru: "Сегодня небо серое." },
      { id: "Kucing abu-abu lucu.", ru: "Серая кошка милая." },
      { id: "Saya pakai jaket abu-abu.", ru: "Я в серой куртке." },
    ],
    "ungu": [
      { id: "Bunga ungu di taman.", ru: "Фиолетовые цветы в саду." },
      { id: "Saya suka warna ungu.", ru: "Мне нравится фиолетовый." },
      { id: "Anggur ungu.", ru: "Фиолетовый виноград." },
    ],
    "oranye": [
      { id: "Jeruk oranye segar.", ru: "Оранжевые апельсины свежие." },
      { id: "Senja oranye indah.", ru: "Оранжевый закат красив." },
      { id: "Baju oranye terang.", ru: "Оранжевая одежда яркая." },
    ],
    "jingga": [
      { id: "Langit jingga waktu senja.", ru: "Небо оранжевое на закате." },
      { id: "Bunga jingga indah.", ru: "Оранжевый цветок красив." },
      { id: "Warna jingga hangat.", ru: "Оранжевый цвет тёплый." },
    ],
    "merah muda": [
      { id: "Baju merah muda lucu.", ru: "Розовая одежда милая." },
      { id: "Bunga merah muda harum.", ru: "Розовые цветы душистые." },
      { id: "Anak perempuan suka merah muda.", ru: "Девочки любят розовый." },
    ],
    "perak": [
      { id: "Cincin perak.", ru: "Серебряное кольцо." },
      { id: "Medali perak.", ru: "Серебряная медаль." },
      { id: "Mobil perak mengkilap.", ru: "Серебристая машина блестит." },
    ],
    "emas": [
      { id: "Cincin emas mahal.", ru: "Золотое кольцо дорогое." },
      { id: "Medali emas juara.", ru: "Золотая медаль чемпиона." },
      { id: "Matahari emas senja.", ru: "Золотое солнце на закате." },
    ],
  },

  adverbs: {
    "sangat": [
      { id: "Saya sangat lelah.", ru: "Я очень устал." },
      { id: "Makanan ini sangat enak.", ru: "Эта еда очень вкусная." },
      { id: "Sangat dingin di luar.", ru: "На улице очень холодно." },
    ],
    "sekali": [
      { id: "Indah sekali!", ru: "Очень красиво!" },
      { id: "Sedih sekali.", ru: "Очень грустно." },
      { id: "Terima kasih sekali.", ru: "Большое спасибо." },
    ],
    "amat": [
      { id: "Amat penting bagi saya.", ru: "Крайне важно для меня." },
      { id: "Amat sangat baik.", ru: "Крайне хорошо." },
      { id: "Amat berbahaya.", ru: "Крайне опасно." },
    ],
    "terlalu": [
      { id: "Terlalu mahal.", ru: "Слишком дорого." },
      { id: "Jangan terlalu cepat.", ru: "Не слишком быстро." },
      { id: "Terlalu banyak gula.", ru: "Слишком много сахара." },
    ],
    "agak": [
      { id: "Saya agak lelah.", ru: "Я немного устал." },
      { id: "Agak dingin hari ini.", ru: "Сегодня немного холодно." },
      { id: "Agak mahal, tapi bagus.", ru: "Немного дорого, но хорошо." },
    ],
    "lebih": [
      { id: "Lebih baik begitu.", ru: "Лучше так." },
      { id: "Saya lebih suka teh.", ru: "Я больше люблю чай." },
      { id: "Lebih cepat lebih baik.", ru: "Чем быстрее, тем лучше." },
    ],
    "paling": [
      { id: "Paling enak di sini.", ru: "Самое вкусное тут." },
      { id: "Paling murah.", ru: "Самое дешёвое." },
      { id: "Saya paling suka kopi.", ru: "Больше всего я люблю кофе." },
    ],
    "lebih baik": [
      { id: "Lebih baik tidur sekarang.", ru: "Лучше сейчас лечь спать." },
      { id: "Ini lebih baik dari itu.", ru: "Это лучше того." },
      { id: "Lebih baik diam.", ru: "Лучше промолчать." },
    ],
    "paling baik": [
      { id: "Yang paling baik.", ru: "Самый лучший." },
      { id: "Paling baik dari semuanya.", ru: "Лучший из всех." },
      { id: "Pilih yang paling baik.", ru: "Выбери лучший." },
    ],
    "sama": [
      { id: "Kami sama.", ru: "Мы одинаковые." },
      { id: "Harga sama dengan kemarin.", ru: "Цена такая же, как вчера." },
      { id: "Sama saja bagi saya.", ru: "Мне всё равно." },
    ],
    "berbeda": [
      { id: "Kami berbeda.", ru: "Мы разные." },
      { id: "Pendapat saya berbeda.", ru: "Моё мнение другое." },
      { id: "Hari ini berbeda dari kemarin.", ru: "Сегодня иначе, чем вчера." },
    ],
    "beda": [
      { id: "Apa bedanya?", ru: "Какая разница?" },
      { id: "Tidak ada beda.", ru: "Никакой разницы." },
      { id: "Beda jauh.", ru: "Большая разница." },
    ],
    "mirip": [
      { id: "Kami mirip.", ru: "Мы похожи." },
      { id: "Anak mirip ibunya.", ru: "Ребёнок похож на маму." },
      { id: "Cerita yang mirip.", ru: "Похожая история." },
    ],
    "khusus": [
      { id: "Hari ini khusus.", ru: "Сегодня особый день." },
      { id: "Hadiah khusus untukmu.", ru: "Особый подарок для тебя." },
      { id: "Khusus pelanggan.", ru: "Только для клиентов." },
    ],
    "umum": [
      { id: "Pendapat umum.", ru: "Общее мнение." },
      { id: "Pengetahuan umum.", ru: "Общее знание." },
      { id: "Sangat umum di sini.", ru: "Здесь очень распространено." },
    ],
    "khas": [
      { id: "Makanan khas Indonesia.", ru: "Традиционная индонезийская еда." },
      { id: "Bau khas pasar.", ru: "Характерный запах рынка." },
      { id: "Suara khas kucing.", ru: "Характерный кошачий звук." },
    ],
    "spesial": [
      { id: "Hari spesial.", ru: "Особый день." },
      { id: "Menu spesial hari ini.", ru: "Спецменю сегодня." },
      { id: "Untukmu spesial.", ru: "Специально для тебя." },
    ],
    "bersama": [
      { id: "Kami bersama.", ru: "Мы вместе." },
      { id: "Makan bersama keluarga.", ru: "Едим всей семьёй." },
      { id: "Pergi bersama saya.", ru: "Пойдём со мной." },
    ],
    "sendiri": [
      { id: "Saya pergi sendiri.", ru: "Я иду один." },
      { id: "Buat sendiri.", ru: "Сделай сам." },
      { id: "Dia tinggal sendiri.", ru: "Он живёт один." },
    ],
    "sendirian": [
      { id: "Jangan sendirian.", ru: "Не оставайся один." },
      { id: "Saya sendirian di rumah.", ru: "Я один дома." },
      { id: "Anak itu menangis sendirian.", ru: "Ребёнок плачет в одиночестве." },
    ],
  },

  "phrases-courtesy": {
    "halo": [
      { id: "Halo, apa kabar?", ru: "Привет, как дела?" },
      { id: "Halo, nama saya Andrei.", ru: "Привет, меня зовут Андрей." },
      { id: "Halo, lama tidak bertemu!", ru: "Привет, давно не виделись!" },
    ],
    "hai": [
      { id: "Hai, semua!", ru: "Привет всем!" },
      { id: "Hai, apa kabar?", ru: "Хай, как дела?" },
      { id: "Hai, senang bertemu.", ru: "Привет, рад встрече." },
    ],
    "selamat pagi": [
      { id: "Selamat pagi, Pak.", ru: "Доброе утро, господин." },
      { id: "Selamat pagi semua!", ru: "Доброе утро всем!" },
      { id: "Selamat pagi, mau kopi?", ru: "Доброе утро, кофе будешь?" },
    ],
    "selamat siang": [
      { id: "Selamat siang, Bu.", ru: "Добрый день, госпожа." },
      { id: "Selamat siang, kami sudah datang.", ru: "Добрый день, мы пришли." },
      { id: "Selamat siang, ada yang bisa dibantu?", ru: "Добрый день, чем могу помочь?" },
    ],
    "selamat sore": [
      { id: "Selamat sore, teman-teman.", ru: "Добрый вечер, друзья." },
      { id: "Selamat sore, mau minum teh?", ru: "Добрый вечер, чай будешь?" },
      { id: "Selamat sore dari kantor.", ru: "Добрый вечер из офиса." },
    ],
    "selamat malam": [
      { id: "Selamat malam, sampai besok.", ru: "Доброй ночи, до завтра." },
      { id: "Selamat malam, mimpi indah.", ru: "Доброй ночи, сладких снов." },
      { id: "Selamat malam, anak-anak.", ru: "Доброй ночи, дети." },
    ],
    "selamat datang": [
      { id: "Selamat datang di Bali!", ru: "Добро пожаловать на Бали!" },
      { id: "Selamat datang di rumah kami.", ru: "Добро пожаловать в наш дом." },
      { id: "Selamat datang, silakan masuk.", ru: "Добро пожаловать, проходите." },
    ],
    "selamat tinggal": [
      { id: "Selamat tinggal, sampai jumpa.", ru: "Прощай, до встречи." },
      { id: "Selamat tinggal, terima kasih semua.", ru: "Прощайте, спасибо всем." },
      { id: "Selamat tinggal, jaga diri.", ru: "Прощай, береги себя." },
    ],
    "selamat jalan": [
      { id: "Selamat jalan, hati-hati.", ru: "Счастливого пути, осторожнее." },
      { id: "Selamat jalan, sampai bertemu lagi.", ru: "Счастливого пути, до новой встречи." },
      { id: "Selamat jalan ke Bali!", ru: "Счастливого пути на Бали!" },
    ],
    "selamat tidur": [
      { id: "Selamat tidur, mimpi indah.", ru: "Спокойной ночи, сладких снов." },
      { id: "Selamat tidur, sampai pagi.", ru: "Спокойной ночи, до утра." },
      { id: "Selamat tidur, anak sayang.", ru: "Спокойной ночи, родной." },
    ],
    "selamat makan": [
      { id: "Selamat makan semuanya!", ru: "Приятного аппетита всем!" },
      { id: "Selamat makan, enak?", ru: "Приятного аппетита, вкусно?" },
      { id: "Selamat makan, jangan malu.", ru: "Кушайте, не стесняйтесь." },
    ],
    "selamat ulang tahun": [
      { id: "Selamat ulang tahun!", ru: "С днём рождения!" },
      { id: "Selamat ulang tahun, semoga sukses.", ru: "С днём рождения, удачи!" },
      { id: "Selamat ulang tahun, ini hadiahnya.", ru: "С днём рождения, вот подарок." },
    ],
    "apa kabar": [
      { id: "Halo, apa kabar?", ru: "Привет, как дела?" },
      { id: "Lama tidak bertemu, apa kabar?", ru: "Давно не виделись, как дела?" },
      { id: "Apa kabar keluarga?", ru: "Как семья?" },
    ],
    "baik": [
      { id: "Saya baik, terima kasih.", ru: "У меня хорошо, спасибо." },
      { id: "Anak yang baik.", ru: "Хороший ребёнок." },
      { id: "Cuaca baik hari ini.", ru: "Сегодня хорошая погода." },
    ],
    "baik-baik saja": [
      { id: "Baik-baik saja, terima kasih.", ru: "Всё хорошо, спасибо." },
      { id: "Anak-anak baik-baik saja.", ru: "С детьми всё хорошо." },
      { id: "Tidak khawatir, baik-baik saja.", ru: "Не волнуйся, всё хорошо." },
    ],
    "terima kasih": [
      { id: "Terima kasih banyak!", ru: "Большое спасибо!" },
      { id: "Terima kasih atas hadiahnya.", ru: "Спасибо за подарок." },
      { id: "Terima kasih sudah datang.", ru: "Спасибо, что пришёл." },
    ],
    "sama-sama": [
      { id: "Terima kasih. — Sama-sama.", ru: "Спасибо. — Пожалуйста." },
      { id: "Sama-sama, dengan senang hati.", ru: "Пожалуйста, с удовольствием." },
      { id: "Tidak masalah, sama-sama.", ru: "Не проблема, мы взаимно." },
    ],
    "maaf": [
      { id: "Maaf, saya terlambat.", ru: "Извини, я опоздал." },
      { id: "Maaf, di mana toilet?", ru: "Простите, где туалет?" },
      { id: "Maaf, saya tidak tahu.", ru: "Извини, я не знаю." },
    ],
    "permisi": [
      { id: "Permisi, boleh lewat?", ru: "Извините, можно пройти?" },
      { id: "Permisi, saya pulang dulu.", ru: "Извините, я пойду." },
      { id: "Permisi, mau bertanya.", ru: "Извините, можно спросить?" },
    ],
    "tolong": [
      { id: "Tolong, saya butuh bantuan.", ru: "Помогите, мне нужна помощь." },
      { id: "Tolong tutup pintu.", ru: "Пожалуйста, закрой дверь." },
      { id: "Tolong bicara pelan-pelan.", ru: "Пожалуйста, говори медленнее." },
    ],
    "silakan": [
      { id: "Silakan masuk.", ru: "Заходите, пожалуйста." },
      { id: "Silakan duduk.", ru: "Садитесь, пожалуйста." },
      { id: "Silakan makan.", ru: "Кушайте, пожалуйста." },
    ],
    "mohon": [
      { id: "Mohon maaf atas kesalahan saya.", ru: "Прошу прощения за свою ошибку." },
      { id: "Mohon ditunggu sebentar.", ru: "Прошу подождать минутку." },
      { id: "Mohon bantuannya.", ru: "Прошу о помощи." },
    ],
    "sampai jumpa": [
      { id: "Sampai jumpa besok!", ru: "До завтра!" },
      { id: "Sampai jumpa lagi, teman.", ru: "До новой встречи, друг." },
      { id: "Saya pulang dulu, sampai jumpa.", ru: "Я пойду, до встречи." },
    ],
    "sampai besok": [
      { id: "Sampai besok di sekolah.", ru: "До завтра в школе." },
      { id: "Sampai besok, selamat malam.", ru: "До завтра, доброй ночи." },
      { id: "Sampai besok jam delapan.", ru: "До завтра в восемь часов." },
    ],
    "sampai nanti": [
      { id: "Sampai nanti, saya pergi dulu.", ru: "До скорого, я пошёл." },
      { id: "Sampai nanti malam.", ru: "До вечера." },
      { id: "Sampai nanti, jangan lupa kontak saya.", ru: "До встречи, не забудь связаться." },
    ],
    "senang berkenalan": [
      { id: "Senang berkenalan dengan kamu.", ru: "Рад знакомству с тобой." },
      { id: "Senang berkenalan, nama saya Andi.", ru: "Рад знакомству, меня зовут Анди." },
      { id: "Senang berkenalan dengan Anda juga.", ru: "Тоже рад знакомству с Вами." },
    ],
    "hati-hati": [
      { id: "Hati-hati di jalan.", ru: "Осторожно в дороге." },
      { id: "Hati-hati, lantai licin.", ru: "Осторожно, пол скользкий." },
      { id: "Hati-hati saat malam.", ru: "Будь осторожен ночью." },
    ],
    "semangat": [
      { id: "Semangat, kamu bisa!", ru: "Держись, ты сможешь!" },
      { id: "Semangat belajar!", ru: "Удачи в учёбе!" },
      { id: "Semangat untuk ujian.", ru: "Удачи на экзамене." },
    ],
    "ayo": [
      { id: "Ayo pergi!", ru: "Пошли!" },
      { id: "Ayo makan dulu.", ru: "Давай сначала поедим." },
      { id: "Ayo, jangan malu.", ru: "Давай, не стесняйся." },
    ],
    "mari": [
      { id: "Mari kita pergi.", ru: "Пойдёмте." },
      { id: "Mari makan bersama.", ru: "Давайте есть вместе." },
      { id: "Mari saya bantu.", ru: "Давайте я помогу." },
    ],
    "oke": [
      { id: "Oke, sampai jumpa.", ru: "Окей, до встречи." },
      { id: "Oke, saya datang.", ru: "Окей, я приду." },
      { id: "Oke, tidak masalah.", ru: "Окей, без проблем." },
    ],
    "baiklah": [
      { id: "Baiklah, saya mengerti.", ru: "Ладно, я понял." },
      { id: "Baiklah, kita mulai.", ru: "Ладно, начинаем." },
      { id: "Baiklah, sampai besok.", ru: "Ладно, до завтра." },
    ],
    "tidak apa-apa": [
      { id: "Tidak apa-apa, jangan khawatir.", ru: "Ничего страшного, не волнуйся." },
      { id: "Maaf, tidak apa-apa.", ru: "Извини. — Ничего страшного." },
      { id: "Tidak apa-apa kalau telat.", ru: "Ничего страшного, если опоздаешь." },
    ],
  },

  "phrases-conversation": {
    "siapa namamu": [
      { id: "Halo, siapa namamu?", ru: "Привет, как тебя зовут?" },
      { id: "Maaf, siapa namamu lagi?", ru: "Извини, как тебя зовут, ещё раз?" },
      { id: "Siapa namamu, anak?", ru: "Как тебя зовут, ребёнок?" },
    ],
    "siapa nama Anda": [
      { id: "Selamat siang, siapa nama Anda?", ru: "Добрый день, как Вас зовут?" },
      { id: "Maaf, siapa nama Anda?", ru: "Извините, как Вас зовут?" },
      { id: "Siapa nama Anda? — Saya Budi.", ru: "Как Вас зовут? — Я Буди." },
    ],
    "berapa umurmu": [
      { id: "Berapa umurmu?", ru: "Сколько тебе лет?" },
      { id: "Berapa umurmu sekarang?", ru: "Сколько тебе сейчас лет?" },
      { id: "Boleh tahu berapa umurmu?", ru: "Можно узнать сколько тебе лет?" },
    ],
    "dari mana asalmu": [
      { id: "Dari mana asalmu?", ru: "Откуда ты?" },
      { id: "Senang bertemu, dari mana asalmu?", ru: "Приятно встретить, откуда ты?" },
      { id: "Dari mana asalmu sebenarnya?", ru: "А вообще откуда ты?" },
    ],
    "kamu tinggal di mana": [
      { id: "Kamu tinggal di mana?", ru: "Где ты живёшь?" },
      { id: "Sekarang kamu tinggal di mana?", ru: "Где ты сейчас живёшь?" },
      { id: "Maaf, kamu tinggal di mana?", ru: "Извини, где ты живёшь?" },
    ],
    "bisa berbicara bahasa Indonesia": [
      { id: "Apa kamu bisa berbicara bahasa Indonesia?", ru: "Ты говоришь по-индонезийски?" },
      { id: "Saya bisa berbicara bahasa Indonesia sedikit.", ru: "Я немного говорю по-индонезийски." },
      { id: "Sudah berapa lama bisa berbicara bahasa Indonesia?", ru: "Как давно ты говоришь по-индонезийски?" },
    ],
    "saya tidak mengerti": [
      { id: "Maaf, saya tidak mengerti.", ru: "Извини, я не понимаю." },
      { id: "Saya tidak mengerti, ulangi tolong.", ru: "Я не понимаю, повтори, пожалуйста." },
      { id: "Saya tidak mengerti bahasa Jawa.", ru: "Я не понимаю яванский." },
    ],
    "saya mengerti": [
      { id: "Saya mengerti, terima kasih.", ru: "Я понимаю, спасибо." },
      { id: "Sekarang saya mengerti.", ru: "Теперь я понимаю." },
      { id: "Saya mengerti maksudmu.", ru: "Я понимаю, о чём ты." },
    ],
    "tolong ulangi": [
      { id: "Tolong ulangi sekali lagi.", ru: "Повтори, пожалуйста." },
      { id: "Maaf, tolong ulangi.", ru: "Извини, повтори." },
      { id: "Tolong ulangi lebih keras.", ru: "Повтори громче." },
    ],
    "tolong bicara pelan-pelan": [
      { id: "Tolong bicara pelan-pelan.", ru: "Пожалуйста, говори медленнее." },
      { id: "Saya pemula, tolong bicara pelan-pelan.", ru: "Я новичок, говори медленнее." },
      { id: "Tolong bicara pelan-pelan dan jelas.", ru: "Говори медленно и чётко." },
    ],
    "apa artinya": [
      { id: "Apa artinya kata ini?", ru: "Что значит это слово?" },
      { id: "Apa artinya dalam bahasa Rusia?", ru: "Что это значит по-русски?" },
      { id: "Maaf, apa artinya?", ru: "Извини, что это значит?" },
    ],
    "bagaimana mengatakannya": [
      { id: "Bagaimana mengatakannya?", ru: "Как это сказать?" },
      { id: "Bagaimana mengatakannya dalam bahasa Indonesia?", ru: "Как сказать это по-индонезийски?" },
      { id: "Saya lupa, bagaimana mengatakannya?", ru: "Я забыл, как это сказать?" },
    ],
    "saya tidak tahu": [
      { id: "Maaf, saya tidak tahu.", ru: "Извини, я не знаю." },
      { id: "Saya tidak tahu jawabannya.", ru: "Я не знаю ответа." },
      { id: "Saya tidak tahu di mana itu.", ru: "Я не знаю, где это." },
    ],
    "saya tidak yakin": [
      { id: "Saya tidak yakin.", ru: "Я не уверен." },
      { id: "Saya tidak yakin tentang itu.", ru: "Я не уверен насчёт этого." },
      { id: "Saya tidak yakin jawabannya benar.", ru: "Я не уверен, что ответ верный." },
    ],
    "tidak masalah": [
      { id: "Tidak masalah, jangan khawatir.", ru: "Не проблема, не волнуйся." },
      { id: "Terlambat? Tidak masalah.", ru: "Опоздал? Не проблема." },
      { id: "Tidak masalah bagi saya.", ru: "Для меня без проблем." },
    ],
    "jangan khawatir": [
      { id: "Jangan khawatir, semua baik.", ru: "Не волнуйся, всё хорошо." },
      { id: "Jangan khawatir, saya bantu.", ru: "Не волнуйся, я помогу." },
      { id: "Jangan khawatir tentang itu.", ru: "Не волнуйся об этом." },
    ],
    "tenang saja": [
      { id: "Tenang saja, jangan panik.", ru: "Спокойно, не паникуй." },
      { id: "Tenang saja, semua aman.", ru: "Спокойно, всё в безопасности." },
      { id: "Tenang saja, saya di sini.", ru: "Успокойся, я здесь." },
    ],
    "tidak masalah bagi saya": [
      { id: "Tidak masalah bagi saya.", ru: "Для меня не проблема." },
      { id: "Apa pun, tidak masalah bagi saya.", ru: "Что угодно, мне всё равно." },
      { id: "Datang malam? Tidak masalah bagi saya.", ru: "Прийти вечером? Мне ок." },
    ],
    "saya setuju": [
      { id: "Saya setuju dengan kamu.", ru: "Я согласен с тобой." },
      { id: "Saya setuju 100 persen.", ru: "Я согласен на 100 процентов." },
      { id: "Saya setuju, mari kita lakukan.", ru: "Согласен, давай сделаем." },
    ],
    "saya tidak setuju": [
      { id: "Maaf, saya tidak setuju.", ru: "Извини, я не согласен." },
      { id: "Saya tidak setuju dengan itu.", ru: "Я с этим не согласен." },
      { id: "Saya tidak setuju, tapi paham.", ru: "Я не согласен, но понимаю." },
    ],
    "menurut saya": [
      { id: "Menurut saya, itu benar.", ru: "По-моему, это правильно." },
      { id: "Menurut saya lebih baik begitu.", ru: "По-моему, лучше так." },
      { id: "Menurut saya, kamu harus istirahat.", ru: "По-моему, тебе надо отдохнуть." },
    ],
    "saya rasa": [
      { id: "Saya rasa kamu benar.", ru: "Думаю, ты прав." },
      { id: "Saya rasa akan hujan.", ru: "Думаю, будет дождь." },
      { id: "Saya rasa cukup untuk hari ini.", ru: "Думаю, на сегодня хватит." },
    ],
    "saya kira": [
      { id: "Saya kira dia sudah pergi.", ru: "Я думал, он уже ушёл." },
      { id: "Saya kira lebih murah.", ru: "Я думал, дешевле." },
      { id: "Saya kira hari ini libur.", ru: "Я думал, сегодня выходной." },
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

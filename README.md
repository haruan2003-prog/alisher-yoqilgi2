# ALISHER XUSUSIY KORXONA — Yoqilg‘i hisob-kitoblari web tizimi

Google Sheets'dagi "DIZEL" jadvali bilan ishlaydigan dashboard. Dastur jadvalga **hech narsa yozmaydi**, faqat o‘qiydi. Har safar ochilganda va "Yangilash" tugmasi bosilganda eng yangi ma'lumotlarni oladi.

```
alisher-yoqilgi/
├── index.html                  — sahifa tuzilishi
├── style.css                   — dizayn
├── script.js                   — hisob-kitoblar va interfeys
├── netlify.toml                — Netlify sozlamalari
├── netlify/functions/sheets.js — xavfsiz vositachi (maxfiy kalitlar shu yerda)
├── apps-script/Code.gs         — Google Apps Script API
└── README.md                   — ushbu qo‘llanma
```

**Ma'lumot oqimi:** Brauzer → `/api/sheets` (Netlify Function) → Google Apps Script → Google Sheets.
Apps Script manzili va maxfiy token faqat Netlify serverida saqlanadi, brauzer kodida ko‘rinmaydi.

---

## 1-qadam. Google Apps Script'ni o‘rnatish

Bu qadamni jadval egasi (yoki jadvalni tahrirlash huquqi bor odam) bajarishi kerak.

1. Jadvalni oching: **Kengaytmalar → Apps Script** (Extensions → Apps Script).
2. Ochilgan `Code.gs` faylidagi hamma narsani o‘chiring va `apps-script/Code.gs` faylining mazmunini to‘liq joylashtiring. **Saqlash** (💾) tugmasini bosing.
3. Maxfiy token yarating:
   - Chap menyuda ⚙️ **Project Settings** → pastda **Script properties** → **Add script property**.
   - Property: `API_TOKEN`
   - Value: kamida 32 belgidan iborat tasodifiy satr, masalan `axk-7Gq2vN9pLm4Xr8Tz1Kd6Wb3Yh5Jc0Fs`.
   - **Save script properties** tugmasini bosing. Bu satrni 3-qadamda ham ishlatasiz.
4. Sinab ko‘ring: yuqoridagi funksiyalar ro‘yxatidan `testRead` ni tanlab **Run** tugmasini bosing.
   - Birinchi marta Google ruxsat so‘raydi: **Review permissions** → hisobingizni tanlang → **Advanced** → **Go to … (unsafe)** → **Allow**. Bu xabar sizning shaxsiy skriptingiz uchun odatiy holat.
   - **Execution log** oynasida `Varaqlar: январ (…), февраль (…), …` yozuvi chiqishi kerak.
5. Web App sifatida joylashtiring: **Deploy → New deployment** → ⚙️ → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** tugmasini bosing va **Web app URL**'ni nusxalang. U `https://script.google.com/macros/s/…/exec` ko‘rinishida bo‘ladi.

> Nega "Anyone" tanlanadi? Netlify serveri Google hisobiga kira olmaydi. Ma'lumotni esa token himoya qiladi: tokensiz so‘rovga skript "Ruxsat yo‘q" deb javob beradi.

**Kod o‘zgartirilsa:** Deploy → **Manage deployments** → ✏️ → Version: **New version** → **Deploy**. Bunda URL o‘zgarmaydi.

---

## 2-qadam. Netlify'ga joylashtirish

> ⚠️ Netlify'ning "drag & drop" (Netlify Drop) usuli **Functions'ni ishga tushirmaydi**. Quyidagi ikki usuldan birini tanlang.

### A usul — GitHub orqali (tavsiya etiladi)
1. GitHub'da yangi repozitoriy yarating va `alisher-yoqilgi` papkasidagi barcha fayllarni yuklang.
2. Netlify → **Add new site → Import an existing project → GitHub** → repozitoriyni tanlang.
3. Build settings bo‘sh qolsin (`netlify.toml` hammasini o‘zi belgilaydi) → **Deploy**.

### B usul — Netlify CLI orqali
```bash
npm install -g netlify-cli
cd alisher-yoqilgi
netlify login
netlify init        # yangi sayt yaratadi
netlify deploy --prod
```

---

## 3-qadam. Maxfiy sozlamalarni kiritish

Netlify → sayt → **Site configuration → Environment variables → Add a variable**:

| Nomi | Qiymati | Majburiymi |
|---|---|---|
| `APPS_SCRIPT_URL` | 1-qadamdagi Web app URL (`…/exec`) | Ha |
| `API_TOKEN` | 1-qadamdagi `API_TOKEN` bilan aynan bir xil satr | Ha |
| `APP_PASSWORD` | Saytga kirish paroli | Ixtiyoriy, lekin tavsiya etiladi |

Qiymatlarni saqlagach, **Deploys → Trigger deploy → Deploy site** orqali saytni qayta joylashtiring.

> `APP_PASSWORD` o‘rnatilmasa, sayt manzilini bilgan har kim moliyaviy ma'lumotlarni ko‘ra oladi. O‘rnatilsa, sayt ochilganda parol so‘raladi. Parol brauzer yopilguncha eslab qolinadi.

---

## 4-qadam. Tekshirish

Saytni oching. Yuqori o‘ng burchakda yashil **"Google Sheets ulangan"** belgisi chiqishi kerak. Keyin quyidagilarni jadvaldagi **"Жами"** qatori bilan solishtiring (davr: *Oxirgi oy*):

- Bosh sahifadagi **Jami qarzdorlik** = oxirgi oydagi "Дебитор 31.xx / кол-во" ustunining jami (W);
- **Jami yoqilg‘i qoldig‘i** = "Кредитор 31.xx / кол-во" ustunining jami (Y);
- **Hisoblangan xizmat haqi** = "Ёкилги саклаш хизмати / микдор" ustunining jami (U).

---

## Yangi oylar qo‘shilganda (noyabr, dekabr, …)

Kodni o‘zgartirish **shart emas**. Faqat quyidagi shartlarga rioya qiling:

1. Yangi varaqni oldingi oy varag‘idan nusxa qilib yarating (o‘ng tugma → *Duplicate*) va nomini o‘zgartiring, masalan `ноябрь`.
2. 1-qatordagi sana sarlavhalarini yangilang: `01.11.2026 Дебитор`, `Кредитор 01.11.2026`, `Дебитор 30.11.2026`, `Кредитор 30.11.2026`. Dastur oy va yilni **E1 katakdagi sanadan** aniqlaydi.
3. Ustunlar tartibi va 2-qatordagi nomlar (`кирв`, `Зиёвуддин`, `Хумор`, `кол-во`, `сумма` …) o‘zgarmasin. Yangi filial qo‘shilsa, uni "Кирим" va "жами" orasiga, hamda "Чиким" va "реализация" orasiga ustun qilib qo‘shing. Dastur uni avtomatik taniydi.
4. Jadval oxirida "Жами" qatori qolsin. Undan keyingi qatorlar o‘qilmaydi.

Saytda **Yangilash** tugmasini bosing: yangi oy davr ro‘yxatida darhol paydo bo‘ladi. Agar oldin oxirgi oy tanlangan bo‘lsa, dastur avtomatik ravishda yangi oyga o‘tadi.

---

## Hisob-kitob qoidalari (jadval formulalaridan olingan)

Barcha miqdorlar litrda. Har bir oy va har bir fermer uchun:

| Ko‘rsatkich | Manba / formula |
|---|---|
| Boshlang‘ich qarz / qoldiq | `Дебитор 01.xx` (E) / `Кредитор 01.xx` (G) |
| Kirim | `Кирим`: кирв + Зиёвуддин + Хумор (J+K+L = M) |
| Chiqim | `Чиким`: кирв + Зиёвуддин + Хумор (P+Q+R = S) |
| Xizmat haqi | `Ёкилги саклаш хизмати / микдор` (U) — jadvalda S × 8%. Ayrim qatorlarda 5% bo‘lsa, jadvaldagi qiymat o‘zgarishsiz olinadi |
| Yakuniy qoldiq | G + M − E − S − U |
| **Qarzdorlik** | `Дебитор 31.xx / кол-во` (W) — natija manfiy bo‘lsa |
| **Qoldiq (yoqilg‘isi bor)** | `Кредитор 31.xx / кол-во` (Y) — natija musbat bo‘lsa |

- **Davr tanlanganda:** kirim, chiqim va xizmat haqi davrdagi oylar yig‘indisi sifatida hisoblanadi. Boshlang‘ich qoldiq davrning birinchi oyidan, yakuniy qoldiq/qarz esa oxirgi oyidan olinadi.
- **Filiallar:** fermer biror filialga biriktirilmagan. U operatsiya qilgan barcha filiallarda ko‘rinadi. Filial bo‘yicha kirim va chiqim jadvaldagi filial ustunlaridan olinadi. Filialning xizmat haqi fermer xizmat haqini filiallardagi chiqim ulushiga mutanosib taqsimlash orqali topiladi. Qoldiq va qarzdorlik esa fermerning umumiy ko‘rsatkichi.
- **Sanalar:** jadvalda kunlik sanalar yo‘q, shuning uchun hamma narsa oy aniqligida. Harakatsizlik "oxirgi harakat bo‘lgan oyning oxirgi kuni"dan bugungi kungacha hisoblanadi. Harakat deganda kirim, chiqim, kirim summasi, naqd pul yoki realizatsiya summasi tushuniladi.
- **Pul (so‘m):** aksverka hujjatida "сумма" ustunlari ham ko‘rsatiladi: boshlang‘ich/yakuniy saldo (F, H, X, Z), kirim summasi (N), naqd pul (O), realizatsiya (T), xizmat summasi (V).
- 0,5 litrdan kichik qoldiq jadvalda ham "0" ko‘rinadi, shuning uchun bunday fermer qarzdor yoki qoldiqli deb hisoblanmaydi.
- INN'siz va nomida "массиви" yoki "туман" so‘zi bo‘lgan qatorlar massiv sarlavhasi hisoblanadi va fermerlar soniga kirmaydi.
- Fermerlar oylar kesimida INN orqali bog‘lanadi. INN bo‘lmasa, nomi bo‘yicha bog‘lanadi.

---

## Imkoniyatlar

- **Bosh sahifa:** 5 ta asosiy ko‘rsatkich, filiallar kartalari, 4 ta grafik (oylik kirim/chiqim, filiallar ulushi, qarz/qoldiq dinamikasi, eng katta 10 qarzdor).
- **Eng katta qarzdorlar / Yoqilg‘isi borlar / Harakatsiz qarzdorlar (30/60/90 kun):** qidiruv, filial filtri, minimal miqdor bo‘yicha filtr, ustun bo‘yicha saralash va Excel eksporti. Qatorni bossangiz, o‘sha fermer aksverkasi ochiladi.
- **Aksverka:** fermer, filial va davr tanlanadi. Natija professional hujjat ko‘rinishida chiqadi va uni PDF'ga yuklab olish, chop etish yoki Excel'ga eksport qilish mumkin.
- **Filiallar:** har bir filial uchun alohida sahifa (fermerlar, qarzdorlar, qoldiqlar, grafik) hamda umumiy oylik hisobot.
- **Global qidiruv** yuqori panelda joylashgan. U kirill va lotin yozuvida, INN bo‘yicha ham ishlaydi.
- Davr paneli: yil, "dan–gacha" oylar, *Oxirgi oy / Yil boshidan / Hammasi*. Barcha sahifalar shu davrga bo‘ysunadi.
- Internet uzilsa, ogohlantirish chiqadi va oxirgi saqlangan ma'lumotlar ko‘rsatiladi. Aloqa tiklanganda ma'lumotlar avtomatik yangilanadi.

---

## Muammolar va yechimlar

| Xabar | Sabab va yechim |
|---|---|
| "Server sozlanmagan: APPS_SCRIPT_URL yoki API_TOKEN kiritilmagan" | 3-qadamni bajaring, so‘ng saytni qayta joylashtiring |
| "Ruxsat yo‘q: token noto‘g‘ri" | Netlify'dagi `API_TOKEN` Apps Script'dagi qiymat bilan bir xil emas |
| "Google Apps Script JSON qaytarmadi" | Web app'da "Who has access: **Anyone**" tanlanmagan yoki URL `…/exec` bilan tugamaydi |
| "API_TOKEN sozlanmagan (Script properties)" | 1-qadamning 3-bandini bajaring |
| "… varag‘ining oyi aniqlanmadi" | E1 katakda `01.MM.YYYY Дебитор` ko‘rinishidagi sana yo‘q |
| Grafiklar chiqmaydi | Brauzer `cdn.jsdelivr.net` saytiga ulana olmayapti (internet yoki tarmoq cheklovi bor) |
| Bitta varaq ko‘rinmaydi | Unda "Фермер…", "Дебитор", "Кредитор", "Кирим", "жами", "Чиким", "реализация" va "саклаш" sarlavhalari bo‘lishi shart |

Mahalliy sinov uchun (`netlify-cli` o‘rnatilgan bo‘lsa): `.env` fayliga `APPS_SCRIPT_URL=…` va `API_TOKEN=…` qatorlarini yozing, so‘ng `netlify dev` buyrug‘ini ishga tushiring. `.env` faylini GitHub'ga yuklamang.

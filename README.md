# Platform admin

Bitta login sahifasi. Har bir admin bitta saytga biriktirilgan. Parol barcha saytlarga yuborilmaydi: platforma adminni o‘z bazasidan topadi, keyin katalog so‘rovini faqat shu saytning backendiga yuboradi.

| Sayt | Panel logini | Sinov paroli | Jonli backend |
| --- | --- | --- | --- |
| Barcha saytlar | `super` | `SuperAdmin2026!` | saytni o‘zi tanlaydi |
| TRT Parts | `trt` | `TrtAdmin2026!` | https://backend.trt-parts.com |
| GPG Group | `gpg` | `GpgAdmin2026!` | https://backend.gpggroup.uz |
| Valesco Oil | `valesco` | `ValescoAdmin2026!` | http://backend.valescooil.com |
| Winner Lub | `winner` | `WinnerAdmin2026!` | http://backend.winnerlub.uz |
| RTG Parts | `rtg` | `RtgAdmin2026!` | hozircha shu platformaning o‘z bazasi |

`super` istalgan saytni tanlaydi. Sayt admini boshqa saytning ma’lumotini ko‘ra olmaydi: `X-Site-Slug` yuborsa ham o‘z sayti ochiladi.

## Ishga tushirish

```bat
cd platform-backend
copy .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Boshqa oynada panel:

```bat
cd trt-adminPanel
npm install
npm run dev
```

Panel: http://localhost:5173  
API: http://localhost:4000/api/health  
Swagger: http://localhost:4000/docs

Postgres shu loyiha uchun `5433` portda. `.env` ichidagi `DB_*` qiymatlarini o‘zingiznikiga almashtirishingiz mumkin.

## Jonli sayt parollari

Panel logini va jonli backend logini boshqa narsa. Panel parollari yuqoridagi jadvalda. Jonli katalogni ochish uchun `.env` ga shu saytning admin loginini yozasiz:

```
TRT_ADMIN_USERNAME=
TRT_ADMIN_PASSWORD=
GPG_ADMIN_USERNAME=
GPG_ADMIN_PASSWORD=
VALESCO_ADMIN_USERNAME=
VALESCO_ADMIN_PASSWORD=
WINNER_ADMIN_USERNAME=
WINNER_ADMIN_PASSWORD=
```

URL faqat origin bo‘lsin, oxirida `/api` yoki `/` bo‘lmasin. Login yozilmasa panel ochiladi, lekin o‘sha saytning katalogi “upstream login yo‘q” deb turadi. Parol brauzerga va boshqa saytlarga chiqmaydi.

RTG backendida hozircha faqat login va contact bor, mahsulot API si yo‘q. Shuning uchun RTG kategoriyasi va mahsuloti shu platforma bazasida saqlanadi. `RTG_BASE_URL` hozir sinov manzil: `http://backend.rtgparts.uz`. Haqiqiy domen chiqsa, shu qatorni almashtirasiz.

## Nima ulangan

- TRT: kategoriya va ehtiyot qismlar (`/categories`, `/products`)
- GPG: kategoriya, brend, mahsulot
- Valesco: kategoriya, mahsulot, yangilik
- Winner: kategoriya va mahsulot. Yangi yozuvga rasm majburiy, chunki ularning API si rasmni talab qiladi
- RTG: kategoriya va mahsulot shu yerda

## Xavfsizlik

- Parol bcrypt bilan saqlanadi. Login xatosi doim bir xil matn.
- 8 marta xato kiritilsa, hisob 15 daqiqaga yopiladi.
- Access token 15 daqiqa. Refresh token httpOnly cookie, har safar yangilanadi, qayta ishlatilsa hammasi bekor qilinadi.
- Helmet, CORS, so‘rov limiti, login limiti, DTO whitelist.
- Rasm faqat jpg, png, webp, gif va 5 MB gacha.
- Productionda `change-me` JWT siri va sinov parollari bilan admin yaratilmaydi.
- O‘zgartirishlar audit jurnaliga yoziladi.

Productionda `NODE_ENV=production`, `DB_SYNCHRONIZE=false`, JWT sirlarini va panel parollarini almashtiring.

# PACZKA DLA SESJI Civ-UNITS — od sesji DANE (cywilizacje)
Data: 2026-06-22 21:49. Wklej całość do tasku UNITS.

## Podział ról (ważne)
- **DANE (ja):** dane cywilizacji + mechanizmy + **historyczny KIERUNEK** nacji. NIE projektuję konkretnych jednostek.
- **UNITS (Ty):** konkretne jednostki — nazwy, staty, dokładne „W zamian za", epoki, modele/wzory. Detale jednostek są Twoje.
- Poniższe nazwy jednostek to **luźne przykłady kierunku** — Ty je finalnie ustalasz.

## 1. Co zmieniła sesja DANE (kontekst, stan cywilizacji)
- **Roster = 9 TYPÓW** (NIE 50 nacji). „50/70/90" = miasta na mapie ze spawnu (robota generatora, nie jednostek).
- Pełna 9: Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, **Celtowie**, **Germanie**.
- Dodano **Celtowie + Germanie** jako pełne typy (rename „Galowie"→„Celtowie"; kanon §9d nazywa ich „Galowie", ikona = „Miecznik galijski" = ref-17).
- Dodano **religie** na poziomie cywilizacji (Celtowie = druidyzm celtycki; Germanie = Wotan/Odyn). To nie dotyczy jednostek.
- **NIE ruszałem** Jednostki.xlsx / units.json — to Twój lane.

## 2. Zasada jednostek per epoka (ustalona z Maciej) — kierunek dla Ciebie
- **Kamień:** jednostki standardowe (bez nazwanych zamienników).
- **Brąz:** ≥1 nazwany zamiennik (kolumna „W zamian za") **+ 1 super-jednostka** (1/nację).
- **Żelazo:** ≥1 kolejny nazwany zamiennik.
- **super-jednostka ≡ „jednostka specjalna"** (to samo pojęcie; §6a: 1 szt., bezpłatna, w stolicy, odradza się, lepsze staty).
- **Obserwacja (units.json):** Brąz-zamiennik + super są już dla wszystkich 7. **Brak zamiennika w ŻELAZIE u 6** (tylko Chiny mają Kusznika). Kierunek: każdy typ docelowo dostaje reprezentanta w Żelazie — konkrety Twoje.

## 3. HISTORYCZNY KIERUNEK — nowe kultury (z tego projektujesz jednostki)
### Celtowie (≈ Galowie; kultura Żelaza+, §9d; wzór ref-17)
Plemienna kultura wojowników Europy Zach./Środ. (Galia, Brytania). Rdzeń militarny: **piechota z bronią sieczną** — długie żelazne miecze; walka indywidualna, **brawura i gwałtowna szarża**, wysokie morale na starciu, ale **słabsza w długiej/zwartej walce i w obronie**. Motywy: wojownicy szturmowi/„nadzy" (typu Gaesatae), wodzowie z drużyną, **druidzi** (warstwa kapłańska — religia druidyczna), wczesne **rydwany bojowe** (galijsko-brytyjskie). Ikona: miecznik galijski (ref-17). Super ≡ jednostka specjalna = miecznik galijski. (Przykłady kierunku, NIE wiążące: Brąz — wczesny wojownik celtycki; Żelazo — miecznik galijski, szturmowiec.)

### Germanie (pokrewni Celtom; kultura Żelaza+, §9d; brak ref w §9f — wzór dobierz)
Plemiona Europy Środ./Płn., kultura **leśna**. Rdzeń militarny: **piechota z włócznią (framea) i tarczą**; **walka w lesie, zasadzki**, gwałtowne natarcie/**furia** (berserkowie), luźna organizacja oparta na **drużynach wodzów** (komitat). Słabości: oblężnictwo, organizacja, tempo technologii. Religia germańska (Wotan/Odyn, Donar/Thor, Tyr). Super ≡ jednostka specjalna = wojownik germański (framea). (Przykłady kierunku, NIE wiążące: Brąz — wojownik z frameą; Żelazo — berserk, lekka jazda.)

## 4. Istniejące 7 typów — kierunek już jest w civs.json/units.json
Style/charaktery i jednostki specjalne 7 typów masz w danych. Twoje zadanie wg zasady: **dołożyć zamiennik w Żelazie** tam, gdzie go brak — zachowując charakter nacji (Grecy: ciężka piechota; Rzym: dyscyplina/ofensywa; Zulusi: szybka piechota; Egipt: rydwany/łucznicy dyst.). **Inkowie i Sumerowie** to kultury wczesne (Inkowie bez żelaza; Sumer = wczesny brąz) → kierunek: można **pominąć Żelazo** lub dać późną elitę; decyzja Master.

## 5. Do uzgodnienia z Masterem (to dane — moja strona, NIE Twoja)
- Decyzja **8C** (zamknięta): nazwy „Jednostka specjalna" w civs.json zostają jak są (Falanga/Legion/Kusznik/Impi) — NIE wyrównujemy ich do super; super (Hieros Lochos/Evocati/Hu Ben Wei/uThulwana) zostają tylko w units.json.
- **Inkowie: NAPRAWIONE (8C)** — civs.json = „Chaska (maczuga gwiaździsta) + Królewska Gwardia (elita)" (zamiast stale „Jaguar").

## 6. DO DOROBIENIA — checklist braków jednostek (dla Civ-UNITS)
Nazwy = kierunek (NIE wiążące); staty/modele/epoka = Twoje. Kolumna „Broń / styl walki" = historyczny kierunek uzbrojenia (miecz / włócznia / tarcza / dystans…).

### A) Nowe kultury — pełny komplet
**Celtowie** (kultura Żelaza+, ref-17):

| Epoka | Jednostka | Broń / styl walki | Zastępuje |
|---|---|---|---|
| Brąz | Wojownik celtycki | miecz LUB włócznia + duża owalna tarcza drewniana; lekki pancerz; walka wręcz, indywidualna szarża | Wojownik |
| Żelazo | **Miecznik galijski** ★(super) | długi żelazny MIECZ sieczny (cięcia z góry) + duża owalna tarcza; hełm, mało pancerza; gwałtowna szarża, brawura | Wojownik z mieczem i tarczą |
| Żelazo (opc.) | Gaesatae | włócznia/oszczepy + miecz; walczy NAGO (bez tarczy/pancerza); berserk-szarża, wys. morale, b. niska obrona | — (szturm) |
| (opc.) | Druid | brak broni — wsparcie morale/kultura (nie-bojowa) | — |

**Germanie** (pokrewni Celtom; wzór dobierz):

| Epoka | Jednostka | Broń / styl walki | Zastępuje |
|---|---|---|---|
| Brąz | **Wojownik germański** ★(super) | FRAMEA — krótka włócznia (pchnięcie i rzut) + drewniana tarcza; lekki/brak pancerza; zwarta walka, zasadzki w lesie | Włócznik |
| Żelazo | Berserk | TOPÓR lub miecz, często bez tarczy i pancerza; szał bojowy (+Atak, −Obrona), wręcz | Wojownik z mieczem i tarczą |
| Żelazo (opc.) | Lekka jazda germańska | OSZCZEPY (do rzutu) + włócznia/krótki miecz, mała tarcza; konno; harce, flankowanie | Konnica |

### B) Wyjątkowa jednostka ŻELAZA — wszystkie 9 (FINAŁ — założenia przyjęte autonomicznie 2026-06-23)
Pełna tabela z bronią/stylem i kolumną „W zamian za": **`Jednostki-specjalne-przeglad.xlsx` → zakładka „Żelazo"** (1 wiersz/cyw. + opcjonalne „2.").
Przyjęte założenia (nazwy/role = kierunek; staty Atak/Obrona/Health = UNITS):
- **1 wyjątkowa jednostka Żelaza na każdą z 9 cyw.**
- **2. jednostka — PRZYJĘTA dla: Chińczycy** (+ Halabardnik z ji), **Egipt** (+ Łucznik nubijski), **Sumerowie** (+ Łucznik z pawężnikiem). Grecy / Rzymianie / Zulusi / Inkowie / Celtowie / Germanie = po 1 (drugie odłożone).
- **Inkowie:** kultura bez żelaza → ich „jednostka Żelaza" = elita brąz/miedź (Gwardzista z champi); bez kucia żelaza.
- **Chińczycy** mają już Kusznika (Żelazo) — Kusznik powtarzalny (Zhuge nu) to jego rozwinięcie.

Lista (skrót): Grecy=Thorakites · Rzymianie=Principes · Chińczycy=Kusznik powtarzalny (+Halabardnik z ji) · Inkowie=Gwardzista z champi · Zulusi=iButho z iklwa · Egipt=Gwardzista z żelaznym khopesh (+Łucznik nubijski) · Sumerowie=Mur tarcz (+Łucznik z pawężnikiem) · Celtowie=Miecznik galijski · Germanie=Berserk.

### C) Wzory/modele
Celtowie = ref-17 (Miecznik galijski); Germanie = brak ref w §9f → dobierz z `Referencje-jednostek/`.

Kanon do zajrzenia: §6a (typy/zamienniki/super), §8c (jednostki specjalne), §9d (Galowie/Celtowie + Germanie), §9f (ref-17), Macierz-walki.xlsx, Jednostki.xlsx.

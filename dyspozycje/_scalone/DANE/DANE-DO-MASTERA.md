# DANE -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika (zeby wiedzial, co sie dzieje). Tresc identyczna.
Odpowiedzi/zadania od mastera czytaj w: dyspozycje/DANE.md (sekcja "DO ZROBIENIA TERAZ").
NIE edytuj innych plikow w dyspozycje/.

---

## [2026-06-22 19:36] DANE — D2 ZROBIONE (50 cywilizacji + religie)
- civs.json: 7 -> **50 cywilizacji**, każda z nowym polem **"Religia"**. (4,5 KB -> 20,7 KB)
- **7 typów głównych** — religie wg kanonu (Spoleczenstwo-parametry / „Religie cywilizacji"),
  oznaczone w Uwagach jako „typ główny (grywalny)".
- **43 cywilizacje początkowe** (Uwagi="cywilizacja początkowa") — spread historyczny/geo
  (Mezopotamia, Lewant, Morze Śródziemne, Europa/step, Afryka, Azja Pd/Wsch, Ameryki);
  każda ma styl, jednostkę specjalną, bonus (do dopracowania) i religię.
- Źródło prawdy zaktualizowane: **Cywilizacje.xlsx** (nowa kolumna „Religia" + 43 wiersze;
  arkusz „Start gry": Główne typy **5 -> 7**).
- Re-eksport **TYLKO civs.json** (skrypt celowany, NIE export-data.py, NIE npm run build).
  Pozostałe JSON-y nietknięte (mtime 11:21 bez zmian).
- Weryfikacja: JSON poprawny; 50 cyw.; 0 bez religii; 0 duplikatów; loader.ts kompiluje się
  z nowym civs.json (tsc izolowany, **EXIT=0**).
- **DECYZJA dla SILNIK/master:** pole „Religia" jest w JSON, ale interfejs `CivDef`
  (src/data/loader.ts) go jeszcze nie ma — loader czyta bez błędu (pole nadmiarowe). Jeśli
  logika ma typowo czytać religię, SILNIK dodaje 1 linię: `Religia: string | null;` do CivDef.
  Bonusów mechanicznych religii NIE duplikowałem w civs.json (są w Spoleczenstwo-parametry).
- Backup starego civs.json i Cywilizacje.xlsx zachowany (sesja DANE).
- Pytanie: czy cyw. początkowe mają zostać „lekkie" (bez super-jednostek), czy dopracować
  bonusy? Teraz minusy=„do dopracowania" zgodnie z §8b (uproszczone, osobny wątek).

---

## [2026-06-22 21:10] DANE — KOREKTA wpisu 19:36 (NIE 50 nacji; roster = typy główne)
**Nieporozumienie wyjaśnione przez Maciej:** liczba „50/70/90" to NIE roster osobnych nacji.
To **klastry tego samego typu**: główna cyw. ląduje w terenie, a wokół niej powstaje 9 miast
tego samego typu → **1 gracz + 9 rywali = 10 miast/typ** (miasta min. ~9 pól od siebie).
Stąd 5 typów→50, 7 typów→70, **9 typów→90 miast**. Roster = liczba TYPÓW, nie 50 nacji.

CO ZROBIONE:
- **Cofnąłem 43 wymyślone cywilizacje** (przywrócone z backupu). Roster = **typy główne**.
- **Roster = 9 typów głównych:** 7 dotychczasowych + **Galowie** + **Germanie**. Każdy z religią.
- Religie 7 wg kanonu (Spoleczenstwo-parametry / „Religie cywilizacji").
  Galowie = **Religia celtycka (druidyzm)**; Germanie = **Religia germańska (Wotan/Odyn)**.
- **Nazewnictwo:** użyłem kanonicznych **„Galowie/Germanie"** (§9d + ref-17 „Miecznik galijski")
  = Twoi „Celtowie/Germanie" (Galowie = Celtowie galijscy). Wolisz „Celtowie"? → zmiana 1 pola.
- **Cywilizacje.xlsx „Start gry":** Główne typy → **9**; Cywilizacje na mapie → **90**
  (9 typów × 10); Rywale tego samego typu → **~9** (klaster 10 miast); wiersz „początkowe"
  doprecyzowany: to miasta tego samego typu (klaster), NIE osobne nacje.
  Uwaga: reguła spawnu (klaster ~10 pól, miasta ≥~9 pól) należy do **map-gen** (RENDER-MAPA/SILNIK) — flaguję.
- Re-eksport **TYLKO civs.json** (skrypt celowany; NIE export-data.py / NIE npm build).
  Inne JSON-y nietknięte (mtime 11:21). **loader.ts tsc EXIT=0**. 9 cyw., 0 bez religii, 0 dubli.

SCHEMAT CYWILIZACJI (etap 1 — pola rekordu w civs.json → „cywilizacje[]"):
- Cywilizacja · Styl / charakter · Jednostka specjalna (1 nazwana; pełne staty → Jednostki.xlsx, lane Units)
- Bonus startowy · Bonusy/minusy (do dopracowania) · Uwagi · **Religia** (NOWE pole = nazwa wyznania)
- Bonusy mechaniczne religii NIE są w civs.json (są w Spoleczenstwo-parametry / „Religie cywilizacji").
- `CivDef` (src/data/loader.ts) nie ma jeszcze pola `Religia` — loader czyta bez błędu (pole nadmiarowe);
  gdy logika ma je czytać typowo → SILNIK dodaje 1 linię `Religia: string | null;`.
- PROPOZYCJA na przyszłe sub-nacje: pole **„Typ główny"** (przynależność nacji do 1 z 9 typów) — do akceptacji.

PROPOZYCJA JEDNOSTEK dla Galów i Germanów (INPUT dla sesji UNITS — ja NIE buduję jednostek):
- **Galowie** (broń sieczna, Ep. Żelaza+ §9d):
  · *Miecznik galijski* — super/elita (ref-17): ciężka piechota z długim mieczem; wysoki Atak/Uderzenie,
    premia szarży; kara Morale po przeciągłej walce. Zastępuje standardowego miecznika.
  · *Gaesatae / szturmowiec* (opc.): lekka piechota, wysokie Morale szarży, niska Obrona.
  · *Druid* (opc., później): wsparcie Morale/Kultura.
- **Germanie** (pokrewni Galom; brak ref w §9f — Units dobiera z biblioteki Referencje-jednostek):
  · *Wojownik germański (framea)* — super/elita: włócznia + tarcza; +walka w lesie, +zasadzka (pierwszy cios).
  · *Berserk* (opc.): furia — +Atak, −Obrona.
  · *Lekka jazda germańska* (opc.): harce/flankowanie.

PYTANIA / DECYZJE dla mastera:
1. Akceptacja rosteru **9 typów + religie**? (jeśli tak — etap 3 zamknięty dla v0.1)
2. Nazwa **„Galowie" czy „Celtowie"** (zmiana 1 pola)?
3. Dodać pole **„Typ główny"** w schemacie pod przyszłe sub-nacje?
4. Reguła **90 miast / klaster 10** — potwierdzić i przekazać do map-gen (nie mój lane).
- Backup civs.json i Cywilizacje.xlsx zachowany (sesja DANE).

---

## [2026-06-22 21:32] DANE — PYTANIA 1ABC + ODPOWIEDZI Maciej + reorg kanału
**Reorg dyspozycji zauważony:** kanał = **DANE** (DANE.md / DANE-DO-MASTERA.md).
UWAGA: moje wpisy [21:18] i [21:20] z poprzedniego pliku (DANE-CYW-DO-MASTERA.md) nie przeniosły się —
odtwarzam Q&A tutaj, żeby było widać aktualny „top" dyskusji.

**PYTANIA (1ABC) i ODPOWIEDZI: 1A · 2B · 3A · 4C · 5A**
1. Ile typów? → **A) 9** (7 + Celtowie + Germanie). [bez zmian — roster już 9]
2. Nazwa kultury celtyckiej? → **B) „Celtowie"**. → **ZMIENIŁEM** „Galowie"→„Celtowie" w civs.json +
   Cywilizacje.xlsx (arkusz Cywilizacje + „Start gry"). Jedn. spec. zostaje **„Miecznik galijski"** (ref-17),
   religia **„Religia celtycka (druidyzm)"**. (Zgodne z planem Mastera w DANE.md: „CELTOW".)
3. Religie — akceptacja? → **A) Akceptuję** (7 wg kanonu + Celtowie=druidyzm, Germanie=Wotan/Odyn). [bez zmian]
4. Pole „Typ główny" teraz? → **C) Dopiero przy sub-nacjach.** [NIE dodaję teraz; schemat = 7 pól + Religia]
5. Reguła „90 / klaster 10"? → **A) Zostaw u mnie + przekaż map-gen.** [zostaje w „Start gry"; PROŚBA: Master relay do map-gen]

**STAN:** 9 typów (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, **Celtowie, Germanie**),
każdy z religią; **loader.ts tsc EXIT=0**; zmienione tylko **civs.json** (inne JSON mtime 11:21).

**PLAN z DANE.md:** [x]1 Celtowie/Germanie = pełne typy (zrobione, z rename). [↓]2 Spec jednostek (poniżej).
[ ]3 Konkretne bonusy 7 istniejących typów. [ ]4 Finalny re-eksport civs.json.

### PKT 2 — SPEC JEDNOSTEK Celtowie/Germanie (INPUT dla Grupa C; ja NIE buduję jednostek)
Pełne staty (Atak/Obrona/Health/Morale/Zasięg) + modele = lane Grupa C (Jednostki.xlsx). Poniżej propozycja ról/nazw.
★ = kandydat na super-jednostkę (1/typ). Uwaga: super-jedn. kanonicznie Brąz, ale Celtowie/Germanie to kultury
Żelaza+ → o epoce super-jedn. decyduje UNITS/Master.

**Celtowie** (≈ Galowie; broń sieczna, §9d):

| Nazwa | Rola / broń | Epoka | Wzór |
|---|---|---|---|
| Miecznik galijski ★ | ciężka piechota / długi miecz (sieczna) | Żelazo | ref-17 (kanon §9f); premia szarży, kara Morale po długiej walce; zastępuje std. miecznika |
| Gaesatae | szturmowiec / oszczep+miecz (walczy nago) | Brąz–Żelazo | wysokie Morale szarży, niska Obrona; wzór dobrać |
| Wojownik celtycki | piechota std / włócznia+tarcza | Brąz | baza; wzór: std piechota |
| Druid (opc.) | wsparcie / — | Żelazo+ | bonus Morale/Kultura; later |

**Germanie** (pokrewni Celtom; brak ref w §9f — UNITS dobiera z Referencje-jednostek):

| Nazwa | Rola / broń | Epoka | Wzór |
|---|---|---|---|
| Wojownik germański (framea) ★ | piechota / framea (krótka włócznia)+tarcza | Brąz–Żelazo | +las, +zasadzka (pierwszy cios); wzór dobrać |
| Berserk | szturmowiec / topór/miecz (furia) | Żelazo | +Atak, −Obrona; wzór dobrać |
| Lekka jazda germańska (opc.) | jazda / oszczepy | Żelazo | harce/flankowanie |

NASTĘPNY KROK (czekam na OK lub robię dalej): PKT 3 — skonkretyzować bonusy/minusy 7 istniejących typów
(np. Chińczycy mają „(do ustalenia)"), potem PKT 4 — finalny re-eksport civs.json.

---

## [2026-06-22 21:38] DANE — ZASADA jednostek per epoka (od Maciej) + propozycja Celtowie/Germanie
**ZASADA (potwierdzona przez Maciej):** każda nacja ma nazwane zamienniki per epoka:
- **Kamień:** nie trzeba (jednostki standardowe).
- **Brąz:** ≥1 nazwany zamiennik (zastępuje typ std — kolumna „W zamian za") **+ 1 super-jednostka** (1/nację, §6a).
- **Żelazo:** ≥1 kolejny nazwany zamiennik.
To dane jednostek → **Jednostki.xlsx = lane Grupa C** (nie civs.json). Ja podaję propozycję jako INPUT.
Dotyczy WSZYSTKICH 9 nacji — wg §6a super-jednostki 6 z 7 typów są wciąż „do zaproponowania" (tylko Inkowie = Królewska Gwardia) → robota Grupa C.

### Propozycja PER EPOKA — Celtowie i Germanie (INPUT dla Grupa C; staty/modele/epoka = UNITS)
**Celtowie** (≈ Galowie, ref-17):

| Epoka | Jednostka (propozycja) | Zastępuje (typ std) | Uwagi |
|---|---|---|---|
| Brąz | Wojownik celtycki | wojownik | wczesny miecznik; brawura/szarża |
| Brąz | ★ Gaesatae (SUPER) | — (elita, 1 szt., stolica) | naga piechota szturmowa; wysokie Morale szarży |
| Żelazo | Miecznik galijski | wojownik z mieczem | ref-17; ciężka piechota; premia szarży, kara Morale po długiej walce |
| Żelazo (opc.) | Druid | — (wsparcie, nie-bojowa) | bonus Morale/Kultura |

**Germanie** (brak ref w §9f — UNITS dobiera wzór):

| Epoka | Jednostka (propozycja) | Zastępuje (typ std) | Uwagi |
|---|---|---|---|
| Brąz | Wojownik germański (framea) | włócznik | włócznia+tarcza; +las, +zasadzka (pierwszy cios) |
| Brąz | ★ Drużynnik / Komitat (SUPER) | — (elita, 1 szt., stolica) | przyboczni wodza; wysokie Morale/Obrona |
| Żelazo | Berserk | wojownik z mieczem | furia: +Atak, −Obrona |
| Żelazo (opc.) | Lekka jazda germańska | konnica | harce/flankowanie |

★ = super-jednostka. UWAGA epoka: §6a daje super w Brązie, ale Celtowie/Germanie to kultury Żelaza+
(§9d) → epokę super-jedn. potwierdza UNITS/Master.

### Wpływ na civs.json — PYTANIA (1ABC). Odpowiedz np. „6A 7A".
6. Czy civs.json ma nieść więcej pól jednostkowych?
   A) Zostaw lean — 1 „Jednostka specjalna" (flagowa) w civs.json; reszta (super + per-epoka) w Jednostki.xlsx (UNITS).
   B) Dodaj do civs.json osobne pole „Super-jednostka" (Brąz) obok „Jednostka specjalna".
   C) Dodaj do civs.json pełną listę per-epoka (Brąz/Żelazo zamienniki + super).
7. Per-epokowe zamienniki dla 7 istniejących typów?
   A) Robi Grupa C (Jednostki.xlsx) — ja tylko relay zasady.
   B) Chcę, żebym też rozpisał propozycje dla 7 (INPUT dla UNITS).
   C) Później.

(PKT 3 — konkretne bonusy 7 typów — i PKT 4 — re-eksport — czekają; mogę robić równolegle po Twoim 6/7.)

---

## [2026-06-22 21:44] DANE — ODPOWIEDZI 6A + 7B; analiza units.json + propozycja Żelaza dla 7
**6A:** super-jednostka ≡ „Jednostka specjalna" — civs.json zostaje lean (1 pole), nazewnictwo bez zmian, brak osobnego pola super. **Danych nie zmieniam.**
**7B:** rozpisuję propozycje per-epoka dla 7 typów (INPUT dla Grupa C).

**ANALIZA units.json (stan UNITS):** dla wszystkich 7 typów Brąz-zamiennik + super JUŻ SĄ. Luka wg Twojej zasady = **zamiennik w ŻELAZIE** (brak u 6; Chiny mają Kusznika). Żelazo = przyszła epoka (v0.1 = Kamień+Brąz), więc to propozycja na przód.

| Nacja | Brąz: zamiennik (✓ jest) | Super ✓ (Super:TAK) | ŻELAZO: propozycja (zastępuje) |
|---|---|---|---|
| Grecy | Falanga ← włócznik | Hieros Lochos | Thorakites – hoplita pancerny (← wojownik z mieczem) |
| Rzymianie | Legionista ← wojownik z mieczem | Evocati | Principes – legion manipularny (← wojownik z mieczem) |
| Chińczycy | Jeździec chiński ← konnica | Hu Ben Wei | **Kusznik ← łucznik (JUŻ JEST w Żelazie)** |
| Zulusi | Impi ← włócznik; Izijula ← oszczepnik (Kamień) | uThulwana | iziNyanga – łucznik żelazny (← łucznik) |
| Inkowie | Wojownik z toporem ← w. z mieczem; Chaska/Huaracoc/Estólica (Kamień) | Królewska Gwardia | ⚠ Inkowie = kultura BEZ żelaza → proponuję POMINĄĆ (zostają elity brązu) lub późna maczuga brązowa |
| Egipt | Rydwan egipski; Wojownik z khopesh; Łucznik egipski (Kamień) | Medżaj | Wojownik z żelaznym khopesh (← wojownik z mieczem) |
| Sumerowie | Rydwan/Włócznik/Łucznik sumeryjski | Gwardia Królewska Sumeru | ⚠ Sumer = wczesny brąz → proponuję POMINĄĆ lub przejście do następcy (Asyria/Babilon) |

(Celtowie/Germanie — propozycja per-epoka: patrz wpis 21:38.)

**⚠ FLAGI ROZJAZDU (civs.json vs units.json) — do decyzji:**
- Po 6A „Jednostka specjalna" = super (Super:TAK). Tymczasem civs.json trzyma ZAMIENNIK, nie super:
  Grecy: civs.json *Falanga* vs super *Hieros Lochos*; Rzym: *Legion* vs *Evocati*; Chiny: *Kusznik* vs *Hu Ben Wei*;
  Zulusi: *Impi* vs *uThulwana*. (Egipt *Medżaj* i Sumer *Gwardia Królewska* — zgodne.)
- **Inkowie: civs.json ma STALE „Wojownik Jaguar (Holkan)"** — w units.json/§8c Jaguar USUNIĘTY; jest Chaska + Królewska Gwardia (super).

**PYTANIE (1ABC) — pole „Jednostka specjalna" w civs.json. Odpowiedz np. „8C".**
8. A) Zostaw nazwy jak są (Falanga/Legion/Kusznik/Impi) = ikoniczny zamiennik; super tylko w Jednostki.xlsx. (zgodne z „nazewnictwo zostaw", ale ≠ super)
   B) Wyrównaj do SUPER: Grecy→Hieros Lochos, Rzym→Evocati, Chiny→Hu Ben Wei, Zulusi→uThulwana, Inkowie→Królewska Gwardia (+ napraw Jaguar).
   C) Minimum: napraw tylko stale Inkowie (Jaguar → Chaska/Królewska Gwardia), resztę zostaw. [rekomendacja]

NASTĘPNE (moja działka): PKT 3 — konkretne bonusy/minusy 7 typów; PKT 4 — finalny re-eksport civs.json.

---

## [2026-06-22 21:52] DANE — korekta zakresu + paczka dla Grupa C + mapa sesji
**Korekta zakresu (Maciej):** DANE = dane cywilizacji + mechanizmy + **historyczny kierunek**; NIE projektuję
konkretnych jednostek (to robi Grupa C). Paczkę dla UNITS przerobiłem na „kierunek", nie detale.
**Przygotowałem plik:** `PACZKA-DLA-UNITS-od-DANE.md` (w folderze Civ) — gotowy do wklejenia do tasku Grupa C:
podział ról, stan danych (9 typów), zasada per-epoka (Brąz: zamiennik+super; Żelazo: zamiennik), historyczny
kierunek dla Celtów i Germanów, luka „zamiennik w Żelazie" u 6 typów, oraz 2 flagi danych do decyzji (rozjazd
„Jednostka specjalna" vs super; stale Inkowie/Jaguar). Detale jednostek zostają dla UNITS.
**Mapa sesji przyjęta:** jestem **Civ-DANE** → czytam `DANE.md`, piszę `DANE-DO-MASTERA.md` (już tak działam — 0 zmian).
Re-pointy do innych sesji i zakładanie Civ-LOGIKA/Grupa A = akcje Mastera (nie tworzę sesji).
**OTWARTE u mnie:** pyt. 8 (pole „Jednostka specjalna" w civs.json: A/B/C — rekom. C), potem PKT3 (bonusy 7 typów) + PKT4 (re-eksport).

---

## [2026-06-22 23:06] DANE — DANE.md odczytane; PLAN 1-5 ZAMKNIĘTY (Status Excel odhaczony)
Przeczytałem `DANE.md` + nowy `Status-projektu-The-Game.xlsx` (zakładka **Civ-DANE** = 5 kroków). Wykonane do końca:
- **Krok 4 (przegląd bonusów 7 typów):** jedyny placeholder „(do ustalenia)" był u **Chińczyków** → konkret:
  „słabsza piechota szturmowa wręcz (nacisk na dystans i konnicę)". Przy okazji poprawka błędu u **Inkowie**:
  „słabsza kawaleria" → „brak konnicy i rydwanów (brak koni/wołów; §8c) — siła w piechocie i dystansie".
  Pozostałe 5 typów miały już konkretne bonusy/minusy.
- **Krok 5 (re-eksport):** celowany skrypt → TYLKO `civs.json` (9 typów). **loader.ts tsc EXIT=0**. Inne JSON-y nietknięte (mtime 11:21).
- **1B = „Celtowie"** potwierdzone w DANE.md — rename był już zrobiony.
- **Status Excel odhaczony:** zakładka **Civ-DANE** kroki 1-5 = „Zrobione"; **„Status wg grup" r31 (Roster cyw. 7→9) = „Zrobione"**
  (to zasila „Podsumowanie"). Plik bez wykresów → formuły + formatowanie warunkowe zachowane; pozostałe zakładki nietknięte.

**STATUS:** cały PLAN DZIAŁANIA Civ-DANE (1-5) zamknięty. civs.json = 9 typów, każdy z religią i konkretnym bonusem/minusem.
**JEDNA OTWARTA DECYZJA (pyt. 8) — Twoja:** pole „Jednostka specjalna" w civs.json trzyma ikoniczny zamiennik
(Falanga/Legion/Kusznik/Impi), a super w units.json to inna nazwa; + Inkowie mają stale „Wojownik Jaguar (Holkan)".
8A) zostaw jak jest · 8B) wyrównaj wszystkie do super · **8C) napraw tylko stale Inkowie (rekomendacja)**.
Czekam na 8A/8B/8C oraz na nowe dyspozycje.

---

## [2026-06-22 23:10] DANE — decyzja 8C WYKONANA (Inkowie naprawione)
- **8C:** Inkowie „Jednostka specjalna" „Wojownik Jaguar (Holkan)" → **„Chaska (maczuga gwiaździsta) + Królewska Gwardia (elita)"** (kanon §8c). Pozostałe nazwy 6 typów bez zmian (wg 8C).
- Re-eksport TYLKO `civs.json`; „Jaguar" nie występuje już nigdzie; **loader.ts tsc EXIT=0**; `units.json`/`society-params.json` i reszta nietknięte (mtime 11:21).
- Status Excel: „Status wg grup" r31 „Co zostało" → „—" (pyt. 8 zamknięte). Zakładka Civ-DANE: kroki 1-5 = „Zrobione".
- **WSZYSTKO ZAMKNIĘTE.** `civs.json` = 9 typów; każdy ma: religię + konkretny bonus/minus + jednostkę specjalną (Inkowie poprawione). Brak otwartych pytań. Czekam na nowe dyspozycje.

---

## [2026-06-22 23:15] DANE — braki jednostek skonsolidowane → przekazane Grupa C
Na prośbę Maciej zebrałem wszystkie braki jednostek (moim zdaniem brakujące w cywilizacjach) w jeden checklist dla UNITS.
Dodane jako **sekcja 6 „DO DOROBIENIA"** w `PACZKA-DLA-UNITS-od-DANE.md`. Nazwy = KIERUNEK (nie wiążące); staty/modele/epoka = UNITS.
- **A) Nowe kultury (pełny komplet):** Celtowie (Brąz: wojownik celtycki + super=Miecznik galijski; Żelazo: Miecznik galijski/Gaesatae); Germanie (Brąz: Wojownik germański framea + super; Żelazo: Berserk; opc. lekka jazda).
- **B) Brak zamiennika w ŻELAZIE (mają tylko Brąz+super):** Grecy→Thorakites, Rzym→Principes, Zulusi→iziNyanga, Egipt→wojownik z żelaznym khopesh. Chiny — Kusznik już jest. Inkowie/Sumerowie — pominąć/decyzja (kultury wczesne).
- **C) Wzory:** Celtowie ref-17; Germanie — dobrać z Referencje-jednostek.
Paczka też odzwierciedla 8C (sekcja 5). Plik gotowy do wklejenia do tasku Grupa C.

---

## [2026-06-22 23:22] DANE — PROPOZYCJA: wyjątkowa jednostka Żelaza per cywilizacja (DO DYSKUSJI)
Nowy kierunek Maciej: zamiast łatania Żelaza tu i ówdzie — **każda z 9 cyw. dostaje 1 wyjątkową jednostkę epoki Żelaza**
(opc. 2, gdzie zasługuje). To PROPOZYCJA do dyskusji; po akceptacji spakuję do Grupa C (oni robią staty atak/obrona).
**Jeszcze NIE wysyłam do UNITS.** Nazwy/broń = kierunek; staty = UNITS.

| Cyw. | Wyjątkowa jedn. Żelaza | Broń / styl walki | Opc. 2. (jeśli zasługuje) |
|---|---|---|---|
| Grecy | Thorakites (pancerny hoplita) | włócznia + kopis (krótki miecz) + duża okrągła tarcza (hoplon) + pancerz/hełm; ciężka piechota w formacji | Pikinier z sarissą (długa pika) |
| Rzymianie | Legionista kohortalny (Principes) | gladius + pilum (rzut) + scutum + lorica; salwa pilum → zwarcie mieczem, dyscyplina | — |
| Chińczycy | Kusznik powtarzalny (Zhuge nu) | powtarzalna kusza — szybki ostrzał dystansowy | Halabardnik z ji (drzewcowa, anti-konnica) |
| Inkowie | Gwardzista z champi (Sinchi) | champi = gwiaździsta maczuga (obuch) + mała tarcza + pikowany pancerz; miażdżący cios wręcz | — ⚠ Inkowie bez żelaza → elita brąz/miedź w epoce Żelaza |
| Zulusi | iButho z iklwa | iklwa (krótka żelazna włócznia kłująca) + duża tarcza skórzana (isihlangu) + maczuga; agresywne zwarcie | — |
| Egipt | Gwardzista z żelaznym khopesh | khopesh (zakrzywiony miecz sieczny) + tarcza + lekki pancerz; wręcz | Łucznik nubijski (łuk kompozytowy, mocny dystans) |
| Sumerowie | Mur tarcz (ciężki włócznik mezopot.) | długa włócznia + ogromna tarcza wieżowa; formacja muru tarcz (najstarsza falanga) | Łucznik z pawężnikiem (duet asyryjski) |
| Celtowie | Miecznik galijski (= ich jedn. specjalna, ref-17) | długi żelazny miecz sieczny + duża owalna tarcza + hełm; gwałtowna szarża, brawura | Rydwan galijski/brytyjski (essedum) — harce |
| Germanie | Berserk | topór/miecz, bez tarczy i pancerza; szał bojowy (+Atak, −Obrona), wręcz | drużynnik z frameą (zorganizowana włócznia) |

**Moim zdaniem na 2. jednostkę zasługują:** Chińczycy, Egipt, Sumerowie (tożsamość dwudzielna: dystans + wręcz/drzewcowa).
**Do dyskusji:** akceptujesz nazwy/role? które cyw. dostają 2.? co z Inkami (brąz w „żelazie")?
Po Twoich uwagach → aktualizuję `PACZKA-DLA-UNITS-od-DANE.md` (sekcja Żelazo) i dopiero wtedy idzie do Grupa C.

---

## [2026-06-23 00:02] DANE — Excel do analizy: `Jednostki-specjalne-przeglad.xlsx`
Zrobiłem plik do Twojej analizy (folder Civ). Zakładki: **Info · Kamień · Brąz · Żelazo**. Tylko jednostki RÓŻNE od standardowych
(nazwane zamienniki + super-jednostki). Każdy wiersz: Typ · **W zamian za (std LUB poprzednia specjalna)** · Rola · Broń/styl · Status · Uwagi.
- **Kamień (6):** Chaska, Huaracoc, Estólica (Inkowie), Izijula (Zulusi), Łucznik egipski, Łucznik sumeryjski.
- **Brąz (18):** 16 istniejących z units.json (Falanga, Legionista, Impi, Medżaj… + supery) + 2 PROPOZYCJE (Celtowie „Wojownik celtycki", Germanie „Wojownik germański framea").
- **Żelazo (16):** 1 istniejąca (Kusznik) + moje PROPOZYCJE: **9 wyjątkowych (1/cyw.)** + **6 opcjonalnych 2.** (Grecy sarissa, Chiny halabarda-ji, Egipt łucznik nubijski, Sumer łucznik z pawężnikiem, Celtowie rydwan, Germanie drużynnik).
- Kolory: żółty = PROPOZYCJA, szary = opc. 2., zielony = istniejąca super. Staty (Atak/Obrona…) = Grupa C po akceptacji.
- Plik = do analizy/dyskusji; po Twoich uwagach spinam finalną listę Żelaza do Grupa C.

---

## [2026-06-23 00:37] DANE — self-check założony + KOREKTA Q3 wdrożona (autonomicznie)
**A. Scheduled task:** założony **`civ-dane-self-check`** — co 10 min (`*/10 * * * *`); czyta `DANE.md`, wdraża nowe
dyspozycje od razu, raportuje tu + w czacie. (ID = `civ-dane-self-check`.)
**B. Odczyt świeżego DANE.md:** przyjąłem nowe reguły nagłówka (WDRAŻANIE OD RAZU bez pytania; AUTONOMIA-łańcuch;
RAPORTOWANIE WĄTKU; pytania tylko tekstem — bez AskUserQuestion). Folder = 9 skrzynek; pilnuję tylko DANE.md.
**C. WĄTEK — KOREKTA Q3 (wdrożone od razu):**
- (1) Pytanie: czy dodać pole „Typ główny" (przynależność nacji) do schematu?
- (2) Odpowiedź mastera (DANE.md): KOREKTA — dodać jako pole **ADDYTYWNE**, wszystkie 9 = **true** (pod przyszłe sub-nacje).
- (3) Decyzja/metoda: dodałem kolumnę **„Typ główny"** w `Cywilizacje.xlsx` (TRUE×9) → re-eksport TYLKO `civs.json`
  → `"Typ główny": true` dla wszystkich 9; **loader.ts tsc EXIT=0**; inne JSON-y nietknięte.
- (4) Uwaga dla SILNIK: pole jest nadmiarowe wzgl. `CivDef` (loader czyta bez błędu); przy wpinaniu dodaj `'Typ główny': boolean` (lub `string|null`) do interfejsu.

**STATUS:** plan DANE 1-5 + KOREKTA Q3 = wdrożone. `civs.json` = 9 typów; każdy: religia + bonus/minus + jednostka specjalna + `Typ główny:true`.

## [2026-06-23 08:00] DANE — przegląd: co dalej do pracy (na pytanie Maciej)
**Moja działka (DANE):**
1. Jednostki Żelaza — czekają na analizę `Jednostki-specjalne-przeglad.xlsx`; po decyzji → finalizacja + przekazanie Grupa C.
2. **Religie Celtów i Germanów — BRAK bonusów mechanicznych** w „Religie cywilizacji" (Spoleczenstwo-parametry: tylko 7 typów). civs.json ma same nazwy. Do dopisania 2 (uzgodnić z Grupa F). ← najkonkretniejszy następny krok.
3. (opc.) Kwantyfikacja bonusów/minusów cyw. (teraz opisowe) — jeśli logika ma je liczyć.

**Do zgłoszenia innym lane'om:**
4. Grupa C: zbudować jednostki Celtów+Germanów (Brąz+super, Żelazo) + jednostki Żelaza po decyzji — paczka gotowa.
5. Grupa F: dodać do `CivDef` pola `Religia` i `Typ główny` przy wpinaniu civs.json.
6. Rozjazd „Jednostka specjalna" (civs.json=ikoniczny zamiennik) vs super (units.json) — świadomie (8C); UI/SILNIK ma wiedzieć.
7. Map-gen (Civ-MAPA/SILNIK): spawn 90 miast / klaster 10 (min ~9 pól) — do implementacji.
8. Repo: `export-data.py` zaszyta ścieżka sandboxa — drobny cleanup (niski prio).
Rekomendacja: wziąć #2 (religie Celtów/Germanów) — czysto DANE, domyka religie dla 9 typów. Czekam na decyzję Maciej.

## [2026-06-23 08:08] DANE — przyjęte założenia + działanie autonomiczne (polecenie Maciej)
Dla każdego tematu przyjąłem najlogiczniejsze założenie i ruszyłem sam:
1. **Jednostki Żelaza** — założenie: 1 wyjątkowa/cyw.; 2. PRZYJĘTA dla Chiny/Egipt/Sumer; Inkowie = elita brąz/miedź (champi, bez kucia żelaza). → **ZROBIONE:** finał w `PACZKA-DLA-UNITS-od-DANE.md` (sekcja B) + `Jednostki-specjalne-przeglad.xlsx`. Build jednostek = Grupa C.
2. **Religie Celtów/Germanów** — dopisałem bonusy w „Religie cywilizacji" (`Spoleczenstwo-parametry.xlsx`): Celtowie (druidyzm: +10 Morale szarży, +2 Kultura ze świątyni/gaju, +1 Zadowolony na święta) i Germanie (Wotan/Odyn: +15% Atak w lesie, +2 jedność drużyny, +5 relacji z pokrewnymi). → **ZROBIONE w źródle (xlsx), backup zrobiony.** ⚠ `society-params.json` wciąż ma 7 — re-eksport tej sekcji (religie_cywilizacji 7→9) to lane **Civ-SILNIK/society** (nie ruszam society-params.json; export-data.py zakazany).
3. **Kwantyfikacja bonusów cyw.** — założenie: odłożyć na pas balansu (z SILNIK/ekonomią); v0.1 opisowo. Nie robię teraz.
4. **Grupa C (budowa jednostek)** — nie moja działka; paczka gotowa, czeka na wklejenie.
5. **Grupa F (CivDef: `Religia`, `Typ główny`)** — nie moja działka; zgłoszone.
6. **Rozjazd „Jednostka specjalna" vs super** — założenie: zostaje wg 8C; udokumentowane dla UI/SILNIK. Nie zmieniam.
7. **Map-gen 90/klaster 10** — nie moja działka; params w Excelu, implementacja MAPA/SILNIK.
8. **export-data.py (zaszyta ścieżka)** — nie moja działka (kod); zostawiam Grupa F.
Realnie wykonane przeze mnie: **#1** (finał założeń) + **#2** (religie 2 nacji w źródle). Reszta = założenia udokumentowane / handoff.
**FLAGA do Civ-SILNIK/society:** re-eksport `society-params.json` (religie_cywilizacji 7→9), bym ja tego nie robił (poza moim lane).

## [2026-06-23 08:38] DANE — dokumentacja deweloperska gotowa
Utworzyłem **`DOKUMENTACJA-DANE-cywilizacje.md`** (folder Civ, ~280 linii) — pełny dev-spec mojego zakresu:
zakres/granice lane, pipeline Excel→JSON (+ZAKAZ export-data.py/npm build), schemat `civs.json` (8 pól + start_gry),
roster 9 typów, model klastra mapy (90 = 9×10), religia (tabela 9 + bonusy + skąd), system jednostek (typy/zamienniki/super,
reguła per-epoka, propozycja Żelaza), **CONTROL PANEL parametrów** (który Excel/komórka → które pole JSON → konsument),
**pełna lista reguł R1–R15**, graf zależności, **interakcje z 8 działami** (SILNIK/EKONOMIA/MIASTO/DYPLOMACJA/AI/UNITS/MAPA/UI),
status + otwarte punkty, historia decyzji, konwencje.
- Parametry: potwierdzone, że są sterowane z Exceli (Cywilizacje.xlsx + Spoleczenstwo-parametry.xlsx) → eksport → JSON; udokumentowany workflow zmiany.
- ⚠ **Brak obrazka** z innymi działami w wiadomości Maciej — sekcję „interakcje" oparłem na obecnej strukturze; doprecyzuję po dosłaniu obrazka.

## [2026-06-23 08:45] DANE — interakcje (§11 dokumentacji) doprecyzowane wg listy sesji
Maciej dosłał obrazek z sesjami. Zaktualizowałem §11 w `DOKUMENTACJA-DANE-cywilizacje.md` na tabelę „dział → co konsumuje z DANE → punkt styku → otwarte". Potwierdzone/doprecyzowane:
- **Units i Battle = JEDNA sesja** („Civ - Units / Battle") — dodałem kolumnę „cechy bojowe per cyw." (DANE=kierunek, Units/Battle=staty+mechanika walki: bracing Falangi, brak kary flanki Legionu, szarża Celtów, zasadzka Germanów…).
- **AI = „opponent intelligence"** (steruje klastrem ~9 rywali tego samego typu; cel startu).
- **Civ - Master** = koordynacja (nie konsument runtime).
- Reszta działów (SILNIK, MIASTO, EKONOMIA, Dyplomacja, MAPA, UI) — punkty styku jak w tabeli.
Dokumentacja kompletna; brak otwartych pytań z mojej strony.

## [2026-06-24 09:55] DANE — porządki: katalog `Civ-DANE/` (informacja dla mastera)
Zebrałem moje materiały do jednego katalogu, żeby nie szukać po ~53 plikach w korzeniu.
- **Utworzony katalog `Civ-DANE/`** + `INDEX.md` (mapa wszystkich plików DANE).
- **Przeniesione tam (3):** `DOKUMENTACJA-DANE-cywilizacje.md`, `PACZKA-DLA-UNITS-od-DANE.md`, `Jednostki-specjalne-przeglad.xlsx`.
- **Zostają poza katalogiem (z powodem, w INDEX):** `Cywilizacje.xlsx` (źródło/pipeline — konwencja Exceli w korzeniu), `gra/data/civs.json` (plik gry — loader po ścieżce), `dyspozycje/DANE.md` + `DANE-DO-MASTERA.md` (kanał + self-check po stałej ścieżce), `Spoleczenstwo-parametry.xlsx` (współdzielony society/SILNIK).
- **Przegląd historycznych w moim temacie:** w korzeniu BRAK plików moich-historycznych do archiwizacji. W `archiwum/` są tylko units/miasto (nie moje).
- **FLAGA do mastera/MAPA:** `DESIGN-cywilizacje-spawn.md` — wspólny (roster+spawn; spawn=MAPA), CZĘŚCIOWO NIEAKTUALNY (mówi „7 typów, rozważane +2"; finalnie **9**). Część „roster" jest pełniej i aktualnie w mojej DOKUMENTACJI. Decyzja czy zostaje (spawn) czy do archiwum — master/Grupa A (nie ruszam cudzego pliku).
- **Opcja:** jeśli chcesz też fizycznie przenieść `Cywilizacje.xlsx` do `Civ-DANE/`, to decyzja pipeline'owa (trzeba zmienić ścieżkę w `export-data.py`) — mogę, po uzgodnieniu z SILNIK. Na razie zostawiłem (bezpieczniej).
- Uwaga OneDrive: bash chwilowo nie widział `Spoleczenstwo-parametry.xlsx` (dehydratacja piaskownicy) — plik istnieje, edycja religii (9 cyw.) zweryfikowana wcześniej.

OSTATNIO PRZETWORZONE (baseline self-check): **KOREKTA Q3 — „Typ główny"** (2026-06-23 00:37). Wszystko z DANE.md do tego momentu = wdrożone.

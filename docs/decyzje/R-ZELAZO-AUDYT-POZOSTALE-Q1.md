# R-ZELAZO-AUDYT-POZOSTALE-Q1 — audyt jakości pozostałych 19 modeli 3D epoki Żelazo

**Status:** ZAMKNIĘTA (2026-08-25) — T5-T11 wszystkie zintegrowane do `main`.

## Sytuacja

Kontynuacja `R-ZELAZO-MODELE-BRAKUJACE-Q1` (zamknięty — 6 jednostek Żelaza bez
dedykowanego modelu/ze zdublowanym modelem naprawionych i zdeployowanych, FALA 321).

Właściciel trafnie skorygował zakres: „mieć dedykowany model" ≠ „przeszedł proces
Opus 5". Pozostałe **19 jednostek** epoki Żelaza mają WPRAWDZIE dedykowany dispatch
po nazwie (nie generyczny fallback), ale żyją w starszych plikach generacji
(`jednostki-z1-mezopotamia.ts`, `jednostki-z2-srodziemne.ts`, `jednostki-z3-plemiona.ts`,
`jednostki-p6-super.ts`) — NIE w konwencji `<epoka>-<jednostka>-opus5.ts` używanej
w tej i poprzedniej serii (`R-BRAZ-SUPER-DISPATCH-Q1`, T1-T4 tej serii). Żadna z nich
nigdy nie przeszła rygorystycznego audytu: zmierzonej geometrii (nie tylko odczytu
kodu), sekcji historycznej ze źródłami, real-render dowodu. Ten sam wzorzec błędu
znaleziony wielokrotnie w T1-T4 (broń przebijająca ciało, tarcza niewidoczna dla
kamery gry, ramię bez zgięcia łokcia) mógł powstać w KTÓREJKOLWIEK z tych 19 jednostek
i nigdy nie zostać wykryty, bo nikt tego nie zmierzył.

## ECHO właściciela (2026-08-25, główny czat orkiestratora)

Właściciel: „to trzeba zrobić nowe modele opus 5 na wszystkich 25 pozostałych" —
doprecyzowane pytaniem ABC: **wyłącznie pozostałe ~19 jednostek nigdy niezweryfikowanych
pod tym kątem** (nie ponowna praca nad 6 już ukończonymi w `R-ZELAZO-MODELE-BRAKUJACE-Q1`).

## Lista 19 jednostek do audytu

| Jednostka | Kultura | Dzisiejszy plik |
|---|---|---|
| Garnizon Harappy | Harappa | `jednostki-z1-mezopotamia.ts` |
| Gwardia hetycka | Hetyci | `jednostki-z1-mezopotamia.ts` |
| Mur tarcz (Sargonid) | Sumerowie | `jednostki-z1-mezopotamia.ts` |
| Piechota neobabilońska | Babilonia | `jednostki-z1-mezopotamia.ts` |
| Gwardia Tyreńska | Fenicjanie | `jednostki-z2-srodziemne.ts` |
| Tyrski miecznik | Fenicjanie | `jednostki-z2-srodziemne.ts` |
| Wojownik z żelaznym khopesh | Egipt | `jednostki-z2-srodziemne.ts` |
| Thorakites | Grecja | `jednostki-z2-srodziemne.ts` |
| Evocati (super) | Rzym | `jednostki-p6-super.ts` (przez `buildSuperUnit`) |
| Triari (super) | Rzym | `jednostki-z2-srodziemne.ts` (przez `buildSuperUnit`) |
| Hieros Lochos (super) | Grecja | `jednostki-p6-super.ts` (przez `buildSuperUnit`) |
| Hastati | Rzym | `hastati-opus5.ts` — JUŻ konwencja Opus 5, lekka weryfikacja zamiast pełnej przebudowy |
| Berserker germański | Germanie | `jednostki-z3-plemiona.ts` |
| Wojownik germański (super) | Germanie | `jednostki-z3-plemiona.ts` (przez `buildSuperUnit`) |
| Miecznik galijski | Celtowie | `jednostki-z3-plemiona.ts` |
| Rydwan celtycki | Celtowie | `units.ts` (`case 'rydwan'` + `decorateChariot` — CZĘŚCIOWO generyczna bryła) |
| Drużynnik | Słowianie | `jednostki-z3-plemiona.ts` |
| iButho z iklwa | Zulusi | `jednostki-z3-plemiona.ts` |
| Katapulta | (brak kultury) | `units.ts` (lokalna funkcja) |

## Podział na tematy AutoBot (sekwencyjne, wspólny plik `units.ts`)

| Temat | Jednostki | Uzasadnienie grupowania |
|---|---|---|
| T5 | Garnizon Harappy, Gwardia hetycka, Mur tarcz (Sargonid), Piechota neobabilońska | Mezopotamia, jeden plik |
| T6 | Gwardia Tyreńska, Tyrski miecznik, Wojownik z żelaznym khopesh, Thorakites | Fenicja/Egipt/Grecja piechota, jeden plik |
| T7 | Evocati, Triari, Hieros Lochos, Hastati | Super-jednostki Rzym/Grecja + lekka weryfikacja Hastati (już Opus 5) |
| T8 | Berserker germański, Wojownik germański | Germanie |
| T9 | Miecznik galijski, Rydwan celtycki | Celtowie pozostali |
| T10 | Drużynnik, iButho z iklwa | Słowianie + Zulusi |
| T11 | Katapulta | Samodzielna, bez kultury |

## Kryteria wspólne dla wszystkich T (obowiązują każdy dispatch)

1. **Zmierzyć, nie zaufać kodowi** — dokładnie jak w T1-T4: zbudować model w żywym
   Three.js, zmierzyć relacje geometryczne (nie tylko obecność/liczbę mesh), sprawdzić
   kolizje broni z ciałem/koniem, orientację tarcz względem kamery gry (azymut 0 —
   dokładnie błąd znaleziony w T2), proporcje względem `HEX_R`.
2. Dodać/uzupełnić sekcję „ZGODNOŚĆ HISTORYCZNA" (styl K1-Kn, realne źródła cytowane,
   nie zgadywanie) jeśli jej nie ma lub jest niepełna.
3. Naprawić każdy realny błąd znaleziony pomiarem — nie zostawiać „jak jest" tylko
   dlatego że już istniało.
4. Zero regresji dla innych jednostek/kultur — potwierdzone testem regresji + 5 bramek
   referencyjnych + testy T1-T4 (bez regresji).
5. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9 poz. 6a)
   z dowodem nietautologiczności (mutacja pojedyncza per asercja, wzorem T4).
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Model/effort: **Opus 5 High dla Operatora i Evaluatora** (temat czysto wizualny,
   `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High. `opts.model` jawnie na
   KAŻDYM wywołaniu `agent()` (C-062 — nie tylko w `meta.phases`).

## Postęp implementacji

- **T5 — ZINTEGROWANE (2026-08-25, 1 runda).** Garnizon Harappy, Gwardia hetycka,
  Mur tarcz (Sargonid), Piechota neobabilońska. Plik nie nazywał ani jednego mesh —
  dodane nazwy/anchors umożliwiły pierwszy w historii pomiar. Znalezione i naprawione:
  włócznia Muru tarcz przechodząca przez własne ramię, przedramię przechodzące przez
  pole tarczy. Pozostałe trzy potwierdzone jako poprawne z dowodem pomiaru. Integration
  micro-fix: fałszywe zapewnienie w komentarzach dispatchu EN poprawione przed mergem
  (ryzyko dla T6). Jedno znalezisko danych (`Mur tarcz (Sargonid)` — Kultura vs nazwa)
  zarejestrowane osobno, wymaga decyzji właściciela.
- **T6 — ZINTEGROWANE (2026-08-25, 1 runda).** Gwardia Tyreńska, Tyrski miecznik,
  Wojownik z żelaznym khopesh, Thorakites. Ten sam plik-nigdy-niemierzalny problem
  co T5, ta sama naprawa (nazwy mesh + anchors). Znaleziono NOWĄ klasę błędu:
  element fizycznie niewidoczny z jedynej kamery gry (nie broń w ciele jak wcześniej)
  — miecz niesiony wzdłuż osi patrzenia, krzywizna khopesza w niewidocznej płaszczyźnie,
  hełm zasłaniający oczy Thorakitesa. Final Control naprawił 3 błędne komentarze na
  branchu; orkiestrator naprawił dodatkowo identyczny, przeoczony błąd komentarza z T5.
  3 znaleziska danych/projektowe zarejestrowane osobno.
- **T7 — ZINTEGROWANE (2026-08-25, 1 runda + integration micro-fix).** Evocati,
  Triari, Hieros Lochos, Hastati. Operator obalił dwa błędne założenia dispatchu:
  Hastati miał realne defekty mimo statusu „już Opus 5", `hastati-opus5.ts` jest
  jedynym modelem gracza, nie wariantem porównawczym. Znaleziono i naprawiono:
  drzewce dory w ramieniu Hieros Lochos, drzewce w chorągwi, hełm Evocatiego bez
  oczu, niewidoczny zarost Triariego, stopa pod terenem. Final Control naprawił
  7 nieprawdziwych komentarzy Operatora bez zużywania rundy 2 (autoryzacja w
  dispatchu tej roli, wszystkie fixy czysto tekstowe/martwy kod).
- **T8 — ZINTEGROWANE (2026-08-25, 1 runda + integration micro-fix).** Berserker
  germański, Wojownik germański. Dispatch był niewykonalny dosłownie (funkcja nie
  istniała w nazwanym pliku) — Operator zgłosił to jawnie i napisał ją tam, gdzie
  allowlista wskazywała, zero wpływu na sąsiadów. Znaleziono i naprawiono: topór
  nie trzymany, oczy zasłonięte kapturem, stopy pod terenem, miecz zamiast framei
  u jednostki dystansowej. Trzy defekty złapane dopiero wzrokiem na zrzucie (błąd
  projekcji YZ→ekran maskowany przez miarę długości zamiast kierunku). Final
  Control naprawił 3 nieprecyzyjne komentarze, w tym własne odkrycie błędnej
  lokalizacji cytatu Tacyta. 4 znaleziska zarejestrowane osobno.
- **T11 — ZINTEGROWANE (2026-08-25, 1 runda + integration micro-fix).** Katapulta
  (onager) — ostatni temat serii. 11 brył bez nazw/anchors, nigdy rygorystycznie
  zmierzona. Znalezione i naprawione pomiarem: oś obrotu ramienia miotającego
  przesunięta o 43,2% jego długości (błąd znaku sin/rotation.x — dwa przeciwne
  zwroty tego samego kąta), kubeł z kamieniem wiszący w powietrzu, liny osi-skrzyni
  niesięgające celu, koła odczepione od ramy, banderola oderwana od burty, brak
  liny skrętnej/spustu/zderzaka. Typ machiny (onager, nie balista) ustalony z danych
  projektu (tor paraboliczny pocisku w `battleScene.ts`), niezgodność chronologiczna
  (onager poświadczony dopiero od IV w. n.e.) udokumentowana jawnie, nie zamieciona.
  Operator złapał pomiarem trzy defekty własnej pracy przed oddaniem (lina
  kołowrotu niewidoczna z kamery gry, koło pod terenem, sworzeń spustu na styk).
  Evaluator (własny niezależny harness) potwierdził wszystkie kryteria i defekty,
  znalazł 4 nieprecyzyjne/fałszywe zdania w nowych komentarzach — ten sam wzorzec
  co T5-T10. Final Control zweryfikował od zera, naprawił 5 nieścisłych zdań jako
  integration micro-fix (czysto tekstowe). Dwa znaleziska poza allowlistą
  zarejestrowane osobno (brak nazwy jednostki dla machin oblężniczych w bitwie
  ręcznej — `manualBattle.ts:750`; aliasy onager/balista/trebuchet rozjeżdżające
  się między warstwami, dziś bez skutku).
- **T10 — ZINTEGROWANE (2026-08-25, 1 runda + integration micro-fix).**
  Drużynnik (Słowianie), iButho z iklwa (Zulusi). Znalezione i naprawione
  pomiarem: pas Drużynnika 0 pikseli (bryła zamknięta w kaftanie/rubasze),
  głowica miecza 0 pikseli, iButho i Impi praktycznie jedną figurką
  (odróżnialność 0.370 przy progu rodziny 0.558, iklwa kopią 1:1 włóczni
  Impi — po naprawie 0.589), nazwa EN „Druzhinnik" wracająca do generyka.
  Spójność kulturowa z T4 (Jeździec z oszczepami) sprawdzona i potwierdzona
  bez potrzeby synchronizacji. Evaluator (własny niezależny harness) wydał
  FAIL na 3 punktach — niepotrzebnie odpięty precyzyjny pin geometrii w
  teście T8, zmyślona liczba w uzasadnieniu K3, nieścisłe „jedyna różnica"
  w K1 pomijające `armor` — wszystkie potwierdzone i naprawione przez
  Final Control jako integration micro-fix (ten sam precedens co T7/T8/
  T11), bez zwrotu do rundy 2. Cztery znaleziska kosmetyczne zarejestrowane
  osobno (deski tarczy Drużynnika promieniste — dotyczy też T4; para
  Drużynnik/Miecznik galijski nadal poniżej progu, zależność od T9; próg
  zerowy H12 przepuszcza bryły „prawie martwe"; rozjazd
  `Atak dystansowy`/`missileAttack` i brak `armor` w `units.json`).
- **T9 — ZINTEGROWANE (2026-08-25, 1 runda, po odzyskaniu po awarii infra).**
  Miecznik galijski, Rydwan celtycki — ostatni temat serii. Operator's subagent
  padł (exit 137, OOM) po ukończeniu pracy ale przed commitem; orkiestrator
  odzyskał niescommitowany diff+raport z worktree, zweryfikował niezależnie
  (tsc/vite build/5 bramek referencyjnych/regresja T6-T7 zielone) i skomitował
  w jego imieniu, po czym dispatchował świeże Evaluator+Final Control przeciw
  odzyskanej pracy. Rozstrzygnięcie kwestii z dispatchu: współdzielona bryła
  rydwanu (mykeński/Shang/celtycki) to LUKA, nie świadomy wzorzec — cztery
  niezależne przesłanki potwierdzone przez obie role kontrolne. Naprawa w
  granicach allowlisty podniosła odróżnialność celtycki/mykeński z 0.0102 do
  0.390 (pełny próg 0.558 wymaga bespoke bryły, zarejestrowane osobno).
  Znalezione i naprawione pomiarem: krata na braccae 0px, torques w połowie
  szyi, kita helmu wisząca nad miską, brak oczu, poza miecza sprzeczna z
  Polibiuszem, tarcza rydwanu krawędzią do kamery, tarcza wisząca w powietrzu.
  Final Control potwierdził u źródła (nie tylko testem), że `retint()` nie
  wycieka między rydwanami i że dziś nie ma kolizji barw gracza z okuciami.
  Jedyny konflikt scalenia (z T10, oba dotknęły ten sam wiersz sąsiada w teście
  T8) rozstrzygnięty zgodnie z pre-weryfikowaną rekomendacją Final Control.
  Pięć znalezisk kosmetycznych/danych zarejestrowane osobno.
- **Seria R-ZELAZO-AUDYT-POZOSTALE-Q1 zamknięta — T5+T6+T7+T8+T9+T10+T11
  wszystkie zintegrowane do `main`.**

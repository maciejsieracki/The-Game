# decision-abc.md — R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1

STATUS TEGO PLIKU: **ROZSTRZYGNIĘTE 2026-09-03 (runda 2)** — konflikt opisany niżej został
zamknięty autoryzacją orkiestratora, zapisaną w `01-addendum-runda-2.md`. Plik zostaje jako
zapis ścieżki decyzyjnej; NIE jest już otwartym pytaniem ABC i nie blokuje tematu.

Poprzednia wersja tego pliku (runda 1) twierdziła, że 5 wpisów zostało „COFNIĘTYCH do stanu
origin/main" i że kryterium 5 jest „świadomie NIEZAMKNIĘTE". Po rundzie 2 to nieprawda —
zapis został poprawiony, bo mylił Final Control (zarzut Evaluatora nr 3, runda 2).

## 1. Konflikt kontraktu (runda 1) — opis, bez propozycji rozwiązania

GOAL 2 / kryterium końca 5 wymagały audytu CAŁEGO `terrain-improvements.json` po wzorcu
wycieku notatki deweloperskiej w polu `warunek` i naprawy KAŻDEGO znalezionego przypadku.

Audyt (grep `R-[A-Z-]+-Q\d+|ECHO|właściciel|RUNDA \d`, potwierdzony ręcznym przeglądem)
znalazł **7** wpisów: `farma`, `bydlo`, `owce`, `lama`, `stadnina`, `oboz_lowiecki`, `wyrab`.

Dla **5 z 7** (`farma`, `bydlo`, `owce`, `lama`, `stadnina`) istniały pre-istniejące bramki
z INNYCH tematów, spoza allowlisty rundy 1, twardo asercjujące obecność dat/fraz dev-notu
LITERALNIE w polu `warunek`:

- `gra/tools/farma-nie-w-lesie-test.cjs:480-482` — `farma.warunek`: „NIE na lesie",
  `2026-08-27`, `2026-07-21`;
- `gra/tools/hodowla-las-test.cjs:367-388` — `owce`/`bydlo`/`lama`/`stadnina.warunek`:
  „COFNIĘTY", `2026-08-27`/`2026-07-29`/`2026-09-03`.

Skrócenie tych 5 pól czerwieniło obie bramki (3 fail w `farma-nie-w-lesie-test`, 5 fail w
`hodowla-las-test`) — zweryfikowane uruchomieniem. Wyjście wymagało albo edycji plików spoza
allowlisty, albo pozostawienia dev-notu wbrew GOAL 2. Żadna z opcji nie mieściła się w
mandacie Operatora rundy 1 → DECISION_REQUIRED.

## 2. Rozstrzygnięcie (runda 2)

Orkiestrator autoryzował **rozszerzenie allowlisty** o te dwa pliki testowe, wyłącznie w
zakresie przeniesienia nośnika historii decyzji z `warunek` do nierenderowanego pola `uwagi`
(wzorzec `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`). Zapis autoryzacji: `01-addendum-runda-2.md`.

## 3. FAKTYCZNY stan po rundzie 2 (zastępuje opis z rundy 1)

- **Wszystkie 7 wpisów NAPRAWIONE**, nie cofnięte. Każdy ma krótki, czytelny dla gracza
  `warunek` oraz pełną, dosłowną historię decyzji (cytaty ECHO, ID tematów, daty) w nowym
  polu `uwagi`, którego `improvementAdapter.ts` nie renderuje.
- **Nic nie zostało cofnięte do `origin/main`.** Zdanie z rundy 1 o „5 wpisach COFNIĘTYCH"
  jest nieaktualne i nie opisuje dzisiejszego drzewa roboczego.
- **Kryterium 5 jest ZAMKNIĘTE** dla wszystkich 7 wpisów, na dwóch poziomach:
  - JSON (bramki `farma-nie-w-lesie-test.cjs`, `hodowla-las-test.cjs`) — kontrola
    pozytywna „brak sygnatury dev-notu w tekście gracza" + kotwice historii na CYTATACH
    ECHO (nie na samych datach, które prefiks `uwagi` produkowałby tautologicznie);
  - ŻYWO w Chromium (`wydarzenia-zbadano-karta-tech-real-render-test.cjs`, scenariusz
    `(B8)`) — `farma`, `bydlo`, `owce`, `lama` renderowane na realnej karcie bocznej.
- **Jedyny wpis bez ścieżki żywej: `stadnina`** — i to stan PRE-ISTNIEJĄCY, nie skutek tej
  zmiany. `tech.json` nie wymienia „Stadnina" w polu „Odblokowuje ulepszenie terenu" żadnej
  technologii (jedyne wpisy to Tartak/Posterunek, Glinianka/Warzelnia soli, Kamieniołom,
  Farma/Tarasy, Obóz łowiecki, Trzoda/Owce/Lama, Irygacja, Droga, Łodzie rybackie, Fort,
  Kopalnia złota, Droga brukowana), więc karta technologii „Jeździectwo" nie ma wiersza
  „Stadnina". CivPedia też nie jest ścieżką: `gra/src/data/wikiBundle.json`, folder
  `ulepszenia`, ma 17 haseł i `stadnina` NIE jest jednym z nich, a treść haseł to własny
  markdown encyklopedii, nie pole `warunek` z `terrain-improvements.json`.
  Doprowadzenie `stadnina` do karty technologii wymagałoby zmiany `gra/data/tech.json`
  (zawartość gry, poza allowlistą i poza GOAL tego tematu) — to jest kandydat na osobny
  temat, nie na cichą edycję w tej rundzie.

## 4. Co pozostaje otwarte

Nic blokującego ten temat. Sygnał do rozważenia jako OSOBNY temat (nie zgłoszenie
właściciela, obserwacja z audytu): `stadnina` nie ma żadnej ścieżki z karty technologii ani
hasła w CivPedii, mimo że `stadnina.tech = "Jeździectwo"`. To luka w danych, nie regresja
tego tematu.

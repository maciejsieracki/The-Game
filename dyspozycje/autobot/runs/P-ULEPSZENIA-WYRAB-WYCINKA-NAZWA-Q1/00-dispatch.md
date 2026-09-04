TEMAT: P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (treść/nazewnictwo)
ŚCIEŻKA: gra/data/terrain-improvements.json + gra/src/render/improvements.ts +
gra/src/main.ts + gra/src/map/improvement-build.ts (WYŁĄCZNIE wystąpienia nazwy
wyświetlanej „Wyrąb", patrz allowlista)
MODEL+EFFORT: claude-sonnet-5, effort medium (Operator) / claude-sonnet-5,
effort high (Evaluator) — temat treściowy, reguła bazowa R-PROC-AUTOBOT.md §5a.
Final Control Sonnet 5, effort high.

WYZWALACZ
"Zamień nazwę ulepszenia Wyrąb na Wycinka."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu
2026-09-04, nie powtarzaj, buduj na tym)
Klucz wewnętrzny ulepszenia to `wyrab` (`gra/src/render/improvements.ts:39`,
`gra/data/terrain-improvements.json`) — POZOSTAJE BEZ ZMIAN, nie dotyczy nazwy
wyświetlanej, zmiana klucza złamałaby zapisane stany gry/referencje.
Kanoniczna nazwa wyświetlana: `gra/data/terrain-improvements.json:174`
`"nazwa": "Wyrąb"`.
Dodatkowe, WŁASNE hardkodowane wystąpienia nazwy (NIE czytane z JSON w
runtime, wymagają osobnej zmiany dla pełnej spójności):
- `gra/src/render/improvements.ts:39` — `{ key: 'wyrab', label: 'Wyrąb',
  epoka: 1 }` w osobnej, statycznej liście etykiet UI (sprawdź w rundzie czy ta
  lista faktycznie zasila jakiś widoczny dla gracza element, czy jest martwa/
  redundantna wobec JSON — jeśli żywa, zmień `label`, jeśli martwa, zostaw
  komentarz w raporcie, nie usuwaj poza zakresem tego tematu).
- `gra/src/main.ts:12100` — `'Wyrąb' + costPart + ': +20 Pracy/turę przez 3
  tury...'` (komunikat hint przy zaznaczeniu akcji).
- `gra/src/main.ts:28014` — `'Wyrąb: +' + drewnoCredit + ' Drewna (pozostało '
  + st.turnsLeft + ' tury)'` (komunikat hint po zbiorze).
- `gra/src/main.ts:31437` — `` `[AI ${ownerId}] Wyrąb @ (${cmd.q},${cmd.r})...` ``
  (log konsoli AI — nie user-facing, ale spójność nie zaszkodzi; opcjonalnie).
- `gra/src/map/improvement-build.ts:471` — `` `${name} na lesie zabroniona —
  najpierw wyrąb las (Wyrąb w panelu ulepszeń).` `` — UWAGA: to zdanie zawiera
  DWA różne słowa o wspólnym rdzeniu: czasownik pospolity „wyrąb" (odmiana
  trybu rozkazującego czasownika „wyrąbać", NIE nazwa ulepszenia — zostaje BEZ
  ZMIAN) oraz rzeczownik własny „Wyrąb" w nawiasie, odnoszący się KONKRETNIE
  do nazwy ulepszenia w panelu — TYLKO ten drugi fragment zmienia się na
  „Wycinka".
Komentarze kodu (nie user-facing, poprawa kosmetyczna, NIE wymagana i POZA
zakresem tego dispatchu): `auto-improvements.ts:824,944,946`,
`improvement-build.ts:364,428,1279`, `lasy-modele.ts:152`.
`gra/data/wikiBundle.json` zawiera też wystąpienie — sprawdź w rundzie, czy to
plik GENEROWANY z innego źródła (wtedy popraw źródło, nie sam bundle, i
udokumentuj proces regeneracji) czy plik statyczny do edycji wprost.

GOAL
1. `gra/data/terrain-improvements.json:174`: `"nazwa": "Wyrąb"` →
   `"nazwa": "Wycinka"`.
2. `gra/src/render/improvements.ts:39`: `label: 'Wyrąb'` → `label: 'Wycinka'`
   (o ile ta lista jest żywa — zweryfikuj żywo w Chromium, nie zgaduj z kodu).
3. `gra/src/main.ts:12100,28014`: zamień „Wyrąb" na „Wycinka" w komunikatach
   hint widocznych dla gracza. Linia 31437 (log konsoli AI) — opcjonalnie, dla
   pełnej spójności, nie krytyczne.
4. `gra/src/map/improvement-build.ts:471`: zamień WYŁĄCZNIE fragment „Wyrąb w
   panelu ulepszeń" na „Wycinka w panelu ulepszeń" — NIE dotykaj czasownika
   „wyrąb las" wcześniej w tym samym zdaniu.
5. `gra/data/wikiBundle.json`: zaktualizuj zgodnie z ustaleniem czy to plik
   generowany czy statyczny (patrz RECON).
6. Klucz wewnętrzny `wyrab` (identyfikator w danych/kodzie) POZOSTAJE BEZ ZMIAN
   wszędzie — zmienia się WYŁĄCZNIE tekst wyświetlany graczowi.

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut Chromium: panel ulepszeń terenu (build mode) pokazuje „Wycinka"
   zamiast „Wyrąb" jako nazwę tej opcji budowy — zero pozostałości „Wyrąb"
   widocznych dla gracza w tym panelu.
2. Żywy test: hint pokazywany przy zaznaczeniu akcji wycinki na mapie
   (`main.ts:12100`) i hint po zbiorze Drewna (`main.ts:28014`) pokazują
   „Wycinka", nie „Wyrąb".
3. Komunikat blokady budowy na lesie (`improvement-build.ts:471`) pokazuje
   „...najpierw wyrąb las (Wycinka w panelu ulepszeń)." — czasownik „wyrąb"
   NIETKNIĘTY, tylko nazwa w nawiasie zmieniona.
4. `grep -rn "Wyrąb" gra/src gra/data` (poza komentarzami kodu, jawnie
   wyłączonymi z zakresu w GOAL) zwraca ZERO wystąpień w user-facing stringach.
5. Klucz `wyrab` (identyfikator) bez zmian — grep potwierdza brak regresji w
   zapisach stanu gry/testach referujących ten klucz.
6. `tsc --noEmit` czysty, istniejące testy dotykające ulepszeń terenu/wycinki
   lasu (grep `gra/tools/*wyrab*-test.cjs`, `gra/tools/*las*-test.cjs`,
   `gra/tools/*improvement*-test.cjs`) nadal zielone, 5 bramek referencyjnych
   zielone.

ALLOWLISTA (nic poza tym)
- gra/data/terrain-improvements.json (WYŁĄCZNIE pole `nazwa` wpisu `wyrab`).
- gra/src/render/improvements.ts (WYŁĄCZNIE `label:` w linii 39).
- gra/src/main.ts (WYŁĄCZNIE literały stringowe „Wyrąb" w liniach 12100,
  28014, opcjonalnie 31437 — zero innych zmian w tym pliku).
- gra/src/map/improvement-build.ts (WYŁĄCZNIE fragment „Wyrąb" w nawiasie,
  linia 471 — zero zmian w reszcie zdania/pliku).
- gra/data/wikiBundle.json (zgodnie z ustaleniem z RECON pkt 5).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana klucza `wyrab` gdziekolwiek, zmiana komentarzy
kodu (poza zakresem, nie wymagane), zmiana logiki mechaniki wycinki lasu,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-wyrab-wycinka-rename, gałąź
autobot/P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 4 za spełnione przez grep tylko w jednym pliku — sprawdź
WSZYSTKIE pliki wymienione w RECON, w tym `wikiBundle.json`. Zakaz założenia, że
`improvements.ts:39` jest martwe bez żywej weryfikacji w Chromium (otwórz panel
budowy, sprawdź czy ta etykieta się tam faktycznie pojawia). Zakaz zmiany
czasownika „wyrąb" w `improvement-build.ts:471` przez nieuwagę — to DWA różne
słowa w jednym zdaniu, zweryfikuj że po zmianie zdanie nadal brzmi poprawnie
gramatycznie po polsku.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) →
Operator (obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort
high) → integracja orkiestratora.

---

# RUNDA 2 — RATYFIKACJA ROZSZERZENIA ALLOWLISTY (orkiestrator, 2026-09-04)

## Powód — błąd w dispatchu rundy 1, nie błąd Operatora

Final Control rundy 1 wydał DECISION_REQUIRED na zarzucie 1 i miał rację: dispatch
rundy 1 był WEWNĘTRZNIE SPRZECZNY. RECON pkt 5 kazał „sprawdzić, czy wikiBundle.json
to plik GENEROWANY (wtedy popraw ŹRÓDŁO, nie sam bundle)", ale ALLOWLISTA nie
wymieniała żadnego pliku źródłowego — a do tego podawała nieistniejącą ścieżkę
`gra/data/wikiBundle.json` (realna: `gra/src/data/wikiBundle.json`).

Ustalenie Final Control (dowód z kodu): `tools/bundle-wiki-for-game.cjs:9-11,148` —
`gra/src/data/wikiBundle.json` jest GENEROWANY z `docs/encyklopedia/` oraz
`docs/PORADNIK-GRACZA/`. Operator rundy 1 poprawnie zmienił 4 pliki źródłowe, ale po
zarzucie Evaluatora (słusznym co do litery allowlisty) je ZREWERTOWAŁ — i to
stworzyło ukrytą pułapkę: **źródła mówią „Wyrąb", bundle mówi „Wycinka"
(hand-patch), więc najbliższa regeneracja bundla CICHO cofnie nazwę w encyklopedii
w grze**.

Orkiestrator ratyfikuje rozszerzenie allowlisty o pliki źródłowe bundla oraz nakazuje
zastąpienie hand-patcha REGENERACJĄ kanonicznym narzędziem.

## GOAL RUNDY 2

R2-1. Przywróć zmianę „Wyrąb"→„Wycinka" w 4 plikach źródłowych zrewertowanych w
   rundzie 1 (commit `908cfc9a`): `docs/encyklopedia/ulepszenia/wyrab.md`,
   `docs/encyklopedia/indeks.md`, `docs/PORADNIK-GRACZA/05-budowa-mapa.md`,
   `docs/PORADNIK-GRACZA/28-katalog-ulepszen.md`. Zmieniaj WYŁĄCZNIE nazwę
   wyświetlaną ulepszenia — nie tytuły sekcji „Rys historyczny", nie treść
   historyczną, nie nazwy plików (`wyrab.md` zostaje, klucz `wyrab` się nie zmienia).

R2-2. Zastąp hand-patch bundla REGENERACJĄ kanonicznym narzędziem:
   `node tools/bundle-wiki-for-game.cjs`. **UWAGA KRYTYCZNA:** regeneracja może
   wciągnąć NIEZWIĄZANY dryf między dzisiejszymi źródłami a ostatnio wygenerowanym
   bundlem. Po regeneracji obejrzyj diff `gra/src/data/wikiBundle.json` STRUKTURALNIE
   (zdekoduj JSON, porównaj liście — nie „na oko" po surowym diffie):
   - jeśli diff zawiera WYŁĄCZNIE zmiany „Wyrąb"→„Wycinka" — zostaw regenerację;
   - jeśli zawiera cokolwiek więcej — WYPISZ w raporcie każdą dodatkową zmianę
     (ścieżka w JSON + przed/po) i oceń, czy to bezpieczny dryf dokumentacji, czy
     coś, co wymaga osobnego tematu. Przy dużym, niezwiązanym dryfie: zostaw
     hand-patch, zgłoś BLOKADĘ z listą znalezisk zamiast wypuszczać niekontrolowaną
     zmianę treści encyklopedii.

R2-3. Zweryfikuj, że po zmianie źródło i bundle są SPÓJNE — ponowne uruchomienie
   `node tools/bundle-wiki-for-game.cjs` nie produkuje już żadnego diffu
   (idempotencja). To jest binarny dowód, że pułapka „cicha regeneracja cofnie
   nazwę" została zamknięta.

## ALLOWLISTA RUNDY 2 (rozszerzona względem rundy 1)

- Wszystko z rundy 1 (`gra/data/terrain-improvements.json`,
  `gra/src/render/improvements.ts:39`, `gra/src/main.ts` stringi 12100/28014/31437,
  `gra/src/map/improvement-build.ts:471`) — bez zmian, zostaje jak jest.
- **`gra/src/data/wikiBundle.json`** (POPRAWIONA ŚCIEŻKA — w rundzie 1 dispatch
  błędnie podawał `gra/data/wikiBundle.json`).
- **DODANE: 4 pliki źródłowe bundla** — `docs/encyklopedia/ulepszenia/wyrab.md`,
  `docs/encyklopedia/indeks.md`, `docs/PORADNIK-GRACZA/05-budowa-mapa.md`,
  `docs/PORADNIK-GRACZA/28-katalog-ulepszen.md`, WYŁĄCZNIE w zakresie nazwy
  wyświetlanej ulepszenia.
- Nowe/rozszerzone testy w `gra/tools/*-test.cjs`.
Zakazane bez zmian: zmiana klucza `wyrab`, zmiana mechaniki wycinki lasu, zmiana
komentarzy kodu (poza zakresem), `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## KRYTERIA KOŃCA RUNDY 2 (dodatkowo do 1-6 z rundy 1, które zostają w mocy)

R2-K1. `grep -rn "Wyrąb" docs/encyklopedia docs/PORADNIK-GRACZA` — zero wystąpień
   nazwy ulepszenia (dopuszczalne wyłącznie w treści historycznej, jeśli tam
   występuje jako słowo pospolite — wypisz każde takie i uzasadnij).
R2-K2. `node tools/bundle-wiki-for-game.cjs` uruchomione, a NASTĘPNE uruchomienie
   daje pusty diff (`git diff --stat gra/src/data/wikiBundle.json` = puste) —
   dowód idempotencji i spójności źródło↔bundle.
R2-K3. Diff bundla po regeneracji przeanalizowany strukturalnie i udokumentowany w
   raporcie (lista każdej zmienionej ścieżki JSON, przed/po).
R2-K4. `wyrab-wycinka-nazwa-live-test.cjs` nadal 10/10, `tsc --noEmit` czysty,
   5 bramek referencyjnych zielone.

## OBIEG RUNDY 2
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.

---

# RUNDA 3 — DOMKNIĘCIE RESZTKI W PORADNIKU (ratyfikacja orkiestratora, 2026-09-04)

## Powód
Evaluator rundy 2 znalazł DWA miejsca, w których „wyrąb" jest nazwą ULEPSZENIA
(w wyliczeniu obok „Tartak"/„obóz łowiecki"), a nie słowem pospolitym:
- `docs/PORADNIK-GRACZA/02-mapa-swiata.md:56` — `| Las | Tartak, wyrąb, obóz łowiecki |`
- `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:78` — „las — tartak lub wyrąb"
Oba pliki są w `PORADNIK_FILES` bundlera, więc gracz WIDZI starą nazwę w Civpedii.
Evaluator słusznie NIE obciążył tym Operatora — leżą poza allowlistą rundy 2.
Orkiestrator ratyfikuje rozszerzenie allowlisty o te dwa pliki.

## GOAL RUNDY 3
R3-1. `docs/PORADNIK-GRACZA/02-mapa-swiata.md:56` i
   `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:78` — zamień „wyrąb"
   występujące jako NAZWA ULEPSZENIA na „Wycinka" (zachowaj konwencję
   wielkości liter otoczenia: jeśli sąsiednie nazwy w wyliczeniu są małą literą,
   dopasuj się do nich — liczy się, żeby gracz widział nową nazwę, nie sztywna
   wielkość litery). NIE ruszaj czasowników pospolitych („najpierw wyrąb",
   „po wyrębie", „wyrąb lasu") ani treści historycznej.
R3-2. Zregeneruj bundle: `node gra/tools/bundle-wiki-for-game.cjs`; potwierdź
   idempotencję (drugie uruchomienie = pusty diff poza polem `generated`).
R3-3. ROZSZERZ `gra/tools/wyrab-wycinka-nazwa-live-test.cjs` o asercję pokrywającą
   TREŚĆ CIVPEDII (sekcje poradnika w `wikiBundle.json`) — to jest luka, przez
   którą ta resztka przeszła niezauważona w rundach 1-2: dotychczasowy test
   sprawdzał panel budowy, nie treść encyklopedii. Asercja binarna: w całym
   `wikiBundle.json` zero wystąpień „Wyrąb"/„wyrąb" w roli nazwy ulepszenia
   (dopuszczalne wyłącznie czasowniki pospolite — wypisz każde i uzasadnij).

## ALLOWLISTA RUNDY 3
- Wszystko z rund 1-2 (bez zmian).
- DODANE: `docs/PORADNIK-GRACZA/02-mapa-swiata.md`,
  `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md` — WYŁĄCZNIE wystąpienia
  nazwy ulepszenia.
- `gra/src/data/wikiBundle.json` (regeneracja), `gra/tools/*-test.cjs`.
Zakazane bez zmian: klucz `wyrab`, mechanika wycinki, komentarze kodu,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## KRYTERIA KOŃCA RUNDY 3
R3-K1. `grep -rn "[Ww]yrąb" docs/` — każde pozostałe wystąpienie jest czasownikiem
   pospolitym lub treścią historyczną; wypisz je wszystkie z uzasadnieniem.
R3-K2. W `gra/src/data/wikiBundle.json` zero wystąpień nazwy ulepszenia „Wyrąb"
   (i „wyrąb" w roli nazwy) — sprawdzone samodzielnym grepem po zdekodowanym JSON.
R3-K3. Rozszerzony live-test przechodzi i JEST NIETAUTOLOGICZNY: pokaż, że przed
   poprawką rundy 3 nowa asercja czerwieni się (mutacja/checkout starego bundla).
R3-K4. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, testy civpedia
   (`civpedia-ulepszenia-historia-batch`, `civpedia-historia-infra`,
   `civpedia-gra-id-mostek`) zielone.

## OBIEG RUNDY 3
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.

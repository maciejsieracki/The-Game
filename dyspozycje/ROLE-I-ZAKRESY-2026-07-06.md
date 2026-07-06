# ROLE, ZAKRESY, ODPOWIEDZIALNOŚCI I KOMUNIKACJA — v2 (2026-07-06)

Uzupełnia `OBIEG-KOMUNIKACJI-2026-07-06.md` (5 reguł) i `START-TU.md` (wejście).
Ogłasza Maciej. Obowiązuje: 3 czaty Cowork + wszystkie grupy Cursor + Maciej.

## WŁAŚCICIEL — MACIEJ
ZAKRES: cały projekt. ODPOWIADA ZA: decyzje designu i balansu (format A/B/C),
playtesty (robocza → kanon → finalna), hasła promocji („kanon do akceptacji"),
budżet/limity narzędzi. NIE ROBI: nic technicznego — żadnego kopiowania plików,
terminali, przenoszenia treści między czatami. KOMUNIKACJA: rozmawia z MASTEREM
(Cowork czat 1); innym czatom mówi co najwyżej „sprawdź kanał/skrzynkę".

## COWORK (produkcja — pracuje na WERSJI ROBOCZEJ)

### MASTER — czat Cowork nr 1
ZAKRES: koordynacja całości, żadnych plików gry. ODPOWIADA ZA: tłumaczenie decyzji
Macieja na zadania (wpisy w KANAL-PRACA), weryfikację krzyżową po każdym publishu
(grep stempla/markerów na dysku), pakiety promocyjne (DO-KANONU.md), raporty stanu
dla Macieja, rozstrzyganie kolizji ról, aktualność plików obiegu. NIE ROBI: kodu,
buildów, wgrywek, sterowania ekranem, restore. CZYTA: KANAL-PRACA, CURSOR-DO-MASTERA,
WERSJE, skrzynki. PISZE: KANAL-PRACA, DO-KANONU, raporty/schematy.

### INTEGRATOR — czat Cowork nr 2 (jedyny budujący)
ZAKRES PLIKÓW: cały kod źródłowy roboczej POZA `ui/**` (silnik, mapa, ekonomia,
walka, AI, render, main.ts) — obecnie baza = `gra-robocza\srcKopiaMaster`; oraz
bundle robocze: `gra-robocza\Gra-ROBOCZA.html`, `Gra-ROBOCZA-PLAYTEST-*`, hub
`START.html`, manifest, skrypty tools. ODPOWIADA ZA: implementację zadań z kanału
(może używać własnych subagentów wg domen), wpięcia zmian UX w main.ts, bramki
(tsc=0, weryfikacja-mapy PASS, determinizm/hashe), build + STEMPEL, publish roboczej,
hub, wpis do WERSJE.md natychmiast po publishu, meldunki w kanale po każdym kroku.
NIE ROBI: kanonu, finalnej, roota, gra/src (to Cursor), testów w grze (to Maciej).
KOMUNIKACJA: wyłącznie KANAL-PRACA.

### UX — czat Cowork nr 3
ZAKRES PLIKÓW: wyłącznie `srcKopiaMaster\ui\**`. ODPOWIADA ZA: implementację
interfejsu wg wytycznych designera (od Macieja), spójność wizualną, kontrakty wpięć
dla INTEGRATORA (co wpiąć w main.ts — wpisem w kanale), meldunki „UX-GOTOWE".
NIE ROBI: buildów, wgrywek, plików poza ui/, zmian mechanik gry.
KOMUNIKACJA: KANAL-PRACA. Karta szczegółowa: `_handoff/ROLA-UX.md`.

## CURSOR (utrwalanie — KANON i FINALNA; nie dotyka roboczej)

### Grupa G — Master/Plan (master Cursora)
ZAKRES: `gra/src` (drzewo kanonu), `gra-kanon\`, root (finalna). ODPOWIADA ZA:
promocję robocza→kanon WYŁĄCZNIE z pakietu `_handoff/DO-KANONU.md` na hasło Macieja
(przenosi wskazane pliki z srcKopiaMaster do gra/src + kopiuje bundle), promocję
kanon→finalna, wpis do WERSJE.md po każdej promocji, zarządzanie grupami A–F i 0
w Cursorze. NIE ROBI: buildów i publishu ROBOCZEJ (mutex — publikuje ją tylko
INTEGRATOR Cowork), zmian w srcKopiaMaster, kasowania czegokolwiek w gra-robocza.
KOMUNIKACJA: czyta DO-KANONU + WERSJE + KANAL-PRACA (tylko odczyt); pisze do
`_handoff/CURSOR-DO-MASTERA.md` (sprawy do Cowork) i do skrzynek swoich grup.

### Grupa F — Integrator (Cursor)
ZAKRES: pomocnik Grupy G przy promocjach/scaleniach w gra/src, na jej zlecenie.
NIE ROBI: żadnych publishy (ani roboczej, ani samodzielnie kanonu). Skrzynka jak dotąd.

### Grupy A / B / C / D / E — domeny (Cursor)
A = mapa świata, ruch, ulepszenia terenu · B = miasto, ekonomia, technologia ·
C = walka, jednostki · D = cywilizacje, dyplomacja · E = start, meta, AI.
ZAKRES: prace koncepcyjne i przygotowanie kodu DLA KANONU na zlecenie Grupy G lub
Macieja; wyniki wyłącznie przez własne skrzynki `<GRUPA>-DO-MASTERA.md` (czyta G).
NIE ROBIĄ: wgrywek, zmian w gra-robocza, bezpośrednich zmian w gra/src bez G.

### Grupa 0 — UI (Cursor) — UŚPIONA dla kodu
Kod interfejsu robi UX (Cowork). Grupa 0 = tylko wsparcie koncepcyjne/makiety na
wyraźne zlecenie Macieja; wyniki przez skrzynkę do G. Zakaz zmian w plikach ui/**.

## PRZEPŁYW PRACY (jedno spojrzenie)
Maciej → MASTER (rozmowa) → wpis w KANAL-PRACA → INTEGRATOR/UX (kod w srcKopiaMaster)
→ INTEGRATOR (bramki+build+publish roboczej+WERSJE) → MASTER (weryfikacja krzyżowa)
→ Maciej (playtest, OK/BUG) → MASTER (pakiet w DO-KANONU) → hasło Macieja → Grupa G
(promocja kanon, potem finalna + WERSJE) → Maciej (test kanonu/finalnej).
Kolizje/wyjątki rozstrzyga MASTER wpisem w kanale. Zasady nadrzędne: TYLKO DO PRZODU,
jeden publikujący na szczebel, wersje tylko w WERSJE.md, determinizm nietykalny.

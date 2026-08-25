# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T5`
GOAL: Audytować i podnieść do standardu serii Opus 5 (zmierzona geometria, sekcja
historyczna ze źródłami, real-render dowód) cztery jednostki mezopotamskie epoki
Żelaza: **Garnizon Harappy, Gwardia hetycka, Mur tarcz (Sargonid), Piechota
neobabilońska** — dziś mają dedykowany dispatch po nazwie, ale żyją w starszym pliku
generacji (`jednostki-z1-mezopotamia.ts`), nigdy nie przeszły rygorystycznego audytu.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1` (korekta zakresu właściciela po zamknięciu
`R-ZELAZO-MODELE-BRAKUJACE-Q1`): „mieć dedykowany model" ≠ „przeszedł proces Opus 5".
Pełny kontekst: `docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`. Ta sama standing
dyspozycja o pełnej autonomii (workflow, pętla, deploy+push bez check-inów) obowiązuje
nadal dla tej kontynuacji tego samego wątku.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T5-Q1`, odgałęziona od `origin/main`, osobny
worktree per rola.

## Allowlista

- `gra/src/render/jednostki-z1-mezopotamia.ts` — cztery funkcje: `buildGarnizonHarappy()`,
  `buildGwardiaHetycka()`, `buildMurTarcz()`, `buildPiechotaNeobabilonska()`. Dozwolone
  zmiany geometrii TYLKO tam, gdzie pomiar wykaże realny błąd (nie kosmetyczne
  przepisywanie działającej geometrii bez powodu).
- `gra/src/render/units.ts` — WYŁĄCZNIE linie dispatchu tych czterech jednostek w
  `buildNamedUnit()` (ok. `units.ts:1471-1474`), jeśli audyt wymaga korekty rdzenia
  dopasowania nazwy. Nic innego w tym pliku.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render, z
  asercjami mierzącymi REALNE relacje geometryczne dla wszystkich czterech jednostek).

Poza zakresem: wszystko poza tymi czterema jednostkami w tym pliku. Reszta
`jednostki-z1-mezopotamia.ts` (jeśli są tam inne funkcje) — NIE ruszać.

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

**Dane jednostek** (`units.json`, wszystkie Epoka=Żelazo, Tech=Hutnictwo żelaza,
czysto zwarciowe — `Atak dystansowy=0` dla każdej):
- Garnizon Harappy: Atak 8 / Obrona 8 / Pancerz 5, Kultura Harappa.
- Gwardia hetycka: Atak 9 / Obrona 8 / Pancerz 5, Kultura Hetyci.
- Mur tarcz (Sargonid): Atak 6 / Obrona 10 / Pancerz 7 (najwyższa obrona i pancerz
  z całej czwórki — nazwa „Mur tarcz" powinna się to odzwierciedlać wizualnie, np.
  duże, zachodzące na siebie tarcze), Kultura Sumerowie.
- Piechota neobabilońska: Atak 8 / Obrona 8 / Pancerz 5, Kultura Babilonia.

**Metoda audytu — dokładnie jak w T1-T4 tej serii, nie czytanie kodu:**
1. Zbuduj każdy model w żywym Three.js (worktree, real browser), zmierz bounding boxy
   i osie wszystkich nazwanych części.
2. Sprawdź kolizje broni z ciałem/tarczą (dokładnie błąd znaleziony w T1: lanca w
   udzie; T3: drzewce w ramieniu).
3. Sprawdź orientację tarcz względem kamery gry (stały azymut 0, `camera.ts` — dokładnie
   błąd znaleziony w T2: tarcza niewidoczna, `rotation.z` zamiast `rotation.x`) —
   TO JEST NAJBARDZIEJ PRAWDOPODOBNE MIEJSCE BŁĘDU, sprawdź w pierwszej kolejności dla
   wszystkich czterech, bo dokładnie ten sam wzorzec (`addTallOvalShield`-podobne
   helpery) już raz zawiódł w tym samym repo.
4. Zweryfikuj sekcję historyczną — jeśli jej nie ma, dodaj (styl K1-Kn,
   `braz-konnica-opus5.ts` jako wzór, realne źródła, nie zgadywanie). Kultury
   Harappa/Hetyci/Sumer/Babilonia epoki żelaza (ok. 1200-600 p.n.e.) — zweryfikuj
   uzbrojenie/pancerz/hełmy właściwe każdej kulturze i epoce, unikaj anachronizmów.
5. Napraw każdy realny błąd znaleziony pomiarem. Jeśli model jest już poprawny —
   udokumentuj to jawnie z dowodem pomiaru, nie zostawiaj bez potwierdzenia.

## Kryteria sukcesu

1. Wszystkie 4 modele zmierzone (nie tylko przeczytane) — dowód pomiaru w raporcie.
2. Zero kolizji broni z ciałem/tarczą, zero tarcz niewidocznych dla kamery gry (albo
   naprawione, jeśli znalezione).
3. Sekcja historyczna K-style dla każdej z 4 jednostek, ze źródłami.
4. Cztery jednostki wizualnie odróżnialne od siebie i od reszty rosteru — potwierdzone
   real renderem.
5. Zero regresji: testy T1-T4 tej serii (`zelazo-*`) + 5 bramek referencyjnych zielone.
6. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9 poz. 6a)
   z dowodem nietautologiczności per-asercja (mutacja pojedyncza, wzorem T4).
7. `tsc --noEmit` i `vite build` (C-001) czyste.
8. Szczegóły historyczne budzące niedającą się rozstrzygnąć wątpliwość — Operator
   dokumentuje wybór i uzasadnienie (§10), nie pyta właściciela.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Runda 1 — PASS-WITH-NOTES (zamknięte, po integration micro-fix)

Operator PASS, Evaluator PASS-WITH-NOTES, Final Control PASS-WITH-NOTES. Kluczowe
znalezisko: plik `jednostki-z1-mezopotamia.ts` nie nazywał ani jednego mesh i nie miał
`userData.anchors` — dlatego przez cztery poprzednie tematy serii nikt go nie sprawdził
(punkty odniesienia musiałyby być wpisane liczbowo w test, czyli test mierzyłby sam
siebie). Operator dodał nazwy/anchors wszystkim 143 mesh, zmierzył geometrię w żywym
Three.js i znalazł dwa realne błędy w Murze tarcz: włócznia przechodząca przez własne
ramię (ta sama klasa błędu co T1/T3) i przedramię przechodzące na wylot przez pole
tarczy w kolorze gracza. Oba naprawione. Pozostałe trzy jednostki (Gwardia hetycka,
Piechota neobabilońska, Garnizon Harappy) potwierdzone jako geometrycznie poprawne —
zero przenikania, zero błędu orientacji tarczy z T2 — z dowodem pomiaru, nie na słowo.

Trzy anachronizmy historyczne (upadek imperium hetyckiego, rozjazd Sumerowie/Sargonid
~1300 lat, Harappa epoki brązu vs epoka żelaza gry) nazwane wprost w sekcji K, nie
zamiecione — `units.json` poza allowlistą, nietknięty, decyzja badawcza per §10.

**Integration micro-fix (orkiestrator, przed mergem):** Evaluator i Final Control
znaleźli fałszywe zapewnienie w komentarzach przy dispatchu EN — twierdzenie, że te 4
linie są „jedyne w całej rodzinie" z rdzeniem EN i że „ścieżka angielska jest realna,
nie teoretyczna" — nieprawda w obu przypadkach (min. 3 kontrprzykłady w tym samym
pliku 3-6 linii niżej; wszystkie żywe wywołania `buildUnitModel` przekazują PL, nie
EN — dodany rdzeń EN jest utwardzeniem defensywnym, nie naprawą aktywnego błędu).
Final Control: realne ryzyko dla T6, który audytuje sąsiednie jednostki w tym samym
pliku. Poprawiono oba miejsca (linia dispatchu w `units.ts` + nagłówek pliku) przed
mergem, zweryfikowane ponownie w pełni (tsc/build/72 testów tematu/5 bramek
referencyjnych zielone).

Zmergowane do `main`, zweryfikowane niezależnie przez orkiestratora (tsc/vite build/
testy tematu+T1-T4/5 bramek referencyjnych zielone).

## Raport terminalny dispatchu

ZMIANY/COMMIT: branch `autobot/ZELAZO-AUDYT-T5-Q1`, commit `dc7f7bb4`, zmergowane do
`main`.
TESTY: kryteria sukcesu 1–8 spełnione, potwierdzone niezależnie 3-krotnie + orkiestrator
po merge.
BLOKADY: brak (poprawki komentarzy wykonane jako integration micro-fix, nie blokujące).
RUNDY: 1/5 (zamknięte pozytywnie).
NASTĘPNY KROK: T6 (Fenicja/Egipt/Grecja piechota).
DEPLOY/PUSH: git push (main) WYKONANO; deploy ROBOCZA po zamknięciu T6-T11.

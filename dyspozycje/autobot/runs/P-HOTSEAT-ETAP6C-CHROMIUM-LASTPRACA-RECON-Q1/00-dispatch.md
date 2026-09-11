TEMAT:  P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Final Control tematu `R-HOTSEAT-ETAP6C-ECONOMY-Q1` sklasyfikował jako
`DO DECYZJI CZŁOWIEKA`: `setOwnerPracaPool()` (main.ts, akcesor Etapu 3, NIE
zmieniony w Etapie 6c) ma bezwarunkowy efekt uboczny `_lastPraca =
playerPracaPool`, ale `playerPracaPool` jest aliasowane WYŁĄCZNIE dla
`HUMAN_OWNER_PRIMARY` (fotel 0). Przy realnym drugim fotelu człowieka
HUD-owy czip „Praca" po końcu tury pokazywałby pulę fotela 0, nie fotela
który właśnie skończył turę. **ECHO właściciela 2026-09-11: przebuduj cache
`_last*` na strukturę per-fotel TERAZ** (nie zostawiaj jako known-issue) —
problem stał się realny na ścieżce krytycznej odkąd `R-HOTSEAT-ETAP8-
DYPLOMACJA-UI-Q1` zamknął CAŁY plan hot-seat i drugi fotel może być realnie
używany produkcyjnie.

## DLACZEGO TO JEST RECON, NIE OD RAZU IMPLEMENTACJA

Wstępne rozpoznanie orkiestratora (`grep -n "_lastPraca\|playerPracaPool"
gra/src/main.ts`) pokazuje, że to NIE jest jedna zmienna do przepięcia na
Mapę, tylko klaster CO NAJMNIEJ pięciu współdzielonych zmiennych modułowych
(`_lastPraca`, `_lastPracaUpkeep`, `_lastPracaAutoUlepszeniaKoszt`,
`_lastPracaCudaKoszt`, `_lastPracaRate`, prawdopodobnie też `_lastKultura` —
zweryfikuj czy to ten sam klaster czy osobny), silnie powiązanych z
POJEDYNCZĄ zmienną globalną `playerPracaPool` (main.ts:11065), z gęstą
historią komentarzy o wcześniejszych subtelnych regresjach („REGRES2", „4
drenaże `_lastPracaRate`" — main.ts ok. 11065-11140). To dokładnie ten sam
rodzaj ryzyka, dla którego Etapy 6a-6f hot-seatu ZAWSZE robiły osobną rundę
recon PRZED implementacją (wzorem
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-Q1/` i analogicznych dla
6a/6b/6d/6e/6f) — ten temat ma robić TO SAMO, nie zgadywać architektury z
marszu.

## GOAL (WYŁĄCZNIE RECON — zero zmian w `gra/src/`)

Dostarcz dokument (docs-only, wzorem poprzednich recon Etapu 6) odpowiadający
na:

1. **Pełna inwentaryzacja klastra**: wszystkie zmienne modułowe `_last*`
   powiązane z Pracą/Kulturą per-turowym podsumowaniem HUD (nie tylko
   `_lastPraca` — przeczytaj CAŁY main.ts wokół deklaracji ok. 11065-11140 i
   znajdź wszystkie pokrewne), z numerami linii deklaracji i KAŻDEGO miejsca
   odczytu/zapisu (przybliżona liczba wystąpień per zmienna).
2. **Który HUD/UI faktycznie czyta te zmienne** (np. czip „Praca" po końcu
   tury) — dokładne miejsce w `gra/src/ui/*.ts` lub `main.ts` (funkcja +
   linia), żeby było jasne co realnie migrujemy i po co.
3. **Wzorzec migracji** — czy dokładnie ten sam wzorzec co Etap 6c
   (`Map<ownerId, T>` per-fotel, pętla po `humanSeats.humanOwnerIds`,
   `isHuman(ownerId)`) da się zastosować tu bez zmiany semantyki dla
   pojedynczego gracza (dziś `humanOwnerIds.length===1` musi zachowywać się
   IDENTYCZNIE jak dziś — zero regresu wizualnego/liczbowego w trybie
   jednoosobowym).
4. **`playerPracaPool` sama w sobie** — czy TA zmienna też wymaga migracji na
   per-fotel (bo to ONA jest źródłem `_lastPraca`), czy wystarczy migrować
   tylko warstwę `_last*` cache nad nią. Jeśli `playerPracaPool` też wymaga
   migracji — to jest dużo większy temat (sama pula Pracy, nie tylko jej
   cache do wyświetlania) i recon MUSI to jawnie nazwać jako osobne pytanie
   ABC do właściciela, nie zakładać milcząco.
5. **Ryzyka regresji** — na bazie istniejących komentarzy w kodzie
   („REGRES2", „4 drenaże") wypisz KONKRETNIE, które miejsca są najbardziej
   podatne na powtórzenie już raz popełnionego błędu, i jak test regresyjny
   ma to pokryć.
6. **Plan bramki dowodowej** — w tym brakująca bramka Chromium dla Klastra F
   (auto-ulepszenia terenu) i Klastra G (write-site cache HUD) z Etapu 6c,
   które Final Control też wskazał jako brakujące (pkt 1 tego samego
   znaleziska) — czy naprawa `_lastPraca` może/powinna dostarczyć tę samą
   bramkę na żywym Chromium przy okazji, czy to osobny temat.
7. **Warianty implementacji** (co najmniej 2, z realnymi za/przeciw) — np.
   (A) pełna migracja całego klastra `_last*` na `Map<ownerId,...>` teraz,
   (B) węższy fix — tylko `_lastPraca` (najbardziej widoczny w HUD) migruje
   teraz, reszta klastra zostaje jako known-issue do kolejnego tematu.

Zero propozycji "gotowego rozstrzygnięcia" bez przedstawienia wariantów —
to jest przygotowanie do decyzji orkiestratora/właściciela o zakresie
implementacji, nie sama implementacja.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Dokument recon istnieje pod `dyspozycje/autobot/runs/
   P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1/01-operator-recon.md`.
2. Odpowiada na WSZYSTKIE 7 punktów GOAL, z cytatami kodu (plik+linia) dla
   każdego twierdzenia — zero twierdzeń bez wskazania miejsca w kodzie.
3. Zero zmian w `gra/src/**`, `gra/data/**` — to jest recon, `git diff`
   pokazuje wyłącznie nowy dokument.
4. Evaluator niezależnie zweryfikował KAŻDY cytat kodu (linia+treść) i
   potwierdził że numery linii/nazwy funkcji są dokładne w chwili sprawdzenia.

## Allowlista

- `dyspozycje/autobot/runs/P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1/*.md`
  (nowe pliki, wyłącznie ten temat)

Zakazane: `gra/src/**`, `gra/data/**`, `gra/tools/**`, pliki z sekretami,
`docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-etap6c-lastpraca-recon`, gałąź
`autobot/P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1`, baza `origin/main`.
Dokument-only — brak builda potrzebnego do tego tematu.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 600 słów w RAPORCIE (sam dokument recon może być dłuższy — to
osobny artefakt, nie raport rundy); zakaz `git add -A`. Nie integrujesz, nie
deployujesz, nie pushujesz, nie implementujesz.

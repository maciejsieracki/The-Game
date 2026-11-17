# R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1 — obrona Operatora na zarzuty Evaluatora (bd56eb196)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiary i narzędzie; kod gry NIE zmieniany)
TEMAT: R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1
GOAL: (a) odsetek zmarnowanego ruchu strzelców po zderzeniu na ≥5 ziarnach i ≥3 składach; (b) doktryny Obrona/Ostrzał, rozkaz ręczny, uciekinierzy, mur oblężniczy po FALI 745/747; (c) anomalia determinizmu e20cd0b5 — odtworzenie na ≥20 przebiegach.
BAZA/KANDYDAT: d49eb02573d8ca1e5f7ab105fdeaebea7c612e33 (checkout --detach); kod gry = origin/main 71ca0e588 (bez zmian w gra/src).
ZMIANY-COMMIT: patrz sekcja COMMIT poniżej (SHA końcowy w polu sha zwrotki).

## Odpowiedzi na zarzuty

Zarzut 1 (a) — PRZYJMUJĘ (poprawka + dowód).
- Dodano dwa składy z kontaktem wręcz: C3 `Konnica:8,Hastati:6` vs `Hastati:8,Lucznik:6` oraz C4 `Hastati:12,Lucznik:4` vs `Hastati:10,Konnica:4` (gra/tools/battle-full-move-gaps-measure.cjs, COMPS). Każdy na ziarnach 1-5: 5/5 zderzeń.
- C1 (`Lucznik:10,Hastati:6` vs `Hastati:10,Lucznik:4`) zostaje w pomiarze i nadal daje 0/5 zderzeń (31-34 rundy, bez kontaktu) — raportowany jako „bez zderzenia”, poza sumą MP.
- Pomiar: 4 składy z kontaktem × 5 ziaren = 20 przebiegów z zderzeniem (kryterium ≥5 ziaren i ≥3 składów spełnione). Dane: evidence/measure-measure.json (`runs`, `totals`, `perComp`).
- Wyniki (surowe sumy z JSON, definicja szeroka jak w r1):

| skład | ziarna | zderzenie | aktywacje strzelców | pula MP | niewykorzystane MP | niewyjaśnione MP | niewyjaśnione % puli |
|---|---|---|---|---|---|---|---|
| C0 Hastati:8,Lucznik:6,Konnica:4 vs Hastati:14 | 1-5 | 5/5 | 964 | 2892 | 1337 (46,2%) | 377 | 13,0% |
| C1 Lucznik:10,Hastati:6 vs Hastati:10,Lucznik:4 | 1-5 | 0/5 | — | — | — | — | NIE ZMIERZONO (brak zderzenia) |
| C2 Lucznik:8,Konnica:6 vs Hastati:8,Konnica:4 | 1-5 | 5/5 | 443 | 1329 | 709 (53,3%) | 111 | 8,4% |
| C3 Konnica:8,Hastati:6 vs Hastati:8,Lucznik:6 | 1-5 | 5/5 | 285 | 855 | 502 (58,7%) | 138 | 16,1% |
| C4 Hastati:12,Lucznik:4 vs Hastati:10,Konnica:4 | 1-5 | 5/5 | 822 | 2466 | 1030 (41,8%) | 269 | 10,9% |
| SUMA (20 przebiegów z zderzeniem) | | 20/20 | 2514 | 7542 | 3578 (47,4%) | 895 | 11,9% |

- Definicja wąska (zarzut: „udział zależy od canStrike”): dodano pole `shooterLeftUnexplainedNarrow` (bez warunku canStrike jako blokady). Wynik: 895 MP = 11,9% — identycznie jak definicja szeroka. Liczba aktywacji „tylko canStrike” (stoi w zasięgu wolnego wroga, bez innej blokady) wynosi 0 (`totals.canStrikeOnlyActs` = 0). Ta część zarzutu jest ODRZUCONA na podstawie danych: dla tego zbioru canStrike nie zmienia klasyfikacji.
- Przegląd 895 MP „niewyjaśnionych” case-by-case: NIE ZMIERZONO. Pola `unexplainedList` niosą flagi (freeNew, pathExists, psb, mounted, mp), ale ręczna ocena każdego przypadku nie została wykonana; liczba 11,9% jest kandydatem, nie potwierdzonym defektem (jak w r1). Próg odsetka — decyzja ABC właściciela, nie narzędzia.
- Dodatkowa poprawka: 48,5% z raportu r1 zmienia się na 47,4% po dołożeniu składów C3/C4 i pełnym zestawie 20 przebiegów (liczby z JSON, nie z pamięci).

Zarzut 2 (b, manual i mur oblężniczy) — CZĘŚCIOWO ODRZUCAM uzasadnienie, NIE ZMIERZONO pozostaje.
- Zarzut twierdzi, że drivery są gotowe. Sprawdzone: gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs (705 linii) i gra/tools/siege-manual-battle-live.cjs (363 linii) NIE zawierają pomiaru `moveLeft`, ruchu po ciosie ani flagi `doctrineExempt` (grep: brak trafień poza scenariuszem D3-doctrine-aggressive). Istniejące drivery sprawdzają cykl życia rozkazu i zachowanie oblężnicze, nie regułę pełnego ruchu po ciosie.
- Brak pomiaru dla rozkazu ręcznego i muru oblężniczego w tej rundzie. Uzasadnienie poprawione: istniejące testy na żywo nie rejestrują zdarzeń ruch/cios dla jednostek w rozkazie ręcznym; pomiar wymaga nowego driver'a (wstrzyknięcie rozkazu przez ścieżkę produkcyjną + zapis moveLeft po ciosie). To jest follow-up, nie zrobiony w tej rundzie.
- Obrona i Ostrzał — PRZYJMUJĘ jako dowód: ponowiony pomiar na ziarnach 1-5 (składy C0, wymuszenie doktryny w pamięci przeglądarki, jak w r1), wyniki z JSON:
  - Obrona (def-defensive): 397 aktywacji po zderzeniu (181 w doktrynie, 216 uciekinierów), ruch po ciosie: 0.
  - Ostrzał (atk-skirmish): 2246 aktywacji (1231 w doktrynie, 1015 uciekinierów), ruch po ciosie: 0.
  - Dane: evidence/measure-doctrine.json (ziarna 1-5, zastępuje measure-doctrine-seed1.json i poprzednie ziarna 2-5).
- Uciekinierzy: w pomiarze `measure` 662 aktywacje uciekinierów po zderzeniu (exemptRouted = 662), ruch po ciosie 0.

Zarzut 3 (c, anomalia e20cd0b5) — PRZYJMUJĘ narzędzie, ODRZUCAM wniosek „nie odtworzono”, bo odtworzenie nie jest pełne.
- Użyto narzędzia wskazanego przez FC: gra/tools/battle-full-move-strike-test.cjs z BFM_PART=det, ziarno 1, sklad domyślny (C0). Wyniki: 21 przebiegów (7 wywołań × 3), wszystkie skrót 14f9e9bbefc63f74ba042df02e716f88 — 21/21 identycznych (dane: evidence/det-strike-tool-n21.txt).
- Dodatkowo tym samym składem i ziarnem narzędzie gaps-measure (BFG_PART=det, N=20): 20/20 identycznych (evidence/measure-det.json).
- Anomalia e20cd0b5 NIE ODTWORZONA w 41 przebiegach (dwa narzędzia). Trójka z FC nie jest jednoznacznie zidentyfikowana w dispatchu; hipotezy timing/obciążenia NIE ZMIERZONO (nie testowano obciążenia CPU).

Zarzut 4 (narzędzie: msg i checks) — PRZYJMUJĘ, poprawka w gra/tools/battle-full-move-gaps-measure.cjs:
- Tryb doctrine: pole `msg` jest puste dla kryteriów zaliczonych (`cAct`, `cMv`); wcześniej „NIE ZMIERZONO” wypisywało się przy ok:true.
- Check „(inv) brak błędów strony” był stałym `true`. Usunięto go; niezmiennik jest egzekwowany w `openPage` (asercja `bledy strony` rzuca wyjątek → kod wyjścia 1). Komentarz w kodzie to opisuje.
- `shooterMoveAfterHit` i `shooterMoveAfterHitActs` liczone identycznie: zostawiono tylko `shooterMoveAfterHit`.

Zarzut 5 (dowód mutacyjny) — PRZYJMUJĘ, dowód poniżej.
- Mutacja na kopii: gra/tools/zz-mut-gaps.cjs (kopia narzędzia) z `if (e && e.doctrineExempt) {` zamienioną na `if (e && !e.doctrineExempt) {` (sed; 1 trafienie). Uruchomienie: BFG_PART=measure BFG_COMP=0 BFG_SEEDS=1.
- Wynik: `FAIL (b) doktryna Obrona/Ostrzal i uciekinierzy NIE wykonuja ruchu po ciosie -- ruch po ciosie u wylaczonych: 96 z 194 aktywacji`, kod wyjścia 1 (ok: pozostałe checks zielone).
- Kopia zz-mut-gaps.cjs usunięta przed commitem.
- Mutacja kodu gry (cofnięcie FALI 745/747) NIE wykonana i NIE jest twierdzona: dispatch wymaga mutacji narzędzia na kopii, a nie gry; test gry nie jest przedmiotem tego tematu.

## Gates (surowe wyjście, po npm ci w gra/, po zmianach narzędzia)
- node tools/logic-test.cjs: `LOGIC OK (213/213)`, exit 0
- node tools/tech-tree-test.cjs: `tech-tree-test: 20 pass, 0 fail`, exit 0
- node tools/research-test.cjs: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
- node tools/unit-replace-test.cjs: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- node tools/combat-test.cjs: `COMBAT TEST: 6/6 pass`, exit 0
- npx tsc --noEmit: exit 0
- git diff --check: exit 0 (czysto)

## Pliki (allowlista)
- gra/tools/battle-full-move-gaps-measure.cjs (zmiana: składy C3/C4, definicja wąska, poprawki msg/checks)
- dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/evidence/measure-measure.json (scalone 25 przebiegów: C0/C2/C3/C4 ziarna 1-5, C1 ziarna 1-5 bez zderzenia)
- dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/evidence/measure-doctrine.json (ziarna 1-5, def-defensive i atk-skirmish)
- dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/evidence/det-strike-tool-n21.txt (nowy, surowe wyjście 21 przebiegów)
- usunięte: evidence/measure-doctrine-seed1.json (zastąpione przez measure-doctrine.json ziarna 1-5)
- measure-det.json bez zmian (r1, 20/20)
- Kod gry (gra/src, battleScene.ts) NIE zmieniany. WERSJE.md NIE zmieniany. Dowody PNG NIE nadpisywane.

## Commit
Commit lokalny w gałęzi worktree (bez push, bez integracji). SHA: podany w polu sha zwrotki.

## TESTY
Pomiary na żywo (Chromium, 3D, tryb pomiń, vite w pamięci): measure 25 przebiegów (ok), doctrine 10 (ok), det-strike 21 (ok), mutacja 1 (FAIL zgodnie z oczekiwaniem).

## BLOKADY
- Rozkaz ręczny gracza i mur oblężniczy (b): NIE ZMIERZONO — wymaga nowego driver'a z pomiarem moveLeft po ciosie; istniejące drivery tego nie mierzą (grep, dowód w sekcji zarzutu 2).
- Przegląd 895 MP „niewyjaśnionych” case-by-case: NIE ZMIERZONO.
- Próg odsetka zmarnowanego ruchu: decyzja ABC właściciela (brak progu w narzędziu).
- Anomalia e20cd0b5: NIE ODTWORZONA w 41 przebiegach; przyczyna (timing/obciążenie) NIE ZMIERZONA.

## RUNDY
Obrona do Operatora r1 (zarzuty FAIL bd56eb196). Ta odpowiedź: runda 2/5 tematu operatora.
Ostatni werdykt Evaluatora: FAIL (bd56eb196). Decyzja wymagana: ABC — próg odsetka (a) i kierunek dla (b) manual/siege (nowy temat driver'a).

## NASTĘPNY KROK
Evaluator (SONNET) weryfikuje poprawki: wąska definicja, składy C3/C4, doctrine ziarna 1-5, det-strike-tool-n21.txt, mutacja (sekcja Zarzut 5). Potem FC. Nowy temat (poza tym zakresem, do decyzji orkiestratora): driver pomiaru rozkazu ręcznego i muru oblężniczego (ruch po ciosie).

## UWAGI-DLA-ORKIESTRATORA
- Kandydat R-WEB (nie naprawiany): 895 MP niewyjaśnionego ruchu strzelców (11,9% puli); najwyższy udział w składzie C3 (16,1%), najniższy w C2 (8,4%).
- Kandydat ABC: czy skład C1 (Łucznik-przewaga, 0/5 zderzeń) jest zamierzony.
- Anomalia e20cd0b5: wymaga identyfikatora trójki z FC RESIDUAL-INFANTRY-Q2 (ziarno + skład + narzędzie); bez tego nie ma reprodukcji celowanej.

DEPLOY/PUSH: NIE WYKONANO

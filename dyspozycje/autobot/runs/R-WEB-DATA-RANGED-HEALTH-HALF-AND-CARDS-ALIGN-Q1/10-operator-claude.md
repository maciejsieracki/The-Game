# R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (balans danych jednostek + karty)
TEMAT: R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1
GOAL: (1) zdrowie jednostek dystansowych (nie konnych, nie rydwanów) x0,5 wg tabeli właściciela, wyjątki Hastati / Wojownik germański / Medżaj i Katapulta bez zmian; (2) Oszczepnik Zulu i Oszczepnik (Estólica) atak dystansowy = 5, Estólica zdrowie 10; (3) karty = wartości liczone przez silnik; (4) łańcuch „Zastąp” dopasowany (Estólica → tylko Łucznik, wariant A z DODATKU 1).
BAZA: cc3c80b171b9c625f1060ea4e316dbefa061a832 (origin/main, FALA 802). Worktree odłączony od tej bazy.
ZMIANY/COMMIT: patrz sekcja „Commit” na końcu (jeden commit: kod + ten raport).

## 1. Zmiany w danych (gra/data/units.json, 75 jednostek)

Zmienione pola (tylko dozwolona allowlista + cache fieldPower, patrz 1b):

- `health` (jedyne pole zdrowia — potwierdzone: w units.json nie ma innego pola HP/Zdrowie):
  Oszczepnik 16→8; Oszczepnik Zulu (Izijula) 20→10; Oszczepnik (Estólica) 16→10; Łucznik 20→10; Łucznik egipski 20→10; Łucznik nubijski 20→10; Łucznik sumeryjski 20→10; Łucznik akadyjski 20→10; Łucznik asyryjski 20→10; Procarz 16→8; Procarz (Huaracoc) 16→8.
- `missileAttack` (silnik): Oszczepnik Zulu 4→5; Oszczepnik (Estólica) 4→5. Jeździec z oszczepami (missileAttack 14) NIE zmieniony (wg decyzji właściciela, odnotowane jako obserwacja).
- `Zastąp specjalnie` Oszczepnika (Estólica): `Procarz/Procarz (Huaracoc)` → `Łucznik` (DODATEK 1, wariant A).
- Pola karty `Atak dystansowy` = missileAttack dla WSZYSTKICH 75 jednostek; `Zasięg ataku (hex)` = 2 dla strzelców z zasięgiem brakującym lub „—” (Drużynnik, Thorakites, Evocati, Gwardzista z champi; „Ilość pocisków” = „—” zostawiona bez zmian, zgodnie z dispatchem).
- `fieldPower` (cache eksportu, zależny od zdrowia/ataku): odświeżony do wartości `armyFieldPower` dla 8 łuczników/procarzy zmienionych w punkcie health (Procarz 16→12, Procarz (Huaracoc) 16→12, Łucznik 22→17, Łucznik egipski 19→14, Łucznik nubijski 20→15, Łucznik sumeryjski 16→11, Łucznik akadyjski 19→14, Łucznik asyryjski 21→16). Uzasadnienie: cache musi odpowiadać statom (komentarz w siegeDefenders.ts i ai-difficulty-bonus.ts); test unit-card-ranged-mult-test tego wymaga. Poza zakresem tej rundy pozostają cache Taran / Taran okuty / Katapulta / Wieża oblężnicza (patrz 4.3).

## 2. Audyt wszystkich 75 jednostek (baza → nowa)

Format: karta atak dyst. | silnik missileAttack | karta zasięg | zasięg silnika (battleScene.ts attackRange) | zdrowie. Wiersze bez zmiany (np. jednostki wręcz) pominięte w tabeli zmian. Zmiany są oznaczone strzałką.

| Jednostka | karta atak dyst. (baza→nowa) | silnik missileAttack | karta zasięg (baza→nowa) | zasięg silnika | zdrowie (baza→nowe) |
|---|---|---|---|---|---|
| Procarz | 4 | 4 | 4 | 4 | 16→8 |
| Oszczepnik | 4 | 4 | 2 | 2 | 16→8 |
| Łucznik | 4 | 4 | 3 | 3 | 20→10 |
| Hastati | 3→4 | 4 | 2 | 2 | 38 |
| Oszczepnik Zulu (Izijula) | 4→5 | 4→5 | 2 | 2 | 20→10 |
| Procarz (Huaracoc) | 4 | 4 | 5 | 5 | 16→8 |
| Oszczepnik (Estólica) | 4→5 | 4→5 | 2 | 2 | 16→10 |
| Łucznik egipski | 5 | 5 | 4 | 4 | 20→10 |
| Rydwan egipski | 8→10 | 10 | 3 | 3 | 112 |
| Łucznik nubijski | 6 | 6 | 5 | 5 | 20→10 |
| Łucznik sumeryjski | 4 | 4 | 4 | 4 | 20→10 |
| Łucznik akadyjski | 6→5 | 5 | 4 | 4 | 20→10 |
| Katapulta | 8→4 | 4 | 6 | 6 (katapulta: max(zasięg,6)) | 250 |
| Łucznik asyryjski | 6→4 | 4 | 4 | 4 | 20→10 |
| Drużynnik | 0→7 | 7 | —→2 | 2 | 31 |
| Jeździec z oszczepami | 4→14 | 14 | 2 | 2 | 56 |
| Thorakites | 0→6 | 6 | —→2 | 2 | 42 |
| Evocati | 0→6 | 6 | —→2 | 2 | 55 |
| Gwardzista z champi | 0→5 | 5 | —→2 | 2 | 48 |

Pozostałe jednostki (wręcz, zwiadowca, galera, konnica, rydwany, machiny, Medżaj 3/3, Konnica łucznicza asyryjska 12/12): karta = silnik już w bazie, bez zmian. Zdrowie bez zmian: Hastati 38, Wojownik germański 30, Medżaj 42, Konnica łucznicza asyryjska 60, Jeździec z oszczepami 56, Rydwan egipski 112, Katapulta 250, Drużynnik 31, Thorakites 42, Evocati 55, Gwardzista z champi 48.

Źródło rozjazdów: karta (unitInfoCard.ts / unitAdapter.ts / cityPanel.ts) czyta już silnik (`unitEngineStats` → `missileAttack`), ale kolumna `Atak dystansowy` i `Zasięg ataku (hex)` z units.json jest czytana przez część ścieżek (np. eksport/wiki i fallbacki `missileAttack ?? Atak dystansowy`), dlatego poprawiono dane kolumn, nie logikę silnika. Nie zmieniano kodu UI ani battleScene.ts. Wikibundle (`src/data/wikiBundle.json`) po regeneracji `tools/bundle-wiki-for-game.cjs` jest bajt-identyczny z bazą (NIE dotyczy zmian statystyk — bundle nie zawiera tych kolumn).

## 3. Łańcuch „Zastąp” po zmianach (dispatch pkt i–iv)

Tabela (jednostka źródłowa hp/atak → cel hp/atak):

| Źródło | Cel | Przejście |
|---|---|---|
| Oszczepnik 8/4 | Łucznik 10/4 | HP WZROST (+2), atak bez zmian |
| Oszczepnik Zulu 10/5 | Łucznik 10/4 | atak SPADEK (−1), HP bez zmian |
| Oszczepnik (Estólica) 10/5 | Łucznik 10/4 | atak SPADEK (−1), HP bez zmian |
| Łucznik 10/4 | Procarz 8/4 | HP SPADEK (−2), atak bez zmian |
| Łucznik 10/4 | Procarz (Huaracoc) 8/4 | HP SPADEK (−2), atak bez zmian |
| Łucznik egipski 10/5 | Procarz 8/4 | HP SPADEK (−2), atak SPADEK (−1) |
| Łucznik nubijski 10/6 | Procarz 8/4 | HP SPADEK (−2), atak SPADEK (−2) |
| Łucznik sumeryjski 10/4 | Procarz 8/4 | HP SPADEK (−2), atak bez zmian |
| Łucznik akadyjski 10/5 | Procarz 8/4 | HP SPADEK (−2), atak SPADEK (−1) |
| Łucznik asyryjski 10/4 | Procarz 8/4 | HP SPADEK (−2), atak bez zmian |

Dopasowania wykonane: tabela zamian (units.json `Zastąp specjalnie`), EXPECTED_TABLE w tools/unit-replace-promotion-table-test.cjs (Estólica → Łucznik; JAVELIN_TO_ARCHER_SOURCES + Estólica), test tools/unit-replace-archer-slinger-test.cjs (sekcja 11: Estólica → tylko Łucznik, Procarz/Huaracoc nie; AI Estólica → Łucznik), wyjątek AI JAVELIN_TO_ARCHER_SOURCES w src/game/ai-era-unit-promotion.ts (Estólica dodana: ta sama epoka Kamień, niższa klasa Specjalna → Standardowa, jak dla Zulu). Teksty encyklopedyczne (wikiBundle) nie zawierają już rozjazdu — bundle bez zmian.

Obserwacje do właściciela (NIE zmieniono sam — dispatch pkt iii): cele Zastąp z MNIEJSZYM zdrowiem niż źródło: Łucznik (10) → Procarz (8), Łucznik egipski/nubijski/sumeryjski/akadyjski/asyryjski (10) → Procarz (8). Cele z MNIEJSZYM atakiem: Łucznik egipski (5→4), nubijski (6→4), akadyjski (5→4), Oszczepnik Zulu i Estólica (5→4 w Łuczniku). „Zastąp” za pełny koszt może więc być osłabieniem; decyzja o balansie należy do właściciela. Nie wymagało to DECISION_REQUIRED (wszystkie przejścia da się dopasować bez zmiany reguł).

## 4. Testy i bramki (surowe wyniki z tej rundy)

### 4.1 Bramki obowiązkowe
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: exit 0 — „LOGIC OK (213/213)”.
- `node tools/tech-tree-test.cjs`: exit 0 — „tech-tree-test: 20 pass, 0 fail”.
- `node tools/research-test.cjs`: exit 0 — „PASSED: 33 / FAILED: 0 / TOTAL: 33”, „ALL GREEN”.
- `node tools/unit-replace-test.cjs`: exit 0 — „WSZYSTKIE TESTY ZIELONE (21/21)”.
- `node tools/combat-test.cjs`: exit 0 — „COMBAT TEST: 6/6 pass”, „All sanity checks passed.”

### 4.2 Testy kryteriów (a)–(g) i testy zależne od zmienionych liczb
- NOWY `tools/ranged-health-card-align-test.cjs` (kryteria a + karta==silnik dla CAŁEJ listy + mutacje): exit 0 — „5 pass, 0 fail”, „ALL GREEN”. Mutacje (zmiana karty egipskiego, health Procarza=16, zasięg karty Drużynnika „—”) wykryte.
- `tools/archers-health-dist-data-test.cjs`: exit 0, 0 FAIL (zaktualizowano: zdrowie pieszych łuczników 20→10, Oszczepnik/Procarz 16→8, akadyjski karta 6→5, asyryjski karta 6→4 — stara→nowa).
- `tools/units-health-single-field-test.cjs`: exit 0 (ARCHER_HEALTH 20→10).
- `tools/ranged-damage-mult-test.cjs`: exit 0 (armyFieldPower Procarz 16→12, Procarz (Huaracoc) 16→12, Łucznik 22→17, Łucznik egipski 19→14).
- `tools/unit-card-ranged-mult-test.cjs`: exit 0, 32 OK (Procarz tooltip „Razem” 16→12; Łucznik asyryjski 21→16; cache fieldPower zgodny).
- `tools/unit-replace-promotion-table-test.cjs`: exit 0 — „PASS: 32 wpisów źródłowych, 63 krawędzi, brak cykli”.
- `tools/unit-replace-archer-slinger-test.cjs`: exit 0 — „51 OK, 0 FAIL”.
- `tools/unit-replace-multitype-walk-test.cjs`: exit 0 — „25 OK, 0 FAIL”.
- `tools/unit-replace-army-multi-select-test.cjs`: exit 0.
- `tools/ai-era-unit-promotion-test.cjs`: exit 0 — „17 passed, 0 failed”.
- `tools/ai-unit-replace-same-rules-test.cjs`: exit 0 — „45 passed, 0 failed”.
- `tools/hit-mode-consistency-test.cjs`, `tools/battle-ranged-mounted-doctrine-test.cjs`, `tools/pr141-g1-combat-activation-test.cjs`, `tools/battle-summary-test.cjs`, `tools/post-battle-map-test.cjs`, `tools/army-scout-not-leader-test.cjs`, `tools/battle-hp-display-test.cjs`, `tools/battle-line-advance-uniform-test.cjs`, `tools/battle-flank-close-formation-test.cjs`, `tools/structure-defense-bonus-test.cjs`, `tools/unit-context-card-test.cjs`: exit 0.

### 4.3 Znane i niezwiązane z tą zmianą
- `tools/unit-replace-full-cost-test.cjs`: exit 1 — „[FAIL] performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa (wspolny executeUnitReplace)”. Test to asercja tekstowa na src/main.ts; ten plik NIE był zmieniany w tej rundzie (git status: brak). Wniosek: błąd istniał przed tą rundą, NIE ZMIERZONO na bazie cc3c80b (nie uruchomiono ponownie w worktree z bazą) — do potwierdzenia przez orkiestratora.
- `fieldPower` cache dla Taran (352.5 vs runtime 0), Taran okuty (377.5 vs 0), Katapulta (128 vs 0), Wieża oblężnicza (451 vs 0) — rozjazd istniał przed tą rundą (armyFieldPower zwraca 0 dla machin); NIE zmieniano (poza allowlistą, dispatch zakazuje zmian innych pól).
- Katapulta: karta atak dyst. 8 → 4 (to silnik; zdrowie 250 bez zmian; właściciel nie odpowiedział co do machin — NIE ruszano zdrowia).

### 4.4 Pomiar skutku (pkt e, informacyjny, bez zmian reguł)
- `node tools/hit-mode-archers-vs-warrior-sim.cjs --seeds 10 --mode pewne` (PO zmianach): „[pewne] lucznicy wygrywaja 100% | wojownicy 0% | remis 0% | straty lucznikow sr. 0 | straty wojownikow sr. 20 | rund sr. 80 | pojedynkow sr. 20 | roznych wynikow 1” (ziarna=30).
- PRZED zmianami: NIE ZMIERZONO (nie uruchomiono symulacji na bazie cc3c80b — wymagałoby osobnego checkoutu danych). Do decyzji właściciela.

### 4.5 Niezmierzone
- Kryterium (d) — żywy Chromium (xvfb), karta Łucznika / Oszczepnika Estólica / Drużynnika: NIE ZMIERZONO (brak przeglądarki w tym runie; dispatch dopuszcza „NIE ZMIERZONO jeśli nie”).
- Mutacja testu łańcucha (usunięcie wpisu → czerwony): częściowo — unit-replace-promotion-table-test sprawdza każdą krawędź względem EXPECTED_TABLE (zmiana wpisu wykrywana przez porównanie), nie dodawano osobnej mutacji.
- Rust REPIN (dług f): NIE wykonywano (poza zakresem; odnotowane jako dług).

## 5. Dyscyplina i granice
- Nie dotykano gra-robocza/, WERSJE.md, mnożników ranged_damage_mult, Hastati/Wojownika germańskiego/Medżaja (zdrowie), jednostek konnych/rydwanów/Katapulty (zdrowie). Nie uruchamiano `npm run build`/`dev`. Brak rm/rmdir/unlink w tym temacie. Brak `git add -A`. Brak push na main; brak deployu.
- Zainstalowano zależności gra/node_modules (`npm ci`, bez pobierania przeglądarek) tylko do uruchomienia testów; katalog jest ignorowany przez git. Do sprzątania po stronie orkiestratora (worktree + node_modules).
- Usunięto plik scratchpad poza repo nie był wymagany; skrypty pomocnicze (edit_units.py, fp_regen.cjs) leżą w katalogu scratchpad, nie w repo.

## 6. Obserwacje (UWAGI-DLA-ORKIESTRATORA)
1. Jeździec z oszczepami: missileAttack 14 = melee Atak 14 (możliwa kopia) — zgodnie z decyzją właściciela NIE zmieniano; karta pokazuje 14 (= silnik).
2. Drużynnik „Ilość pocisków” = „—” zostawiono (dispatch), zasięg karty ustawiony na 2 (silnik).
3. fieldPower cache: rozjazd dla machin (Taran, Taran okuty, Katapulta, Wieża) — osobny temat, poza zakresem.
4. unit-replace-full-cost-test FAIL — do potwierdzenia na bazie (patrz 4.3).
5. Dług Rust: REPIN units.json (health, missileAttack, Atak dystansowy, Zasięg ataku, Zastąp specjalnie Estólicy, fieldPower) i tabeli zamian.
6. Brak pomiaru Chromium (karty) — wymagane przed deployem na ROBOCZĄ (kryterium d).

## Commit
Jeden commit: zmiany w gra/data/units.json, gra/src/game/ai-era-unit-promotion.ts, gra/tools/{archers-health-dist-data-test,ranged-damage-mult-test,unit-card-ranged-mult-test,unit-replace-archer-slinger-test,unit-replace-promotion-table-test,units-health-single-field-test}.cjs, nowy gra/tools/ranged-health-card-align-test.cjs oraz ten raport. SHA: patrz pole `sha` w wyniku StructuredOutput.

NASTĘPNY KROK: Evaluator (SONNET) → Final Control; przed FC: potwierdzić unit-replace-full-cost-test na bazie cc3c80b, zmierzyć Chromium (karty), potwierdzić pomiar skutku przed zmianą.
DEPLOY/PUSH: NIE WYKONANO

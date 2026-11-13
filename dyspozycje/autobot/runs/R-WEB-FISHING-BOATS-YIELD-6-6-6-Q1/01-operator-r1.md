# R-WEB-FISHING-BOATS-YIELD-6-6-6-Q1 — Operator, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (BALANS — decyzja liczbowa właściciela 2026-11-09)
TEMAT: R-WEB-FISHING-BOATS-YIELD-6-6-6-Q1
GOAL: Ulepszenie „Łodzie rybackie” (lodzie_rybackie) daje +6 żywności, +6 Pracy, +6 podatku (dane: klucz `handel` = podatek). Teksty, karta Żegluga, CIVPEDIA/wiki i testy zsynchronizowane; konsekwencje w silniku wskazane w raporcie.
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu (SHA w raporcie końcowym orkiestratora).
BAZA: origin/main 1be32fb0a (HEAD worktree = main przed zmianami).
MODEL: Haiku 5.5 (Operator).

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `gra/data/terrain-improvements.json` | `lodzie_rybackie.bonus`: zywnosc 2→6, praca 3→6, handel 3→6 (klucz `handel` bez zmiany) |
| `gra/tools/gen-tech-cards-top5.zdania.json` | Żegluga/Top2: nadpisanie tytułu `Łodzie rybackie: +6 żywności, +6 Pracy, +6 podatku` (z `powodTytulu`); CMZ `cmzZamiany` „(+2 żywności, +3 Pracy)” → „(+6 żywności, +6 Pracy)” |
| `gra/data/tech-cards-top5.json` | WYGENEROWANE generatorem `gra/tools/gen-tech-cards-top5.cjs` (nie ręcznie). `--check` OK. Zmienione: tytuł Top2, `liczba` "+2"→"+6", CMZ korzyść |
| `gra/src/data/wikiBundle.json` | WYGENEROWANE `gra/tools/bundle-wiki-for-game.cjs` z docs (zmiana 1 linii: hasło ulepszenia/lodzie_rybackie) |
| `docs/encyklopedia/ulepszenia/lodzie_rybackie.md` | „Po ukończeniu” +6/+6/+6 (żywność/praca/podatek); przykład 3→7 żywności; zwrot pracy (patrz ZALOŻENIA) |
| `docs/PORADNIK-GRACZA/28-katalog-ulepszen.md` | wiersz tabeli i opis Łodzi: +6 żywność, +6 praca, +6 podatek |
| `gra/src/game/ai.ts` | TYLKO komentarz (lista wag żywnościowych w nagłówku): `lodzie_rybackie:2` → `:6`. Logika nietknięta |
| `gra/tools/food-hodowla-test.cjs` | asercja praca lodzie 3 → 6 (nie osłabiona) |
| `gra/tools/improvement-era-scaling-test.cjs` | wiersz YIELD_TABLE lodzie: `T(2),T(3),T(3)` → `T(6),T(6),T(6)` (skalowanie epoki bez zmian: +1 za epokę) |
| `gra/tools/fishing-boats-666-test.cjs` (NOWY) | test nowy: dane, improvementBonusForKey, tileYield (delta heksu), karta Żegluga, encyklopedia/poradnik/wikiBundle |

Nie zmieniano: `gra-robocza/`, `WERSJE.md`, `Gra-FINALNA.html`, `git add -A` nie użyto, `npm run build/dev` nie uruchamiano (tylko `npm ci --ignore-scripts` w gra/ i skrypt bundle wiki z prebuild).

Poza allowlistą, ale świadomie nie ruszane (historyczne): `docs/decyzje/*` (KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md, A4-D4..., B-SUROW-BUD...), `docs/archiwum*`, `docs/analiza/*`, `docs/AUDYT-DRZEWKO-TECH-*`, `docs/PORADNIK-GRACZA/02/05/07`, `dyspozycje/.../odkrycia-top5.csv` (źródło historyczne; tytuł nadpisany w zdaniach, nie w CSV). `docs/encyklopedia/ulepszenia/bydlo.md` ma własne „+2 żywność/t, +3 praca/t” (to bydło, poprawne dla bydła — nie dotyczy zmiany).

## 2. Tabela przed / po (dane = silnik)

| Epoka właściciela | PRZED żywność / praca / podatek | PO żywność / praca / podatek |
|---|---|---|
| Kamień (1) | 2 / 3 / 3 | **6 / 6 / 6** |
| Brąz (2) | 3 / 4 / 4 | 7 / 7 / 7 |
| Żelazo (3) | 4 / 5 / 5 | 8 / 8 / 8 |

Przed/po w Kamieniu liczone z silnika (`improvementBonusForKey` i `tileYield` na heksie morza). Skalowanie epoki (+1 za epokę ponad Kamień) jest w silniku bez zmian (`improvementYieldForEra`, terrain-improvements.ts), więc 6/6/6 przechodzi na Brąz 7 i Żelazo 8.

Wpływ na heks (Kamień, zmierzone `tileYield` delta): żywność ×3 (2→6), praca ×2 (3→6), podatek ×2 (3→6).

Wpływ na miasto nadmorskie z N ławicami: NIE_ZMIERZONO na poziomie miasta (nie uruchamiano symulacji tury ani ekonomii miasta). Z delty heksu wynika tylko, że każda ławica dokłada +6/+6/+6 przed mnożnikami i konsumpcją miasta; konkretne sumy dla N ławic i dla przykładowego miasta nie były liczone.

## 3. Konsekwencje w silniku (wskazanie, bez zmiany zasad)

- Plon ulepszenia jest czytany z danych: `applyImprovementBonus` / `improvementBonusForKey` w `gra/src/game/terrain-improvements.ts` (czyta `IMPROVEMENTS[key].bonus`). Grep po `gra/src` nie znalazł zahardkodowanych liczb dla lodzie (poza komentarzem w ai.ts, zmienionym). Brak regresji ścieżek plonu.
- `gra/src/game/ai.ts:2834` (`AI_IMPROVEMENT_PRIORITY`) i `auto-improvements.ts` (listy kluczy 72, 89, 580 „E6”, 615): lodzie tylko jako członek list, bez wag liczbowych zależnych od 2/3/3. Priorytet AI (kolejność budowy) NIE_ZMIERZONO po zmianie — zmiana liczb może teoretycznie zmienić wybór AI przy zbliżonych wynikach; test ai-test przechodzi.
- `gra/src/main.ts:16464-16479`: komentarz o predykacie lasu i lodzie (bez liczb) — nietknięty.
- `gra/src/render/improvements.ts`, `robloxImprovements.ts`: model 3D, bez liczb plonu.
- Testy z oczekiwaniami starych liczb: tylko dwa (food-hodowla, improvement-era-scaling) — zaktualizowane. Pozostałe testy wzmiankujące lodzie dotyczą list kluczy albo wymagań terenu, nie liczb plonu.

## 4. Kamień Ha'amonga — bonus terenu (punkt 4 dispatchu, NIE zmieniano)

- `gra/data/wonders.json:265`: `bonusy.teren` = `{ "typTerenu": "lowie_rybackie", "kultura": 2, "zywnosc": 2 }` oraz `{ "typTerenu": "laka", … "warunek": "hex_sasiad_plytkie_morze" }`.
- Identyfikator `lowie_rybackie` nie odpowiada żadnemu kluczowi ulepszenia ani terenu (klucze `terrain-improvements.json`: `lodzie_rybackie`, ...). W danych występuje tylko w tym jednym miejscu.
- Silnik NIE nalicza `bonusy.teren`: komentarz `gra/src/game/wonders-data.ts:199-201` mówi wprost „bonusy.teren … NIE są tu liczone — TODO”; `sumWonderCityYieldsForOwner` liczy tylko `bonusy.miasto`.
- Jedyny odczyt `bonusy.teren` to etykieta w UI: `gra/src/main.ts:5392-5394` (`wonderEffectsLabel`), czyli bonus jest tylko WYŚWIETLANY, nie zastosowany.
- Wniosek: bonus Kamienia Ha'amonga na łodziach/terenie nie działa w grze (wyświetlany, nie naliczany), a dopasowanie po `typTerenu` nie istnieje. Status: **DECISION_REQUIRED** — wymaga decyzji właściciela (naliczać `bonusy.teren` czy wyciąć wpis; jaki id zamiast `lowie_rybackie`, np. `lodzie_rybackie`). Nie zmieniano bez decyzji.
- Ten sam mechanizm dotyczy też innych cudów z `bonusy.teren` (np. `wonders.json:91,92,137,236`).

## 5. Testy

Wszystkie w `gra/` (`node tools/…`), wyniki dokładne:

- `npx tsc --noEmit` → exit 0, brak wyjścia.
- `node tools/logic-test.cjs` → LOGIC OK (213/213).
- `node tools/ai-test.cjs` → 296 passed, 0 failed.
- `node tools/food-hodowla-test.cjs` → 24 OK, 0 FAIL (po zmianie asercji praca 6).
- `node tools/improvement-era-scaling-test.cjs` → 144 PASS, 0 FAIL (po zmianie wiersza lodzie).
- `node tools/fishing-boats-666-test.cjs` (NOWY) → 22 OK, 0 FAIL.
- `node tools/tech-cards-top5-test.cjs` → 594 pass, 0 fail.
- `node tools/civpedia-karty-spojnosc-q1-c-test.cjs` → 24 PASS, 0 FAIL.
- `node tools/civpedia-ulepszenia-historia-batch-test.cjs` → 116 pass, 0 fail.
- `node tools/improvement-card-callsites-test.cjs` → 36 pass, 0 fail.
- `node tools/improvement-adapter-resource-note-test.cjs` → 75 pass, 0 fail.
- `node tools/auto-improvements-test.cjs` → 46 passed, 0 failed.
- `node tools/auto-improve-q3-test.cjs` → 41 OK, 0 FAIL.
- `node tools/ai-food-only-worked-hexes-test.cjs` → 69 OK, 0 FAIL.
- `node tools/simple-food-rule-no-toggles-test.cjs` → 36 OK, 0 FAIL.
- `node tools/ai-city-yield-test.cjs` → 42 PASS, 0 FAIL.
- `node tools/owner-economy-test.cjs` → 20 passed, 0 failed.
- `node tools/terrain-base-resource-yields-test.cjs` → 10 pass, 0 fail.
- `node tools/wonder-yields-test.cjs` → 11 passed, 0 failed.
- `node tools/river-yield-both-sides-test.cjs` → 7 pass, 0 fail.
- `node tools/gen-tech-cards-top5.cjs --check` → OK.
- `git diff --check` → czysto.

Czerwone, NIE związane ze zmianą (nie dotykają lodzie ani plonów pieniądza/AI-wojska; NIE_ZMIERZONO na bazie, tylko wnioskowane):
- `node tools/ai-major-economy-test.cjs` → TypeError: `computeMajorArchetypeMilitaryFraction is not a function`. Funkcji nie ma w `gra/src` (`git grep` pusty) — błąd istniejący przed zmianą.
- `node tools/pr141-f04-yields-activation-test.cjs` → `grecy/eko_pieniadz_proc: 0 !== 114` (dotyczy pieniądza grecji, test nie zawiera `lodzie`). Nie uruchamiano na bazie 1be32fb0a — stąd NIE_ZMIERZONO na bazie.

Nie uruchamiano: testów przeglądarkowych / weryfikacji wizualnej karty w grze (tematy wizualne wymagają realnej weryfikacji przez Evaluator/FC; tu zmiana danych i tekstów, bez zmian UI).

## 6. Założenia (rozstrzygnięte w dokumencie, nie pytano)

1. Tytuł karty Żegluga: zamiast ręcznej edycji CSV użyto mechanizmu `tytul` + `powodTytulu` w `gra/tools/gen-tech-cards-top5.zdania.json` (generator wymaga powodu). CSV pozostaje historycznym źródłem.
2. CMZ: zamiana tekstu `(+2 żywności, +3 Pracy)` → `(+6 żywności, +6 Pracy)` przez `cmzZamiany`, bo tekst pochodzi z CSV.
3. Zwrot pracy w encyklopedii: poprzednio „czysty zysk +2/t → 10 tur” (liczba 2 = dawny bonus żywności). Po zmianie przyjęto czysty zysk +6 pracy/t → „ok. 4 tury” (20 / 6 ≈ 3,3 → 4). To uproszczenie autorskie: Evaluator proszę zweryfikować, czy właściciel chce liczyć po pracy, czy po żywności.
4. Przykład w encyklopedii: łąka 1 żywn. + Łodzie +6 → 7 żywn./t (dawniej 3).
5. Podatek: w danych klucz `handel`; w tekstach użyto słowa „podatek” (zgodnie z terminologią dispatchu, bez „handel”).
6. Dowód `gra/data/terrain-improvements.json:234` w wierszu Żegluga w tech-cards (dowód z CSV) jest już nieaktualny linią (wpis jest w okolicy linii 237) — pre-existing, nie zmieniano (poza allowlistą generowanego pliku CSV).

## 7. Do decyzji właściciela (DECISION_REQUIRED, poza tym tematem)

- Kamień Ha'amonga: `bonusy.teren` (`lowie_rybackie`, `laka`) nie jest naliczany w silniku, tylko wyświetlany. Naliczać, czy wyciąć wpisy i jaki identyfikator?

## 8. Commit

Commit obejmuje zmiany z sekcji 1 oraz ten raport. SHA w odpowiedzi orkiestratora (po `git log -1`).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) i Final Control (Sonnet 5.5) na tym samym ID; Obrona tylko przy FAIL. Decyzja właściciela w pkt 7 nie blokuje tematu.
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1 (zadanie #371)
GOAL: ujednolicić OPISY (pola `_*`) w gra/data/war-weariness-params.json i gra/data/diplomacy-tick-params.json z faktycznym zachowaniem kodu, bez zmiany ŻADNEJ wartości liczbowej/logicznej.
BAZA: f196422ef (origin/main), worktree wf_4abc38c7-10c-1, detached.

ZMIANY/COMMIT:
- gra/data/war-weariness-params.json: przepisane `zmeczenie._wzor` i `przegrywajacy._wzor`; nowy klucz `zmeczenie._progi` (dwa osobne progi 0,8). Tylko klucze `_*`.
- gra/data/diplomacy-tick-params.json: nowe `_uwagaFlagaDomyslna` (top-level) i `p6._uwagaKryzysTurDoWojny`. Tylko klucze `_*`.
- gra/tools/json-descriptions-sync-test.cjs (nowy test, 17 sprawdzeń).
- dyspozycje/autobot/runs/R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1/10-operator-claude.md (ten raport).
- SHA: patrz pole sha w odpowiedzi (commit operatora na gałęzi detached od f196422ef).
- Diff bez zmian wartości: `git diff` pokazuje 6 wstawień i 3 usunięcia, wszystkie w liniach `_*` (plus przecinek przy progKoncaZmeczenia). Test (a1) potwierdza, że po usunięciu kluczy `_*` oba pliki są identyczne z bazą f196422ef.

WYNIKI PUNKT PO PUNKCIE (cytaty z kodu):

1. war-weariness: `_wzor` mówił „100% (tura 20) wojna wygasa". KOD: koniec zmęczenia jest przy progKoncaZmeczenia=0,8, nie przy 1,0.
   - war-weariness.ts:234 `wearinessUnconditionalEndDue`: `return level >= P.zmeczenie.progKoncaZmeczenia;`
   - war-weariness.ts:264: tick AI<->AI kończy wojnę pokojem BEZWARUNKOWYM przy tej funkcji (bez miasta i zapłaty).
   - ai.ts:7050: AI (także silniejsza) proponuje pokój bezwarunkowy przy tej samej funkcji; gracz decyduje sam.
   - war-weariness.ts:71 poziom = clamp(turyWojny/pelneTur + wagaStratMiasta*utraty, 0, 1); bez strat 0,8 = tura 16, każde zmienione miasto skraca o 2 tury. Poziom 1,0 nie ma osobnego skutku.
   - war-weariness.ts:251 i diplomacy-peace-proposal-timing.ts:2: nie wcześniej niż PEACE_PROPOSAL_MIN_WAR_TURNS = 10 tur wojny.
   Opis poprawiony do faktycznego zachowania (koniec przy 0,8 = tura 16). Wartości nie zmieniono.

2. przegrywajacy: opis „Stopień 1: złoto+surowce" był nieaktualny.
   - war-weariness.ts:131 planEscalatedPeacePayment: tylko `a.kind === 'miasto'`.
   - war-weariness.ts:113-117 stageCityLimit: stopień 1-2 = min(1, maxMiastNaPokoj) = 1 miasto; stopień 3 = maxMiastNaPokoj (2).
   - war-weariness.ts:292-294: limit = min(stageCityLimit, miasta - minMiastPoOddaniu), 0 gdy battlePending.
   Opis poprawiony: stopień 1 = 1 miasto, stopień 2 = 1 miasto z wyższym mnożnikiem, stopień 3 = do 2 miast.

3. progWzajemnyPokoj vs progKoncaZmeczenia (oba 0,8): dwa osobne pola, każde czytane w jednym miejscu.
   - progWzajemnyPokoj: TYLKO war-weariness.ts:307 (`exhausted = lvl >= P.zmeczenie.progWzajemnyPokoj && rejectedOffers >= odrzuceniaDoKapitulacji`, wyjście awaryjne).
   - progKoncaZmeczenia: TYLKO war-weariness.ts:234 (przez wearinessUnconditionalEndDue).
   Dopisane w `zmeczenie._progi`. Pola NIE scalone, wartości bez zmian.

4. diplomacy-tick-params.json:
   - flagaDomyslna=false: NIE jest czytane (brak trafień w gra/src). Realna wartość: DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true (diplomacy-tick-war-brake.ts:7); isDiploTickWarBrakeEnabled (l.16-18) zwraca nadpisanie testowe albo tę stałą. Dopisany `_uwagaFlagaDomyslna`. Wartość false zostawiona (zmiana poza zakresem).
   - kryzysTurDoWojny=5: pole NIE wpływa na grę. main.ts:11876 nadpisuje je `{ ...diploTickP6, kryzysTurDoWojny: w.n }`, a w.n = hamulecN profilu (main.ts:11863). Profil bazowy (diplomacy-war-peace-profile.ts:143): clamp(round(8 - 0,5*5), 3, 7) = 6. Realnie obowiązuje N=6. Dopisany `p6._uwagaKryzysTurDoWojny` z tą wartością i źródłem. Niespójność 5 vs 6 zostaje do zadania #370, wartość nie zmieniona.

TESTY:
- Nowy test: `node tools/json-descriptions-sync-test.cjs` -> 17 pass / 0 fail, exit 0.
  Mutacje (w pamięci) czerwienią test: pelneTur 20->21 (b2), progiStopni[1] 0,45->0,5 (b3), progKoncaZmeczenia 0,8->0,9 bez zmiany opisu (b4), maxMiastNaPokoj 2->3 (b5).
- tsc: baza TSC_EXIT=0; po zmianie TSC_EXIT=0 (`npx tsc --noEmit` w gra/).
- Bramki referencyjne (baza -> po zmianie, liczby z surowego wyjścia):
  - logic-test: LOGIC OK (213/213) -> LOGIC OK (213/213)
  - tech-tree-test: 20 pass, 0 fail -> 20 pass, 0 fail
  - research-test: ALL GREEN -> ALL GREEN
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21) -> bez zmian
  - combat-test: All sanity checks passed. -> bez zmian
- Testy czytające oba pliki (wynik bazy = wynik po zmianie, bez regresji):
  - ai-war-weariness-peace-test: PASS=99 FAIL=0 (oba)
  - diplo-civpedia-values-test: PASS: 129 (oba)
  - diplo-peace-ai-ai-nonnegative-test: 21 PASS (oba)
  - diplo-tick-war-brake-mutation-test: 17 pass / 0 fail (oba)
  - diplo-tick-war-brake-unit-test: 69 pass / 0 fail (oba)
  - diplo-tick-war-brake-test: 51 pass / 0 fail (oba)
  - diplo-war-declare-zero-trust-test: 43 OK, 0 FAIL (oba)
  - diplo-weariness-20-turns-test: PASS=30 FAIL=0 (oba)
  - diplo-weariness-city-only-test: PASS=30 FAIL=0 (oba)
  - diplo-weariness-unconditional-end-test: PASS=22 FAIL=0 (oba)
  - diplo-war-peace-main-guard-test: 34 pass / 1 fail (TAK SAMO na bazie f196422ef: FAIL „R6/ZT: priorytet 4 liczy przewagę przez compareMilitaryStrength (≥20%)"). Wada przed tematem, niezwiązana z JSON; nie naprawiana (poza allowlistą).
- `git diff --check`: czysto.

BLOKADY: brak. Uwaga: zadanie wspomina DODATEK orkiestratora (00-dispatch-DODATEK-claude.md) na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; NIE istnieje w repo (ani na origin/main, ani na tej gałęzi). Pracowano wg 00-dispatch.md (istnieje na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie na origin/main), uzupełnionego o treść zadania od orkiestratora. Luki rozstrzygnięto założeniem: opisy opisują kod, wartości bez zmian.

RUNDY: 1/5 (wszystkie wyniki w tej rundzie; test i poprawki razem)

NASTĘPNY KROK: Evaluator (SONNET) weryfikuje zgodność opisów z kodem (cytaty w punktach 1-4) i wynik testu. Do rozstrzygnięcia przez właściciela (poza tym tematem):
- A) Rozbieżność intencji i kodu w punkcie 1. Decyzja właściciela 2026-11-13 (wariant A, zadanie #363) mówiła „80% tura 16: silniejszy proponuje pokój bezwarunkowy; 100% tura 20: wojna wygasa". Kod kończy wojnę już przy 0,8 (progKoncaZmeczenia), a 1,0 nie ma skutku. Opis oddaje KOD. Jeśli intencją jest koniec przy 100%, to wartość progKoncaZmeczenia (0,8 -> 1,0) i ten opis wymagają decyzji właściciela (zmiana zachowania, poza tym tematem).
- B) Niespójność N=5 vs N=6 (#370): zostaje, wartość nie zmieniona.
- C) flagaDomyslna=false w pliku: do usunięcia lub zmiany przy #370, nie tutaj.

UWAGI-DLA-ORKIESTRATORA:
- Test json-descriptions-sync-test.cjs nie jest jeszcze wpisany do docs/decyzje/R-PROC-AUTOBOT.md §6 (Bramki). Wpis należy do integracji (zasada: bramka istnieje dopiero po wpisie do tabeli §6), nie robiony tutaj.
- Test (a1) porównuje z commitem f196422ef przez git show; działa, o ile ten commit jest w historii repo.
- Zauważony dług poza zakresem: diplo-war-peace-main-guard-test (R6/ZT) FAIL już na bazie. Nie tykano.

DEPLOY/PUSH: NIE WYKONANO

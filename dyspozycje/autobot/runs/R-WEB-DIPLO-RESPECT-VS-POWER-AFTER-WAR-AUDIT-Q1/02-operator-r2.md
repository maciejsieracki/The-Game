STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
GOAL: ustalić, czy niski Respekt (29) silniejszego gracza po wojnie to błąd kierunkowości, czy zamierzona reguła
ZMIANY/COMMIT: runda 2 — tylko `gra/tools/diplo-respect-power-test.cjs` (poprawiony test) i ten raport. Baza: commit Operatora r1 `7c01e080b7e7784cf2be7fa6c4a7cc399195d209`. SHA rundy 2: patrz `git log -1` na gałęzi `wf-diplo-respect-r2` (commit po tym raporcie). Brak zmian w `gra/src`, brak WERSJE.md, brak push i deployu.
TESTY: `node gra/tools/diplo-respect-power-test.cjs` -> 13 PASS / 0 FAIL, exit 0 (na prawdziwych funkcjach silnika przez esbuild). Bez esbuild: `[NIE_ZMIERZONO] brak esbuild ...`, exit 2. Uruchomione z tymczasowym dowiązaniem `gra/node_modules` do esbuild z innego worktree (dowiązanie usunięte, nie commitowane). `npm ci` w `gra/` NIE_ZMIERZONO. `git diff --check` czysty. Pozostałych bramek nie uruchamiano (brak zmian w src).
BLOKADY: decyzja produktowa właściciela (ABC w sekcji 4), zadaje orkiestrator.
RUNDY: 2/5 (ostatni werdykt Evaluatora: PASS-WITH-NOTES, 5 zarzutów)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki; orkiestrator zadaje ABC z sekcji 4 (już z liczbą 67).
DEPLOY/PUSH: NIE WYKONANO

## 0. Odpowiedzi na zarzuty Evaluatora (PRZYJMUJĘ / ODRZUCAM)

| # | Zarzut | Werdykt | Dowód / zmiana |
|---|---|---|---|
| Z1 | 89 vs 67: panel nie używa surowych mocy | PRZYJMUJĘ | Patrz sekcja 1. |
| Z2 | Asercja tautologiczna `0 + 67`, warunek `67 !== 29` zawsze prawdziwy | PRZYJMUJĘ | Patrz sekcja 2. |
| Z3 | Symulacja bez bitew i zmian Mocy | PRZYJMUJĘ częściowo | Dodano test monotoniczności (1c). Pełna symulacja bitew: NIE_ZMIERZONO. |
| Z4 | Zależność od `gra/node_modules/esbuild` nieudokumentowana | PRZYJMUJĘ | Patrz sekcja 3. |
| Z5 | Brak dowodu, że zdarzenia jednorazowe są martwe | PRZYJMUJĘ | Patrz sekcja 5. |

## 1. Z1 — liczba 89 vs 67 (PRZYJMUJĘ)

Panel nie liczy Respektu z surowych mocy (14682 / 1854 = 89). Liczy z mocy EFEKTYWNYCH:
- `gra/src/main.ts:2839` `objectiveRespektPctTowardEffective` = `computeRespekt(objectivePowerForOwnerEffective(0), objectivePowerForOwnerEffective(partner))`.
- `gra/src/main.ts:24331` `audienceRelTotalEffective` = `clamp(0..200, Zaufanie + objectiveRespektPctTowardEffective)` — to jest "Relacja X/200" na zrzucie.
- `gra/src/main.ts:24568-24570` `respektNorm = formatPowerRelationLine(playerPowerEff, otherPowerEff).respekt` — to jest wartość, którą dostaje pasek przez `effectiveNastawienieScores` (`ui/diplomacyAudience.ts:1448`, `:2218`).

Wniosek: wartość widoczna dla gracza przy Zaufaniu 0 to **67** (Relacja 67/200 = 0 + 67), a nie 89. Pasek Respektu po ścięciu wojennym pokazuje 29, a Relacja 67 — to jest rozjazd z r1, poprawnie opisany, ale liczba w r1 była zawyżona. 89 zostaje tylko jako wartość referencyjna surowych mocy (test (0) i (1)). Nie odtworzyłem efektywnych mocy offline (bonusy weterana, fortyfikacji i trudności, `main.ts:2829-2832`), więc skąd stosunek ok. 2:1 zamiast ok. 8:1 — NIE_ZMIERZONO. Jedyna liczba potwierdzona to 67 ze zrzutu; `computeRespekt(2,1) = 67`, więc 67 odpowiada stosunkowi ok. 2:1 (wniosek z wyniku, nie z pomiaru mocy).

## 2. Z2 — tautologia (PRZYJMUJĘ)

Zmiana w `gra/tools/diplo-respect-power-test.cjs`:
- Wejściem paska jest efektywny Respekt `RESPEKT_EFF_ZRZUT = 67` (jawnie oznaczone jako WEJŚCIE ze zrzutu, nie wynik silnika), a nie surowe 89.
- `shownWar = effectiveNastawienieScores(0, 67, true)` -> asercja `respekt === 29` (wartość obliczona przez funkcję).
- `relTotalEffective = clamp(0..200, 0 + 67)` (replika `audienceRelTotalEffective`; funkcja żyje w closure `main.ts`, więc nie jest importowalna — to jest ograniczenie) -> asercja `=== 67`.
- Rozjazd: `relTotalEffective !== shownWar.zaufanie + shownWar.respekt` (67 vs 29, dwie wartości liczone, nie stałe).
- Nowa asercja pokoju: `shownPeace.zaufanie + shownPeace.respekt === relTotalEffective` (w pokoju brak rozjazdu).
- Asercja (1b): `RESPEKT_EFF_ZRZUT !== computeRespekt(PLR,AI)` — dowód, że panel używa innej wartości niż surowa.

## 3. Z4 — esbuild (PRZYJMUJĘ)

- Test sprawdza `gra/node_modules/esbuild`, potem `require('esbuild')`. Jeśli brak — wypisuje `[NIE_ZMIERZONO] brak esbuild: uruchom npm ci w gra/` i kończy z kodem 2 (zamiast MODULE_NOT_FOUND).
- Świeży worktree nie ma `gra/node_modules` (sprawdzone: `main` też nie ma). Potwierdzone: esbuild istnieje w `wf_30cb9be1-ea1-1/gra/node_modules`; dowiązano tymczasowo, uruchomiono, dowiązanie usunięto.

## 4. Z3 — zakres symulacji (PRZYJMUJĘ częściowo)

- Dodano test (1c): `computeRespekt(PLR, aiP)` dla `aiP` od 1854 do 1000 jest monotonicznie niemalejący i rośnie (ścieżka "bitwa -> moc -> Respekt"). Test dotyczy funkcji `computeRespekt`, NIE bitew.
- Symulacja 30 tur (2) nadal ma moce stałe. NIE_ZMIERZONO: wpływ wygranych bitew na Moc w grze (wymaga silnika bitew i pętli tur w `main.ts`, poza testem charakteryzującym).

## 5. Z5 — zdarzenia jednorazowe są martwe (PRZYJMUJĘ, dowód)

Komenda: `git grep -n "wygrana_bitwa\|przewaga_militarna\|slabszy_militarnie" -- gra/src`. Wynik: trafienia tylko w:
- definicjach typu i parametrach: `gra/src/game/diplomacy.ts:133-134, 858-860`;
- obsłudze `applyDiplomaticEvent` (switch): `gra/src/game/diplomacy.ts:996, 1001, 1006`;
- etykietach: `gra/src/game/diplomacy-factors.ts:71-73`;
- `power-objective.ts` używa `wygrana_bitwa` jako współczynnika Mocy (inna rzecz, nie zdarzenie Respektu).
Zero wywołań `applyDiplomaticEvent` z tymi literałami. NIE_ZMIERZONO: zdarzenie przekazane przez zmienną (`applyDiplomaticEvent(cur, event, ...)`, `main.ts:11943`) nie zostało prześledzone do źródła wartości; sprawdzono literały.

## 6. DECISION_REQUIRED dla właściciela (ABC, z poprawioną liczbą)

Realny Respekt gracza w tym scenariuszu (Zaufanie 0, wojna) widoczny w panelu to **67** (efektywne moce, zgodnie z R-MOC-HUD-GLOWNY-Q1=C), a NIE 89 (surowe moce). Pasek pokazuje 29 (ścięcie wojenne), Relacja pokazuje 67.

A) Bez zmian. Zero ryzyka. Gracz widzi pasek 29 i Relację 67 — niespójność zostaje.
B) (REKOMENDACJA) Naprawa prezentacji: pasek Respektu pokazuje efektywny Respekt (67), ścięcie wojenne tylko do etykiety nastawienia ("Wrogi"). Trzeba rozstrzygnąć, czy "Relacja" też ma być ścięta do 29, czy dostać dopisek "limit wojenny 29". Pliki: `diplomacy-display.ts` (`effectiveNastawienieScores`), `ui/diplomacyAudience.ts:1448` i `:2218`, test. Bez zmian w AI, pokoju i progach sojuszu.
C) Osobny składnik "Strach/Dominacja" rosnący z przewagą i wygranymi bitwami, zamiast reinterpretacji Respektu. Duża zmiana (UI, gotowość AI, zapisy, REPIN Rust), wymaga progów liczbowych od właściciela.

Po wyborze B lub C: wpis LEDGER (REPIN Rust) dla `diplomacy-display` / `effectiveNastawienieScores`.

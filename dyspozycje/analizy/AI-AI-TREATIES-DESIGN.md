# Sojusze, NAP i wasalstwo między AI — audyt kodu i projekt toru AI↔AI

Temat: R-WEB-AI-AI-TREATIES-DESIGN-Q1 · Baza: origin/main `c8b0e498b` · Zmiany w `gra/`: brak.
Konwencja: `plik:linia` = stan na bazie. Czego nie ustalono — oznaczono NIE USTALONO.

## 1. Mapa obecnego kodu

**Decyzje AI wobec gracza (tor istniejący).**
- `gra/src/game/ai.ts:6935` — `decideAIDiplomacy`: pętla po partnerach z `inp.relacje`, priorytety P1–P5.
- NAP (P3b), `ai.ts:7402–7414`: wymaga `!hasNapTreaty`, `Relacja ≥ progNapRelacja − napScoreEase` (`diplomacy.ts:218`, 110 przy normalnym), `Zaufanie ≥ progNapZaufanie` (`diplomacy.ts:224`, 30), oraz `aiTreatyParityDuePn('nap', …) ≤ 0` (`ai.ts:7409`). Słabsza AI z dopłatą D > 0 **nie dostaje oferty** (blokada, nie płatność).
- Wypowiedzenie wojny (P4), `ai.ts:7456–7478`: `Zaufanie < PROG_WOJNA_ZAUFANIE`, `!hasNapTreaty` (`ai.ts:7462`), przewaga siły.
- Sojusz (P5), `ai.ts:7485–7517`: rdzeń `allianceCoreMet` przy `Relacja ≥ 130` (`diplomacy.ts:186`) i `Zaufanie ≥ 90` (`diplomacy.ts:176`); `minSojuszAlly = p.progSojusz − …` (`ai.ts:7494`); `p.progSojusz` = `ai_diplomacja_prog_sojusz` = **0,6** (`data/ai-params.json:337–339`, `ai.ts:6352`, `ai.ts:6794`). Blokada parytetu `ai.ts:7516`.
- **Rozjazd progów:** `diplomacy.ts:241` ma `progSojuszWillingnessMin = 0,54` i jest używany przez ocenę propozycji (`diplomacy-proposals.ts:1439`), a inicjatywa AI (`ai.ts:7494`) używa 0,6. NIE USTALONO, który próg jest zamierzony dla inicjatywy AI.
- Wywołanie: `main.ts:45456` (`decideAIDiplomacy` raz na właściciela AI). Lista relacji `relacjeDip` (`main.ts:44903`) zawiera gracza (`main.ts:45030`) **i inne AI** (`main.ts:45084–45106`, pętla `aiOwnerList`).
- Aplikacja komend: `main.ts:45740–45760`. Gałąź `else if (targetId === 0)` (`main.ts:45756`) obsługuje `zaproponuj_sojusz` (`:45768`) i `zaproponuj_pakt` (`:45781`) **tylko dla gracza**. Dla AI-partnera nie ma gałęzi — komenda jest generowana i cicho odrzucana (ustalone czytaniem kodu; nie zweryfikowano w grze).
- Dla AI-partnera działa: `wypowiedz_wojne` (`main.ts:45740–45752`), `zaproponuj_pokoj` / `oferuj_trybut_za_pokoj` → `registerAiAiPeaceRequest` (`main.ts:45786–45792`).

**Tick wojen/rozejmów/pokoju AI↔AI.**
- `main.ts:39093–39130` — `tickAiAiPeaceRequests` wywołuje `runAiAiPeaceTick`.
- `gra/src/game/diplomacy-ai-forced-peace.ts:364` — `runAiAiPeaceTick` (**poprawka do dispatchu**: nie `war-weariness.ts`). Kwalifikacja pary: `isForcedPeaceEligiblePair` (`:121`, tylko dwie główne AI, bez gracza i bez wojny wymuszonej epoki). Limit: `isForcedPeaceDue` (`:~110`).
- Zmęczenie wojną: `gra/src/game/war-weariness.ts:357` — `runWarWearinessTick`; `wearinessForcedPeaceDue` `:353`.

**Przechowywanie stanu umów.**
- Relacja pary: `getDiploRelation` / `setDiploRelation` (`main.ts`, wpis `relWithRespekt` ok. `:44940`); pola `hasNapTreaty`, `hasAllianceTreaty`, `peaceLocked` w `DiplomacjaInputs`.
- Traktaty: `activeDeals` z `RodzajTraktatu` (`types/diplomacy.ts:12–28`: `PaktNieagresji`, `SojuszDefensywny`, `SojuszPelny`, `Wasalizacja`, `Rozejm`, …). Rodzaj sojuszu: `allianceFormalKindBetween` (`main.ts:7039`, `:13965`).
- Blokada pokoju: `diplomacy-peace-lock.ts:12` (`PEACE_TREATY_LOCK_TURNS = 10`), `:45` `filterAllianceObligationsRespectingPeaceLock`; rozejm 5/10/15 tur `:68–80`.
- Wezwanie do wojny: `pendingDiplomacyInbox` (`main.ts:15332`), `enqueueAllianceWarCall` (`main.ts:22421–22440`) — **tylko gdy `isMe(allyId)`**, czyli wezwanie trafia wyłącznie do gracza.
- Kaskada sojuszy: `applyAllianceObligationsOnWar` (`main.ts:25396–25440`). Sojusznik-AI dołącza **automatycznie**, jeśli `aiHonorsAllianceWarObligation` (`ai.ts:6743`) → `shouldHonorAllianceWarObligation` (`alliance-war-obligation.ts:39–52`; domyślnie `minRatioHonor 0,55`, `…Peaceful 0,75`, `maxWarsBeforeRefuse 1` — `:30–32`). Blokada przez `interCivWarBlockedForAi` (`main.ts:25268`, bramka multiwar).
- Wasal: typ `Wasalizacja` istnieje (`types/diplomacy.ts:26`), a AI ma tylko `zadaj_trybut` (P3). Komendy wasalizacji w `ai.ts` brak (`ai.ts:6257`: „v0.2 TODO … wasalizacja”). Wasal AI↔AI = **nowy mechanizm**.

**Parytet siły (już istnieje po stronie AI↔AI, bez toru zawierania).**
- `war-weariness.ts:137` `peacePwPointsByPowerRatio`: `r = mocSilniejszy / mocSłabszy`, `S = round(P·r)`, `W = round(P/r)`, `D = S − W`.
- `war-weariness.ts:177` `peaceAiAiPaymentPn`: płaci tylko słabsza strona (silniejsza → 0).
- `war-weariness.ts:193` `treatyParityBasePnFromData`, `:205` `aiTreatyParityDuePn` — X z `data/diplomacy-acceptance-points.json` (`nap` 2000, `sojusz_pelny` 5000, `sojusz_defensywny` 4200, `rozejm` 2000·(1−L)). **Rozjazd:** `nap.prog_relacja = 50` w danych, a `ai.ts` używa `progNapRelacja = 110` (`diplomacy.ts:218`). NIE USTALONO, który jest wiążący.

## 2. Punkt wpięcia toru AI↔AI

Proponowane: **jedna czysta funkcja oceny** `evaluateTreatyOffer(actionId, pairInput)` w nowym module `gra/src/game/diplomacy-ai-treaties.ts`, wołana przez oba tory. Tor gracza zostaje w `decideAIDiplomacy`; tor AI↔AI wywołuje tę samą funkcję z `main.ts` obok `tickAiAiPeaceRequests` (`main.ts:39093`).

Wejścia (wszystkie już dostępne w `main.ts`):
- Power obu stron: `objectivePowerForOwner` (używane w `main.ts:39120–39160`).
- Zaufanie i Relacja pary: `getDiploRelation` (wpis `relAi`, `main.ts:45084`).
- Stan wojny i tury wojny: `diploWarStateFor(a,b).turnsAtWar`.
- Traktaty pary: `activeDeals` / `hasTreaty`.
- Wspólni wrogowie: z listy wojen obu stron (`getDiploRelation(x, y).status === 'wojna'`).
- Sąsiedztwo: **NIE USTALONO** — brak gotowej relacji sąsiedztwa AI↔AI; proponowane: wspólna granica miast z `cityCessionPlanFor`-podobnej logiki (do potwierdzenia w E1).

Stanowisko AI: `aiDiplomacyStance` przyjmuje `Player`-stuby (`main.ts:~45440–45450`, wzorzec `aiStub/humanStub`), więc da się go użyć dla pary AI↔AI bez zmian w `ai.ts`.

## 3. Parytet siły i dopłata D między dwiema AI

- Wzór już istnieje (`aiTreatyParityDuePn`); zmienia się tylko **zachowanie**: dziś słabsza AI nie składa oferty (`ai.ts:7409`, `:7516`), a wg decyzji właściciela ma **płacić D**.
- Kolejność nośników (z decyzji właściciela): technologie → złoto → brąz → żelazo → rudy → praca → ¤. W pokoju: złoto, rudy (dispatch).
- Problem: **brak mechanizmu wykonania płatności AI↔AI** poza skarbcem — `aiSkarbiecByOwner` istnieje (`main.ts:21175`), ale przelew technologii i surowców między AI nie jest zaimplementowany (NIE USTALONO; `progWymianaTechZaufanie = 70`, `diplomacy.ts` istnieje jako próg, bez wykonania AI↔AI).
- Propozycja: E2 — płatność **wyłącznie złotem** (skarbiec), reszta nośników po decyzji (pytanie P-3).
- Zabezpieczenie: AI nie może zejść poniżej zera skarbca (wzorzec bramki „Skarbiec nigdy poniżej zera”, #365) — wymaga sprawdzenia w E2.

## 4. Wpływ na wojny

- **Wezwanie sojusznika do wojny:** dziś automatyczne dla AI-sojusznika (kaskada `main.ts:25396`), prośba tylko dla gracza (`enqueueAllianceWarCall`). Projekt: bez zmian — ta sama kaskada, bez prośby.
- **Wypowiedzenie przy sojuszu z wrogiem:** brak reguły w kodzie AI↔AI; NIE USTALONO, czy AI ma wtedy wypowiedzieć sojusz (zerwanie) czy wejść do wojny.
- **Zerwanie umowy:** istnieje dobrowolne zerwanie `zerwanie_traktatu` (`diplomacy.ts:895`; kary: NAP −30 Relacji / −20 Zaufania wg `types/diplomacy.ts:17`). AI↔AI nie ma ścieżki zerwania.
- **Wasal a wojna:** NIE USTALONO (brak kodu wasalizacji AI).

**Ryzyka:**
1. Snowball jednej AI: sojusze zwiększają siłę bloku; kaskada dołącza sojuszników. Ograniczenie istniejące: `maxWarsBeforeRefuse = 1` (`alliance-war-obligation.ts:32`).
2. Wojny blokowe: łańcuch wezwań między kilkoma AI. Ryzyko realne po włączeniu sojuszów AI↔AI.
3. Brak eliminacji: sojusze mogą wydłużyć wojny; łagodzi to pokój wymuszony (`isForcedPeaceDue`, `diplomacy-ai-forced-peace.ts`).
4. Długość wojen: wzrost zmęczenia (`war-weariness.ts:357`) przy dłuższych wojnach blokowych.
5. Rozjazd progów (sekcja 1: 0,54 vs 0,6; NAP 50 vs 110) — przed wdrożeniem ujednolicić.

## 5. Plan testów i pomiaru

Istniejące narzędzia (`gra/tools/`): `diplo-war-peace-sim-test.cjs`, `weary40-sim-measure.cjs`, `diplomacy-alliance-sim.cjs`, `diplomacy-peace-sim.cjs`, `ai-war-defend-home-sim.cjs`. Czy da się ≥3×150 tur w obu wariantach: **NIE ZMIERZONO** w tym temacie; `weary40-sim-measure.cjs` to właściwy punkt startu (długie przebiegi), wymaga sprawdzenia czasu jednego przebiegu.

Proponowane kryteria (do zatwierdzenia przez właściciela):
- PASS: w wariancie z torem brak eliminacji AI w ≥ 90% przebiegów; udział największej AI w Power na T150 nie wyższy niż w wariancie bez toru o więcej niż 10 pp; mediana długości wojny nie wyższa niż o 20%.
- FAIL: którykolwiek warunek niespełniony w ≥ 2 z 3 przebiegów.
- Pomiar: 3 ziarna × 150 tur × 2 warianty (z/bez toru), ziarna zapisane w raporcie.

## 6. Parametry liczbowe do decyzji właściciela (pytania ABC)

- **P-1 Maks. liczba sojuszy na AI.** A: 1 (jak `maxWarsBeforeRefuse`). B: 2. C: bez limitu. Rek.: **A** (najmniejsze ryzyko blokowe).
- **P-2 Próg gotowości AI↔AI do sojuszu.** A: 0,54 (`diplomacy.ts:241`, jak ocena propozycji). B: 0,6 (`ai-params.json:337`, jak inicjatywa AI). C: osobny parametr. Rek.: **A** (jedna wartość dla obu torów, po ujednoliceniu).
- **P-3 Nośnik dopłaty D (AI↔AI).** A: tylko złoto (skarbiec). B: złoto + rudy (jak pokój). C: pełna kolejność (technologie → … → ¤). Rek.: **A** w E2, reszta po implementacji wymiany technologii.
- **P-4 Kara za zerwanie NAP/sojuszu przez AI.** A: jak gracz (−30 Relacji / −20 Zaufania). B: tylko Zaufanie (−20). C: brak kary. Rek.: **B** (nie karze pary za wojnę blokową).
- **P-5 Czas trwania NAP.** A: 15 tur (jak gracz, `ai.ts:7414`). B: bezterminowy od Relacji 151 (`diplomacy.ts:190`). C: 30 tur. Rek.: **A**.
- **P-6 Wasal AI↔AI w ogóle.** A: nie w tym kroku (tylko trybut, jak dziś). B: wasal tylko z trybutem. C: pełny wasal z wojną. Rek.: **A** — wymaga osobnej decyzji po E1–E4.
- **P-7 Wezwanie sojusznika-AI do wojny.** A: automatyczne (jak dziś). B: tylko przy sojuszu pełnym. Rek.: **A** (zgodne z kodem).

## 7. Plan etapów implementacji

Każdy etap = osobny temat Haiku z bramkami `tsc` i testami tej funkcji.
- **E0 (decyzje):** P-1…P-7; ujednolicenie progów (sekcja 1, rozjazd 0,54/0,6 i NAP 50/110).
- **E1:** czysta funkcja `evaluateTreatyOffer` + testy jednostkowe (bez zmiany zachowania gry).
- **E2:** NAP AI↔AI + płatność D złotem (zależność: **TREATY-PAY** #528 — nośnik D; **PEACE-LASTSTAGE** #529 — płatność złotem/rudami w pokoju).
- **E3:** sojusz defensywny AI↔AI (zależność: E2; kaskada już istnieje `main.ts:25396`).
- **E4:** sojusz pełny AI↔AI i reguła sojusz-z-wrogiem (zależność: E3, decyzja P-4).
- **E5:** wasal AI↔AI (tylko po decyzji P-6).
- **E6:** pomiar ≥3×150 tur i raport PASS/FAIL (sekcja 5) przed każdym wdrożeniem na ROBOCZĄ.

## Uwagi dla orkiestratora

- Dispatch wskazywał `war-weariness.ts` jako miejsce `runAiAiPeaceTick` — poprawnie: `diplomacy-ai-forced-peace.ts:364`.
- Nie zmieniano `gra/`. Nie zmierzono działania w grze ani symulacji.

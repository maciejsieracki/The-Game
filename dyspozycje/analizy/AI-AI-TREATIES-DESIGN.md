# Sojusze, NAP i wasalstwo między AI — audyt kodu i projekt toru AI↔AI

Temat: R-WEB-AI-AI-TREATIES-DESIGN-Q1 · Baza: origin/main `c8b0e498b` · Zmiany w `gra/`: brak.
Konwencja: `plik:linia` = stan na bazie `c8b0e498b` (katalog `gra/` identyczny w kandydacie). Czego nie ustalono — oznaczono NIE USTALONO.
**Zastrzeżenie o świeżości:** origin/main to już `1906b3f32` (FALA 829); `gra/src/main.ts` zmienił się od `c8b0e498b` (+75/−3). Numery linii `main.ts` w tym dokumencie NIE są odświeżone do `1906b3f32`. Odświeżenie (ponowny grep) jest warunkiem wstępnym E1, nie tego audytu.

## 1. Mapa obecnego kodu

**Decyzje AI wobec gracza (tor istniejący).**
- `gra/src/game/ai.ts:6935` — `decideAIDiplomacy`: pętla po partnerach z `inp.relacje`, priorytety P1–P5.
- Propozycja AI na stole dla gracza: `planAiOfferOnTable` — **`gra/src/game/diplomacy-proposals.ts:2915`** (nie w `diplomacy-ai-offer-balance.ts`; ten plik zawiera tylko pomocnicze progi tolerancji, np. `aiOfferPwSurplusTolerance` `:87`). Wołane z `main.ts:21457`. Dla pokoju/rozejmu: co najwyżej jedna aktywna propozycja AI na parę (dedup).
- NAP (P3b), `ai.ts:7402–7416`: wymaga `!hasNapTreaty`, `Relacja ≥ progNapRelacja − napScoreEase` (`diplomacy.ts:218`, 110 przy normalnym), `Zaufanie ≥ progNapZaufanie` (`diplomacy.ts:224`, 30), oraz `aiTreatyParityDuePn('nap', …) ≤ 0` (`ai.ts:7409`). Słabsza AI z dopłatą D > 0 **nie dostaje oferty** (blokada, nie płatność).
- Wypowiedzenie wojny (P4), `ai.ts:7456–7478`: `Zaufanie < PROG_WOJNA_ZAUFANIE`, `!hasNapTreaty` (`ai.ts:7462`), przewaga siły.
- Sojusz (P5), `ai.ts:7485–7517`: rdzeń `allianceCoreMet` przy `Relacja ≥ 130` (`diplomacy.ts:186`) i `Zaufanie ≥ 90` (`diplomacy.ts:176`); `minSojuszAlly = p.progSojusz − …` (`ai.ts:7494`); `p.progSojusz` = `ai_diplomacja_prog_sojusz` = **0,6** (`data/ai-params.json:337–339`, `ai.ts:6352`, `ai.ts:6794`). Blokada parytetu `ai.ts:7516`.
- **Rozjazd progów:** `diplomacy.ts:241` ma `progSojuszWillingnessMin = 0,54` i jest używany przez ocenę propozycji (`diplomacy-proposals.ts:1439`), a inicjatywa AI (`ai.ts:7494`) używa 0,6. NIE USTALONO, który próg jest zamierzony dla inicjatywy AI.
- Wywołanie: `main.ts:45456` (`decideAIDiplomacy` raz na właściciela AI). Lista relacji `relacjeDip` (`main.ts:44903`) zawiera gracza (`main.ts:45030`) **i inne AI** (`main.ts:45084–45106`, pętla `aiOwnerList`).
- Aplikacja komend: `main.ts:45740–45760`. Gałąź `else if (targetId === 0)` (`main.ts:45756`) obsługuje `zaproponuj_sojusz` (`:45768`) i `zaproponuj_pakt` (`:45781`) **tylko dla gracza**. Dla AI-partnera nie ma gałęzi — komenda jest generowana i cicho odrzucana (ustalone czytaniem kodu; nie zweryfikowano w grze).
- Dla AI-partnera działa: `wypowiedz_wojne` (`main.ts:45740–45752`), `zaproponuj_pokoj` / `oferuj_trybut_za_pokoj` → `registerAiAiPeaceRequest` (`main.ts:45786–45792`), `zaproponuj_handel_surowiec` → `applyAiAiHandelSurowiecCmd` (definicja `main.ts:24961`, wywołanie `main.ts:45792`).
- Stub stanowiska AI dla pary AI↔AI: `aiStub` `main.ts:44941`, wywołanie `aiDiplomacyStance(aiStub, humanStub, …)` `main.ts:44943`.

**Tick wojen/rozejmów/pokoju AI↔AI.**
- `main.ts:39108` — `tickAiAiPeaceRequests(battlePending)` (poprzedni zapis `39093` był błędny); wywołuje `runAiAiPeaceTick`.
- `gra/src/game/diplomacy-ai-forced-peace.ts:364` — `runAiAiPeaceTick` (**poprawka do dispatchu**: nie `war-weariness.ts`). Kwalifikacja pary: `isForcedPeaceEligiblePair` (`:121`, tylko dwie główne AI, bez gracza i bez wojny wymuszonej epoki). Limit: `isForcedPeaceDue` (`:100`).
- Zmęczenie wojną: `gra/src/game/war-weariness.ts:357` — `runWarWearinessTick`; `wearinessForcedPeaceDue` `:353`.

**Przechowywanie stanu umów.**
- Relacja pary: `getDiploRelation` / `setDiploRelation` (`main.ts`, wpis `relWithRespekt` `main.ts:44951`); pola `hasNapTreaty`, `hasAllianceTreaty`, `peaceLocked` w `DiplomacjaInputs`.
- Traktaty: `activeDeals` z `RodzajTraktatu` (`types/diplomacy.ts:12–28`: `PaktNieagresji`, `SojuszDefensywny`, `SojuszPelny`, `Wasalizacja`, `Rozejm`, …); komentarz kar NAP w `types/diplomacy.ts:17`. Rodzaj sojuszu: `allianceFormalKindBetween` (`main.ts:7039`, `:13965`).
- Blokada pokoju: `diplomacy-peace-lock.ts:12` (`PEACE_TREATY_LOCK_TURNS = 10`), `:45` `filterAllianceObligationsRespectingPeaceLock`; rozejm 5/10/15 tur `:68–80`.
- Wezwanie do wojny: `pendingDiplomacyInbox` (`main.ts:15332`), `enqueueAllianceWarCall` (`main.ts:22421–22440`) — **tylko gdy `isMe(allyId)`**, czyli wezwanie trafia wyłącznie do gracza.
- Kaskada sojuszy: `applyAllianceObligationsOnWar` (`main.ts:25396–25440`). Sojusznik-AI dołącza **automatycznie**, jeśli `aiHonorsAllianceWarObligation` (`ai.ts:6743`) → `shouldHonorAllianceWarObligation` (`alliance-war-obligation.ts:39–52`; domyślnie `minRatioHonor 0,55`, `…Peaceful 0,75`, `maxWarsBeforeRefuse 1` — `:30–32`). Blokada przez `interCivWarBlockedForAi` (`main.ts:25268`, bramka multiwar).
- Dobrowolne zerwanie: typ komendy `zerwanie_traktatu` deklarowany w `diplomacy.ts:895` (wpis unii typów); obsługa w `diplomacy.ts:1073`.
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
- Stan nośników (poprawka po ocenie Evaluatora): istnieje **handel surowcem AI↔AI** — `applyAiAiHandelSurowiecCmd` (`main.ts:24961`): auto-akceptacja przez `resolvePlayerAcceptsAiPending`, zapis w `activeDeals` (`applyAcceptedProposal`), pakiety `pakietyPerTura`/`zaplataPerTura` (`main.ts:24940–24958`). To **umowa cykliczna**, nie jednorazowy przelew. NIE USTALONO, czy można jej użyć jako nośnika jednorazowej dopłaty D (wymaga osobnego sprawdzenia w E2).
- Skarbiec AI: `aiSkarbiecByOwner` (`main.ts:21175`; odczyt `main.ts:10919`) — przelew **złota** między dwiema AI nie jest w kodzie zaimplementowany (NIE USTALONO co do przelewu jednorazowego; brak go w zbadanych ścieżkach AI↔AI).
- Przelew **technologii** AI↔AI: NIE USTALONO w tej rundzie (nie zbadano; `progWymianaTechZaufanie = 70` w `diplomacy.ts` jest progiem bez potwierdzonego wykonania AI↔AI).
- Propozycja: E2 — płatność **wyłącznie złotem** (skarbiec), reszta nośników po decyzji (pytanie P-3).
- Zabezpieczenie: AI nie może zejść poniżej zera skarbca (wzorzec bramki „Skarbiec nigdy poniżej zera”, #365) — wymaga sprawdzenia w E2.

## 4. Wpływ na wojny

- **Wezwanie sojusznika do wojny:** dziś automatyczne dla AI-sojusznika (kaskada `main.ts:25396`), prośba tylko dla gracza (`enqueueAllianceWarCall`, `main.ts:22421–22440`, warunek `isMe(allyId)` w `main.ts:22427`). Projekt: bez zmian — ta sama kaskada, bez prośby.
- **Kaskada wojny i rozgałęzienia gracz/AI** (pominięte w poprzedniej wersji): `breakTreatiesOnWar(allyId, mustDeclareWarOn, isMe(allyId))` `main.ts:25338`; gałęzie `isMe(allyId)` w `main.ts:25361` (pomiń), `:25414` (blokada `interCivWarBlockedForAi` tylko dla AI), `:25419`, `:25430`. Każda zmiana kaskady musi zachować te rozgałęzienia — kluczowe dla E3/E4.
- **Wypowiedzenie przy sojuszu z wrogiem:** brak reguły w kodzie AI↔AI; NIE USTALONO, czy AI ma wtedy wypowiedzieć sojusz (zerwanie) czy wejść do wojny.
- **Zerwanie umowy:** istnieje dobrowolne zerwanie `zerwanie_traktatu` (typ `diplomacy.ts:895`, obsługa `diplomacy.ts:1073`; kary NAP −30 Relacji / −20 Zaufania wg komentarza `types/diplomacy.ts:17`). AI↔AI nie ma ścieżki zerwania.
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

- **P-1 Maks. liczba sojuszy na AI.** A: 1. B: 2. C: bez limitu. Rek.: **A** (najmniejsze ryzyko blokowe). Uwaga (poprawka): `maxWarsBeforeRefuse = 1` (`alliance-war-obligation.ts:23`, domyślnie `:32`, użycie `:42`) to limit **wojen**, a nie liczby sojuszy — nie jest on źródłem tej wartości; rekomendacja jest decyzją projektową, nie wynikiem kodu.
- **P-2 Próg gotowości AI↔AI do sojuszu.** A: 0,54 (`diplomacy.ts:241`, jak ocena propozycji). B: 0,6 (`ai-params.json:337`, jak inicjatywa AI). C: osobny parametr. Rek.: **A** (jedna wartość dla obu torów, po ujednoliceniu).
- **P-3 Nośnik dopłaty D (AI↔AI).** A: tylko złoto (skarbiec). B: złoto + rudy (jak pokój). C: pełna kolejność (technologie → … → ¤). Rek.: **A** w E2, reszta po implementacji wymiany technologii.
- **P-4 Kara za zerwanie NAP/sojuszu przez AI.** A: jak gracz (−30 Relacji / −20 Zaufania, komentarz `types/diplomacy.ts:17`) — **zachowuje parytet z torem gracza**. B: tylko Zaufanie (−20) — łamie parytet z torem gracza (kara za NAP niższa niż dla gracza), ale lżej karze w wojnie blokowej. C: brak kary — sprzeczne z zasadą parytetu. Rek.: **A** (poprawka: wcześniejsza rekomendacja B pomijała rozjazd z torem gracza; wybór B wymaga świadomej zgody na asymetrię).
- **P-5 Czas trwania NAP.** A: 15 tur (jak gracz, `ai.ts:7416`). B: bezterminowy od Relacji 151 (`diplomacy.ts:190`). C: 30 tur. Rek.: **A**.
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

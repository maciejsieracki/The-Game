# R-WEB-DIPLO-TRUCE-IMPL-Q1 — raport Operatora, runda 5 (DODATEK 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-IMPL-Q1 (runda 5/5)
GOAL: wdrożyć decyzje ABC 2026-11-10 po FC r4: (2) AI-adresat przyjmuje pokój po rozejmie wg siły wojskowej (proponujący ≤ 80% adresata), bez Zaufania; (4) rozejm spoza 5/10/15 = odrzucenie propozycji; (3) Z8 potwierdzone testem.
ZMIANY/COMMIT:
- Kod operatora: 5f3b48852 (R5) na bazie ea9fca67e (r4) + merge origin/main e4f57ace2 (w tym samym branchu).
- Scalenie najnowszego origin/main w trakcie tematu: merge b06fa51c5 (origin/main bb92c8c90, FALA 601); czysty, bez konfliktów; testy powtórzone po merge.
- Pliki (allowlista R5): gra/src/game/diplomacy-peace-lock.ts, gra/src/main.ts, gra/tools/diplo-truce-impl-test.cjs. Brak zmian w WERSJE.md, gra-robocza/, build/dev, push/deploy.
- Branch lokalny: wip/R-WEB-DIPLO-TRUCE-IMPL-Q1-r5 (= b06fa51c5); ref web-wip/TRUCEIMPL-r5 (lokalny). NIE_WYPCHNIĘTO (rola Operatora).
- Ancestry: 5f3b48852 zawiera ea9fca67e (r4) — sprawdzone; b06fa51c5 zawiera origin/main bb92c8c90 — sprawdzone.

Szczegóły zmian:
1. (2) diplomacy-peace-lock.ts: `truceEndAiAccepts(proposerArmyM, addresseeArmyM, prog = WAR_PEACE_PARAMS.przewagaMilitarna.prog)` — zgoda gdy proposer ≤ (1 − prog + eps) × addressee. Usunięte: `TRUCE_END_AI_ACCEPT_TRUST_MIN` i zależność od Zaufania. Port `getZaufanie` zastąpiony portem `getArmyM(ownerId)`. `truceEndTickPair` wywołuje `truceEndAiAccepts(getArmyM(initiator), getArmyM(target))`.
2. (2) main.ts `truceEndPorts()`: `getArmyM: ownerId => sumArmyMForOwner(ownerId)` (suma M_pole armii = ta sama miara co militaryRatioFromArmyM; NIE objectivePower).
3. (4) main.ts `finalizePeaceTreatyBetween`: `truceTurns !== undefined` spoza 5/10/15 → return (no-op). Wcześniej `peaceFinalizeTrustEvent` zamieniał taką wartość w „pokój stały +5".
4. (4) main.ts gałąź `cywAction === 'rozejm'`: długość spoza 5/10/15 → komunikat „Rozejm odrzucony" i brak finalizacji (wcześniej cichy fallback do 10 tur). Walidacja w diplomacy-proposals.ts (`accepted:false`) już istniała i pozostaje.
5. (3) Z8 — kod z r4 już realizuje: w `chargeWarDeclarationCredibility` `truceBreach = isTruceWindowBreach(meta)`, który obejmuje `truceEndOffer != null`; złamanie daje `zlamanie_paktu_nap` (N2) i kasuje ofertę (`clearTruceEndOffer`). Nie zmieniano; potwierdzone testami.

Założenia (do potwierdzenia przez orkiestratora / właściciela):
- ZAŁOŻENIE-R5-A: „moc militarna" = suma M_pole armii (sumArmyMForOwner), nie objectivePower (panel „Moc militarna" używa objectivePower, więc to rozróżnienie wymaga potwierdzenia).
- ZAŁOŻENIE-R5-B: „mniejsza o co najmniej 20%" = proponujący ≤ 80% adresata (granica włącznie).
- ZAŁOŻENIE-R5-C: przypadek 0 armii — proponujący 0 wobec adresata > 0 → zgoda; oba 0 → 0 ≤ 0 → zgoda (AI przyjmuje). Do decyzji, czy zero-zero powinno być odmową.
- Próg 20% czytany z `gra/data/diplomacy-war-peace-params.json` → `przewagaMilitarna.prog` (ten sam klucz co reguły przewagi AI-gracz; nie na sztywno).
- Z8/Z9 bez zmiany zakresu (Z8 już wdrożone w r4).

TESTY:
- `node gra/tools/diplo-truce-impl-test.cjs` → 78 PASS / 0 FAIL (rozszerzone: akceptacja wg siły na granicy 80%/81%/100%, parametr prog, NaN; B-4 r5 — słabszy ≥20% zgoda, słabszy <20% wojna, wysokie Zaufanie nie zmienia odmowy; Z8 — wiring zlamanie_paktu_nap + clearTruceEndOffer + predykat oferty; Z9 — guard w finalize, brak fallbacku 10, peaceFinalizeTrustEvent(7)=pokój, walidacja w diplomacy-proposals; mutanty M1 (zgoda zawsze, przepisany na siłę) i M2/M3 wykryte).
- `diplo-truce-r1-test.cjs` → 30 pass / 0 fail.
- `diplo-truce-r4-ai-test.cjs` → 24 pass / 0 fail.
- `diplomacy-peace-lock-test.cjs` → 9 pass / 0 fail.
- `diplomacy-war-gates-test.cjs` → 22 pass / 0 fail.
- `npx tsc --noEmit` (gra/) → exit 0, 0 błędów (przed i po merge origin/main).
- `git diff --check` → czysto.
- NIE_ZMIERZONO: test w przeglądarce/live (Chromium, pełna tura z rozejmem i ofertą pokoju) — brak uruchomienia gry; Z8 potwierdzone na poziomie predykatu, wiringu źródła i testu portów, nie w grze.

BLOKADY: brak blokad technicznych. Otwarte założenia ZAŁOŻENIE-R5-A/B/C (powyżej). Dług poza zakresem (nie robiono): wiki/docs, plakietka UI rozejmu, live-testy, save/load, REPIN Rust.

RUNDY: 5/5 (DODATEK 2 — wykonany ostatni dodatek; baza ea9fca67e/origin/main). Brak eskalacji: wszystkie decyzje wiążące z ABC 2026-11-10 wdrożone, założenia zapisane.

NASTĘPNY KROK: Evaluator (przegląd R5, zwłaszcza ZAŁOŻENIE-R5-A i C), potem Final Control, integracja orkiestratora. Uwaga dla orkiestratora: numeracja raportu — zapisano jako 05-operator-r5.md (wg numeracji dispatcha, zamiast szablonu 01-operator-r1.md z taska).

DEPLOY/PUSH: NIE WYKONANO (rola Operatora; brak push i deployu; brak zmian w WERSJE.md).

Środowisko: dysk / przy starcie 5,9 GB wolnego, po testach 5,4 GB. node_modules podlinkowane (symlink, bez kopiowania) z istniejącego worktree wf_e9c818a3-d7d-1/gra — nie jest częścią commitów.

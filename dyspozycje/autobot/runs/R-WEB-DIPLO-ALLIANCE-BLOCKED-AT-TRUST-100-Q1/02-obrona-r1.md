# R-WEB-DIPLO-ALLIANCE-BLOCKED-AT-TRUST-100-Q1 — obrona Operatora, runda 1 (odpowiedź na zarzuty)

STATUS: PASS-WITH-NOTES (zarzuty 1–4 rozstrzygnięte; progi sojuszu nadal DECISION_REQUIRED dla właściciela; odstępstwo allowlisty wymaga akceptacji orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-BLOCKED-AT-TRUST-100-Q1
BAZA: origin/main 74ba2cb38 → commit Operatora e8d2b0473 → ta obrona (SHA w raporcie końcowym, commit po e8d2b0473)
ROLA: Operator (obrona), model Haiku 5.5

## 1. Odpowiedzi na zarzuty

**Z1 — allowlista: gra/src/main.ts poza dispatchem — PRZYJMUJĘ jako odstępstwo, do akceptacji orkiestratora.**
- Dowód: `git show e8d2b0473 --stat` pokazuje `gra/src/main.ts | 13 ++--`.
- Dlaczego nie da się bez tego: tier emblematu jest liczony w `main.ts` w trzech miejscach (linie ~7992, ~8079, ~24424), a helper `hasAllianceDealBetween` (~21751) musi widzieć `activeDeals`, który żyje w `boot()`. Alternatywa (zmiana `relationTier` w `diplomacy.ts`) zmieniłaby silnik i AI, bo `relationTier` jest tam używany do decyzji; to byłoby poza zakresem „tylko UI”.
- Zakres zmiany w main.ts: import + 3 podmiany wywołania + helper. Zero innych zmian (potwierdzone diffem).
- Orkiestrator decyduje, czy to akceptuje. Operator NIE twierdzi, że ta zmiana była w allowliście.

**Z2 — test „emblemat = lista = silnik” tylko częściowy — PRZYJMUJĘ, poprawka w commicie.**
- Dodano w `gra/tools/diplo-alliance-gate-test.cjs`:
  - C2a: treść `hasAllianceDealBetween` to dokładnie `activeDeals.some(d => dealInvolvesOwners(d, a, b) && isAllianceDealKind(d.rodzaj))`;
  - C2b: blok listy „Sojusze” (`sojuszPartners`) czyta `activeDeals` i `isAllianceDealKind(d.rodzaj)`;
  - C3: `hasSojusz` w locku (`diplomacy-locks` → `dualGate` dla akcji sojuszu) używa tego samego predykatu.
- Wynik: `15 PASS, 0 FAIL` (było 12).
- Granica (uczciwie): są to sprawdzenia strukturalne na tekście `main.ts`, nie test runtime. Test na żywo emblemat/lista w przeglądarce — NIE_ZMIERZONO.

**Z3 — diagnoza oparta na liczbach ze zrzutu, nie na kodzie — PRZYJMUJĘ, z korektą wniosków.**
- Dodana tabela warunków z kodu (sekcja 2). Przy okazji wykryto, że poprzednia diagnoza była niepełna w dwóch punktach:
  1. `progUmowaMinRelacja` = 151 (`gra/data/diplomacy.json:36`), tak samo jak `progSojuszRelacja` = 151. Silnik liczy `minScore = max(progUmowaMinRelacja, progSojuszRelacja − ease + penaltyScore − słodzik + deltaRelacjiSojusz(agresor))`. Czyli **151 jest podłogą**; ulga nie obniży progu poniżej 151, ale kara lub flaga agresora mogą go podnieść.
  2. UI blokady (`diplomacy-locks.ts`, `dualGate`) pokazuje bazowe `progSojuszRelacja` = 151, a NIE efektywny próg silnika. Przy przewadze/karze komunikat „wymaga Relacji 151” może nie być prawdziwym progiem silnika (przy karze engine wymaga więcej, po odblokowaniu gracz dostaje odrzucenie po złożeniu propozycji).
- Wniosek „148 < 151 to jedyna pewna blokada” — **korygowany**: 148 < 151 blokuje przy `milRatio = 1` i bez flagi agresora (tak jest w zrzucie, jeśli siła jest równa). Dla pozostałych bramek (słaby proponent, hegemon, gotowość AI) nie ma danych ze zrzutu, więc NIE_ZMIERZONO.
- Nie zmieniam zachowania UI w tym temacie: wybór, czy UI ma pokazywać efektywny próg, to decyzja produktowa (sekcja 3).

**Z4 — typecheck niezmierzony — PRZYJMUJĘ, zmierzone w tej rundzie.**
- Zależności podpięte tymczasowo z `scratchpad` (typescript 5.6.3, three 0.169.0, @types/three 0.169.0, esbuild 0.28.2) przez symlink `gra/node_modules`; symlink usunięty przed commitem.
- `tsc --noEmit -p gra/tsconfig.json`:
  - baza 74ba2cb38: 29 błędów `src/`;
  - commit e8d2b0473: 29 błędów `src/`;
  - zbiory błędów IDENTYCZNE (`diff` pusty). Błędy są w `src/audio/filePlayer.ts`, `src/audio/muzyka-antyczna.ts`, `src/ui/icons/brandAssets.ts`, `src/ui/leaderPortraits.ts` — pliki nieruszane przez temat. Zmiany tematu nie wprowadzają nowych błędów typów.
- Testy (zmierzone, nie przepisane z raportu Operatora):
  - `node tools/diplo-alliance-gate-test.cjs`: 15 PASS / 0 FAIL (po poprawce Z2);
  - `node tools/diplomacy-locks-test.cjs`: 88 passed / 0 failed;
  - `node tools/diplomacy-test.cjs`: 148 passed / 0 failed.

## 2. Tabela „warunek × wartość × wynik” (kod + scenariusz ze zrzutu)

Kod: `gra/src/game/diplomacy-proposals.ts` (case `sojusz_defensywny`/`sojusz_pelny`, ok. 1174–1235) i `gra/src/game/diplomacy-locks.ts` (case `'3'`, ok. 245–251). Wartości progów: `gra/data/diplomacy.json`.

| # | Warunek (kod) | Wartość w scenariuszu | Próg (wartość w JSON / formuła) | Wynik |
|---|---|---|---|---|
| 1 | Wojna z tą parą (`ctx.atWar` / `rel.status === 'wojna'`) | pokój z graczem; wojna Sumer–Egipt nie wchodzi do bramki (lock sprawdza tylko parę) | — | PASS: wojna z trzecią stroną NIE blokuje |
| 2 | Sojusz tego typu już istnieje (`pairHasKind`, `hasSojusz`) | „Sojusze: brak” | — | PASS |
| 3 | Zaufanie ≥ `minZ` = `progSojuszZaufanie − ease.zaufanie + penaltyZ`, piętra 2×/3× | Zaufanie 100 | `progSojuszZaufanie` = 91; piętra 85 (2×) / 83 (3×) | PASS dla ease = kara = 0 (przy przewadze/karze wynik NIE_ZMIERZONO) |
| 4 | Relacja ≥ `minScore` = `max(151, 151 − ease.score + penaltyScore − słodzik + deltaRelacjiSojusz(agresor))` | Relacja 148 (100 + 48) | podłoga `progUmowaMinRelacja` = 151 | FAIL (148 < 151) przy milRatio = 1 i bez flagi agresora |
| 5 | Słaby proponent: `milRatio < 0.5` ∧ Respekt proponenta ≤ respondenta ∧ Relacja < `progUmowaMinRelacja` | Respekt 48 ≤ 52: TAK; 148 < 151: TAK; milRatio: NIE_ZMIERZONO | 0.5 / 151 | Blokuje, JEŚLI milRatio < 0.5 (inny komunikat: „Za słaby proponent…”). Nie zmierzono |
| 6 | Hegemon: `milRatio ≤ progSojuszHegemonMilRatio` → `hegemonBlocksAlliance` | NIE_ZMIERZONO (siła nie w zrzucie) | 0.42 | Nie zmierzono |
| 7 | Gotowość AI: `willingnessAlly ≥ progSojuszWillingnessMin − ease.ally + penaltyAlly` | NIE_ZMIERZONO (stan AI nie w zrzucie) | 0.68 | Nie zmierzono; powód widoczny dopiero po złożeniu propozycji |
| 8 | Wiarygodność proponenta ≥ `wiarygodnoscProgSojuszMin` | — | 0 | PASS |
| 9 | Cooldown po odrzuceniu (`diplomacy-rejection-cooldown.ts`, klucz actionId + partner) | NIE_ZMIERZONO (historia odrzuceń nie w zrzucie) | — | Nie zmierzono. Uwaga: lock UI tego cooldownu NIE pokazuje |
| 10 | Bramka epoki/techu | w funkcjach sojuszu i w locku `'3'` brak takiej bramki | — | Nie znaleziono w kodzie tej akcji |

Wniosek z tabeli: w zrzucie blokada pewna to tylko warunek 4 (148 < 151), pod warunkiem równej siły. Warunki 5–7 i 9 mogą blokować równolegle i wymagają stanu gry, którego nie ma w zrzucie.

## 3. Nowe ustalenie: rozjazd UI ↔ silnik progu Relacji (DECISION_REQUIRED, bez zmiany kodu)

- UI (`dualGate` w `diplomacy-locks.ts`) pokazuje bazowe 151.
- Silnik (`diplomacy-proposals.ts`, `minScore`) używa efektywnego progu z przewagi/kary/agresora/słodzika, z podłogą 151.
- Skutek: przy kanie wyższym niż proponent (kara) gracz widzi odblokowanie przy 151, a silnik odrzuca propozycję przy np. 155. Przy przewadze silnik wymaga 151 (podłoga), więc UI nie blokuje za mocno.
- Opcje dla ABC (orkiestrator zadaje pytanie właścicielowi, Operator nie zadaje):
  - A) zostawić jak jest: UI pokazuje podłogę 151, silnik może wymagać więcej; ryzyko: odrzucenie po złożeniu propozycji mimo „odblokowania”;
  - B) UI liczy efektywny próg z tych samych wzorów (wymaga milRatio, respektów i słodzika w kontekście locka; zmiana `diplomacy-locks.ts` + `main.ts`, poza tym tematem);
  - C) UI pokazuje podłogę 151 i dodatkowo, gdy kara/agresor podnoszą próg, dopisuje „+X za …” (jak już działa dla NAP granic, `powodRel`).
- Rekomendacja Operatora: C (najmniejsza zmiana, spójna z istniejącym wzorcem `powodRel`). Progi w `gra/data/diplomacy.json` nie zmieniane.

## 4. Stan zmian w tej rundzie

- Zmieniony plik: `gra/tools/diplo-alliance-gate-test.cjs` (sekcja C2/C3).
- Nowy plik: ten dokument.
- Nie zmieniono: `gra/src/`, `gra/data/`, `WERSJE.md`, `gra-robocza/`, nic nie pushowano, nic nie wdrożono.
- Tymczasowy symlink `gra/node_modules` usunięty przed commitem.

## 5. Odstępstwa od dispatchu (do akceptacji orkiestratora)

- `gra/src/main.ts` (13 linii, patrz Z1). Nieobjęte allowlistą dispatchu.

## 6. Poza zakresem

- Zadanie #142 `BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD` (martwe jednostki na polu bitwy) nie było w tym temacie i nie było oceniane.

NASTĘPNY KROK: orkiestrator — akceptacja odstępstwa main.ts; decyzja właściciela o rozjeździe UI/silnik (sekcja 3); potem integracja i deploy wyłącznie po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO

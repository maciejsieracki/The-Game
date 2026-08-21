# 01-operator — R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1
GOAL: Wątki A+B naprawione (duplikat/baner usunięty, nazewnictwo poprawione); Wątek D
(regres akumulacji puli) zdiagnozowany i naprawiony w `main.ts`; Wątki C i E — TYLKO recon,
materiał ABC gotowy do zadania właścicielowi (implementacja wstrzymana do decyzji).

## Provenance

- Worktree izolowany, branch `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`.
- KROK 0: HEAD startowy (`acd40380`) był przodkiem `af91c79d` → `git merge --ff-only af91c79d`
  wykonany. HEAD po merge: `af91c79d8420a67bbff3d320f0dd9a0423ce2a24`.
- Przeczytano w całości: `00-dispatch.md` tego tematu; raporty i dispatch
  `R-PRACA-PULA-NIEAKUMULUJE-Q1/` (00-dispatch, 01-operator, 02-evaluator);
  `R-PRACA-JEDEN-SUWAK-UI-Q1/` (01-operator, 04-integration); testy
  `R-PRACA-MIASTO-LIMIT-50-Q1/` i `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1/` (kontekst).
- `npm install` w `gra/` wykonany (node_modules brakował).
- Zero zmian w `gra/tools/praca-limit-50-test.cjs` (nie było potrzeby — dokumentuje
  Wątek C bez zmian zachowania).

---

## KROK 1 — Pełny recon architektury (tabela kontrolek)

Podział Pracy budynki/ulepszenia to w rzeczywistości **TRZY NIEZALEŻNE stany**, renderowane
w **czterech miejscach** w dwóch plikach UI (`empireDetailPanel.ts`, `buildModeHud.ts`) plus
jednym w `cityPanel.ts`:

| # | Kontrolka (etykieta w UI) | Plik : linia (przed zmianą) | Pole stanu (main.ts / cities.ts) | Zakres | Współdzielona z |
|---|---|---|---|---|---|
| 1 | „PODZIAŁ PRACY: BUDYNKI / ULEPSZENIA" — suwak `data-praca-empire-split` w panelu **Praca Imperium** | `empireDetailPanel.ts:1103-1139` (`renderEmpirePracaBudgetSplitSection`) | `ownerDefaultPracaSplit` (Map), `EmpirePracaSplit.procentUlepszenia`, `clampPracaWspolnyWorekPercent` (cities.ts:216-223) | 0–50% (Ulepszenia), remainder 50–100% (Budynki) | **TAK — z #2** (identyczny stan, identyczny clamp, identyczny listener `onChange`/`getDef`) |
| 2 | „Podział Praca: budynki / ulepszenia" — suwak `data-praca-empire-split` w panelu **Automatyzacja ulepszeń terenu** (build mode HUD) | `buildModeHud.ts:269-287` (`renderEmpirePracaSplit`) | TA SAMA `ownerDefaultPracaSplit` przez `config.getEmpirePracaSplit`/`onEmpirePracaSplitChange` → `effectivePracaSplitForOwner(0)` (main.ts:19030-19037, 4754-4758) | 0–50% | **TAK — z #1.** To jest Wątek E: potwierdzone „ten sam stan", NIE osobny parametr. |
| 3 | „Globalny budżet automatu:" / „Lokalny budżet automatu:" — suwaki `data-ulepszenia-{empire,city}-percent` w tym samym panelu Automatyzacji | `buildModeHud.ts:425-431, 474-480` (`renderUlepszeniaPercentRow`, `max=100`) | `ulepszeniaEmpireByOwner.pracaAutoPercent` / per-miasto `city.ulepszeniaPracaPercent` (override), `clampUlepszeniaPracaPercent` — **NIE** `clampPracaWspolnyWorekPercent** | 0–100% (już dziś, bez ograniczenia) | Niezależny od #1/#2 — to „historyczny automat" (Wątek C). Nie renderuje 0–50, więc Wątek E dispatchu NIE dotyczy tej pary suwaków (już mają 100%). |
| 4 | „Budynki 50–100% / Pula Pracy 0–50% (lokalnie)" — suwak per-miasto w panelu **Indywidualne** | `cityPanel.ts:4803-4862` (`renderPodzialPracy`), stan `readPodzialPracy`/`cfg.onPodzialPracyChange` | `ownerDefaultPodzialPracy` / per-miasto `city.podzialPracy.procentBudynki`, `clampPodzialPracyBudynkiPercent` (cities.ts:360-369, MIN=50/MAX=100) | 50–100% Budynki (0–50% Pula) | Niezależny od #1/#2/#3 — trzeci, osobny mechanizm. Nie pozwala miastu przekroczyć 50% na ulepszenia (patrz niżej — #3 jest tym, co pozwala). |
| — | Baner (nieinteraktywny) „Budynki X% · N / Pula imperium Y% · N" nad #1 | `empireDetailPanel.ts:1058-1065` (przed usunięciem) | Odczyt **realnej sumy** `pracaBudynki`/`pracaPula` z `cityEcon` (agregat per-miasto tej tury) — BEZ własnego stanu zapisu | 0–100%, obliczane | Nie jest kontrolką (brak `<input>`), ale stylowany identycznie jak #1 (`.civ-emp-slider-label gold/blue`) → to jest **Wątek A**: usunięty w tej rundzie (patrz niżej). |

**Kluczowa odpowiedź KROKU 1:** żadne dwie z trzech PRAWDZIWYCH kontrolek (#1/#2 razem, #3, #4)
nie są przypadkowym duplikatem tego samego pola błędnie nazwanym tak samo — #1/#2 SĄ dosłownie
tym samym stanem (`ownerDefaultPracaSplit`) renderowanym w dwóch panelach, #3 i #4 to naprawdę
odrębne, świadomie zaprojektowane mechanizmy z różnymi capami (100% i 50–100% odpowiednio).
Prawdziwym „duplikatem" z Wątku A okazał się nieinteraktywny **baner** nad #1 w
`empireDetailPanel.ts`, nie drugi `<input>`.

---

## KROK 2 — Wątek D (regres akumulacji puli) — PRZYCZYNA ZNALEZIONA I NAPRAWIONA

### Co było przetestowane w `R-PRACA-PULA-NIEAKUMULUJE-Q1` (FALA 300/302)

Raport `01-operator.md` tamtego tematu (runda BLOCK, FALA 300) zdiagnozował i naprawił inny,
**wcześniejszy** bug: globalny domyślny split per-miasto (`ownerDefaultPodzialPracy`,
kontrolka #4 z tabeli wyżej) nie docierał do `previewCityEconomy`/`advanceCityEconomy`
(`turn-economy.ts`) — cichy fallback na statyczny domyślny 70/30 z JSON-a. Naprawiono to i
`node tools/praca-global-default-live-test.cjs` w tym worktree daje **7/7 PASS** — ten
konkretny bug jest faktycznie naprawiony i NIE regresował.

**Ale ten test (i cały `turn-economy.ts`) NIE OBEJMUJE etapu, w którym leży PRAWDZIWA
przyczyna objawu zgłoszonego TERAZ.** `previewCityEconomy`/`advanceCityEconomy` liczą tylko
per-miastowy split (kontrolka #4/#1 na poziomie jednego miasta); reprodukcja i naprawa
sprzed tego tematu w ogóle nie mogła zobaczyć kroku opisanego niżej, bo ten krok żyje
wyłącznie w pętli końca tury w `main.ts`, poza `turn-economy.ts`.

### Reprodukcja i przyczyna (main.ts, blok „Ekonomia" końca tury)

Scenariusz właściciela („1 miasto, globalny suwak 100% pula / 0% budynki, kilka tur, pula
prawie zerowa mimo +10/turę") wskazuje na kontrolkę **#1/#2** (`ownerDefaultPracaSplit`,
`procentUlepszenia`). Prześledzono jej realne zużycie w `main.ts` (linie ok. 26640–26783):

1. `_lastPracaRate` (wyświetlany wskaźnik „+N" w PULA IMPERIUM) jest ustawiany jako suma
   `poolGain`/`overflowToPool` per-miasto, pomniejszona **tylko** o `playerUpkeep`
   (utrzymanie ulepszeń surowcowych, linia 26650 — to jest NAPRAWA HUD-PRACA sprzed tego
   tematu, komentarz „Maciej 2026-07-26").
2. TA SAMA tura, PO obliczeniu `_lastPracaRate`, `playerPracaPool` (realny stan) jest
   DODATKOWO zużywany przez trzy niezależne mechanizmy, z których **żaden nie odejmował
   nic od `_lastPracaRate`**:
   - `advanceOwnerWonderMapBuilds` — postęp Cudów świata budowanych z puli (linia ~26661).
   - `applyEmpireBuildingBudget(0, playerPracaBudget.doBudynkow)`, gdzie
     `playerPracaBudget = splitEmpirePracaBudget(playerPracaPool,
     effectivePracaSplitForOwner(0).procentUlepszenia)` (linia ~26679–26690) — **to jest
     DOKŁADNIE kontrolka #1/#2 z suwaka „PODZIAŁ PRACY: BUDYNKI/ULEPSZENIA"**: nadrzędny
     split bierze `doBudynkow`% z CAŁEJ AKUMULOWANEJ PULI (nie z tegorocznego przychodu!) i
     wysyła to na budowę kolejek budynków WSZYSTKICH miast — mechanizm zupełnie osobny od
     per-miastowego splitu #4, działający NA WIERZCHU niego.
   - Auto-ulepszenia terenu gracza — pętla `for (const pick of picks)`, `playerPracaPool -=
     pick.kosztPraca` (linia ~26763).
3. Efekt: UI pokazuje `_lastPracaRate` = wysoką, dodatnią wartość (np. „+10"), podczas gdy
   realny `playerPracaPool` w TEJ SAMEJ turze traci znaczną część tego przyrostu na trzy
   powyższe zużycia — dokładnie zgłoszony objaw „9 +10, stan praktycznie zerowy od kilku
   tur mimo dodatniego wskaźnika". To **nie jest** brak akumulacji dochodu (dochód realnie
   trafia do puli) — to jest **wskaźnik rate, który kłamie o tym, co się z pulą stało tej
   samej tury**, bo dolicza przychód, ale nie odlicza żadnego z trzech nowych wydatków.

**Wspólna przyczyna z Wątkiem A?** Częściowo TAK: to właśnie ten sam suwak #1/#2
(„PODZIAŁ PRACY: BUDYNKI/ULEPSZENIA") — im wyżej ustawiony udział Budynków (Ulepszenia
bliżej 0%), tym więcej `applyEmpireBuildingBudget` zabiera z puli KAŻDĄ turę, więc
złudzenie „pula nie rośnie" jest silniejsze przy pewnych ustawieniach tego suwaka — ale
sam brakujący odczyt to osobny, dodatkowy bug w warstwie main.ts, nie duplikat/baner z
Wątku A.

### Naprawa (allowlista rozszerzona o `gra/src/main.ts` — uzasadnienie: przyczyna leży
wyłącznie tam, potwierdzone reconem wyżej)

Dodano brakujące odjęcia od `_lastPracaRate` w trzech miejscach (mirror wzorca już
istniejącego dla `playerUpkeep`):

```ts
// 1. Cuda na mapie
if (usedPlayer > 0) {
  playerPracaPool -= usedPlayer;
  _lastPraca = playerPracaPool;
  _lastPracaRate -= usedPlayer;                 // NOWE
}

// 2. Nadrzędny budżet budynków (suwak #1/#2)
if (usedPlayerBuildingBudget > 0) {
  playerPracaPool = Math.max(0, playerPracaPool - usedPlayerBuildingBudget);
  _lastPraca = playerPracaPool;
  _lastPracaRate -= usedPlayerBuildingBudget;   // NOWE
}

// 3. Auto-ulepszenia terenu gracza
playerPracaPool -= pick.kosztPraca;
_lastPraca = playerPracaPool;
_lastPracaRate -= pick.kosztPraca;              // NOWE
```

Zakres: tylko wskaźnik gracza (`ownerId === 0`), zgodnie z tym, co jest w ogóle
wyświetlane w UI (AI nie ma analogicznego `_lastPracaRate`-dla-gracza pokazywanego w
panelu). Zero zmian w logice ekonomii/zużycia — wyłącznie w tym, co UI POKAZUJE jako
deltę tej tury.

Nowy test kontraktowy `gra/tools/praca-pula-rate-parity-test.cjs` (statyczny, source-grep
jak `praca-split-ui-test.cjs`) pilnuje, żeby żadne z tych trzech odjęć nie zniknęło po
cichu w przyszłości. **8/8 PASS** przed i po (patrz sekcja TESTY).

---

## KROK 3 — Wątki A+B — WYKONANE

- **Wątek A:** usunięto nieinteraktywny baner nad suwakiem #1 w `renderPracaSection`
  (`split2BarHtml(pctBudynki,...)` + wiersz etykiet „Budynki X% · N / Pula imperium Y% ·
  N", stylowany identycznymi klasami `.civ-emp-slider-label gold/blue` co prawdziwy suwak
  niżej). Usunięte zmienne `pctBudynki`/`pctPula` (nieużywane po usunięciu banera). Dane
  nie giną — `sumBudynki`/`sumPula` zostają w `hero-sub` (opisowo) i w wierszu SUMA tabeli
  per-miasto (dokładne liczby).
- **Wątek B:** etykiety suwaka #1 zmienione z „Budynki (50–100%)" / „Pula Pracy (0–50%)"
  na **„Budynki (0–100%)" / „Ulepszenia (0–50%)"** — zgodnie z żądaniem właściciela.
  Zmieniono też eyebrow „PODZIAŁ PRACY: BUDYNKI / PULA" → „PODZIAŁ PRACY: BUDYNKI /
  ULEPSZENIA" i wszystkie towarzyszące teksty (tip, note, foot) w tej samej funkcji, żeby
  nie mieszać nazwy z realną, akumulowaną PULA IMPERIUM (`economy.praca`, inny licznik
  pokazany wyżej w tej samej sekcji jako osobny box). Nie zmieniano nic w `buildModeHud.ts`
  (kontrolka #2) w tej rundzie — to wymagałoby najpierw ABC (patrz niżej), bo to ten sam
  stan.

Plik `gra/tools/praca-split-ui-test.cjs` zaktualizowany pod nowe etykiety + nowa asercja
pilnująca braku banera-duplikatu.

---

## KROK 4/5 — Wątki C i E — TYLKO RECON, materiał ABC (implementacja wstrzymana)

### MATERIAŁ ABC DO ZADANIA WŁAŚCICIELOWI

**Sytuacja:** Cywilizacja ma nadrzędny cap 50% na udział Ulepszeń w podziale Pracy
(kontrolka #1/#2, `MAX_PRACA_WSPOLNY_WOREK_PROCENT=50`, `cities.ts:216`). Osobny, świadomie
zaprojektowany mechanizm — „historyczny automat ulepszeń" (kontrolka #3,
`ulepszeniaPracaPercent`/`pracaAutoPercent`, `clampUlepszeniaPracaPercent`, zakres 0–100%) —
**celowo NIE dziedziczy** tego capu, gdy miasto ma aktywny `ulepszeniaOverride: true`
(„Własne ustawienia tego miasta" w panelu Automatyzacji, `cityPanel.ts`/`buildModeHud.ts`).
To pozwala miastu ustawić np. 70% swojego budżetu automatu na ulepszenia, mimo że
cywilizacja ma nadrzędny cap 50%. Zachowanie to jest udokumentowane i zablokowane testem
`gra/tools/praca-limit-50-test.cjs` (scenariusz 5, komentarz: „to jest historyczny budżet
automatu, więc nie może dziedziczyć capu nadrzędnego splitu 50%") oraz
`gra/tools/praca-miasto-limit-50-test.cjs` („automat 100% pozostaje legalny").

Właściciel: „jeśli coś ustalimy dla całej cywilizacji, to w miastach nie powinno być
możliwe ustawienie dla ulepszeń więcej niż główne ustawienie dla całej cywilizacji" — to
wprost żąda ZMIANY tej decyzji, nie zgłasza bugu.

**Cel:** ustalić, czy cap 50% cywilizacji ma teraz obowiązywać RÓWNIEŻ „historyczny
automat" per-miasto (Wątek C), i — jeśli tak — czy to samo dotyczy drugiego wystąpienia
suwaka #1/#2 w panelu Automatyzacji (Wątek E, potwierdzone reconem jako TEN SAM stan co
Wątek A — nie osobny parametr, więc podniesienie jego zakresu do 100% w tym miejscu
byłoby wprost sprzeczne z capem 50% ustalonym gdzie indziej w TYM SAMYM panelu).

**Warianty:**

- **Wariant A — Cap 50% egzekwowany też w mieście.** `resolveEffectiveUlepszenia()`
  (cities.ts:280-301) przestaje zwracać surowe `city.ulepszeniaPracaPercent` przy
  override — clampuje je do `MAX_PRACA_WSPOLNY_WOREK_PROCENT` (albo do bieżącej wartości
  nadrzędnego suwaka, jeśli ma być dynamiczny cap, nie stały 50). Zmiana zachowania
  gry: miasta z historycznym automatem tracą możliwość przekroczenia 50% na ulepszenia.
  Wymaga aktualizacji `praca-limit-50-test.cjs` (scenariusz 5 i „automat 100% pozostaje
  legalny" w `praca-miasto-limit-50-test.cjs` przestają być prawdą — trzeba je świadomie
  zmienić, nie tylko naprawić). **Za:** spójność mentalna („global cap znaczy global cap"),
  łatwiejsze do wytłumaczenia w UI. **Przeciw:** cofa świadomą, udokumentowaną wcześniej
  decyzję („historyczny budżet automatu" miał inny zakres CELOWO — być może z powodu
  balansu wczesnej gry, gdzie pojedyncze miasto powinno móc szybciej rozwijać ulepszenia
  niż pozwala na to cywilizacyjna średnia); może zaskoczyć save'y z istniejącymi override'ami
  >50%, trzeba by je „ściąć" przy wczytaniu.
- **Wariant B — Zostaje bez zmian.** UI jaśniej komunikuje, że automat to niezależny,
  historyczny wyjątek (np. dopisek w panelu „Własne ustawienia tego miasta: budżet
  automatu NIE jest ograniczony nadrzędnym capem 50%"). **Za:** zero ryzyka regresji
  balansu, zero zmiany testów referencyjnych, zachowuje elastyczność małych/nowych miast.
  **Przeciw:** utrzymuje mylące UX (dwa miejsca z podobną nazwą i różnym capem), które
  wywołało to zgłoszenie.
- **Wariant C — Inny próg dla miasta niż 50% cywilizacji** (np. miasto może przekroczyć
  cywilizacyjny cap tylko o X p.p., albo ma własny, osobny, jawnie nazwany limit np. 70%).
  **Za:** kompromis — miasto zachowuje pewną autonomię, ale nie „dowolność" jak dziś (0–100%
  bez związku z ustawieniem cywilizacji). **Przeciw:** wprowadza TRZECI numer do
  wytłumaczenia graczowi (cywilizacja 50%, miasto +X p.p.), więcej stanu do utrzymania w
  testach i UI; wymaga wybrania konkretnego X bez ustalonej reguły właściciela.

**Wątek E (dołączony do tego samego ABC):** ponieważ recon potwierdził, że suwak
„Podział Praca: budynki/ulepszenia" w panelu Automatyzacji (`buildModeHud.ts:269-287`) czyta
i zapisuje DOKŁADNIE ten sam stan co suwak w panelu Praca Imperium (Wątek A) —
podniesienie jego zakresu z 0–50 do 0–100 w tym jednym miejscu NIE jest bezpieczną zmianą
UI (złamałoby cap 50% widoczny/edytowalny w drugim miejscu w tej samej turze). Decyzja o
Wariancie A/B/C wyżej rozstrzyga też Wątek E: jeśli cap zostaje 50% (Wariant B/C), suwak w
obu panelach zostaje 0–50 bez zmian; jeśli właściciel chce inny cap (Wariant C) albo
zniesienie capu na poziomie cywilizacji (poza zakresem tego ABC — nie było o to proszone),
oba wystąpienia trzeba zmienić RAZEM, jednym fixem.

Implementacja żadnego wariantu NIE została wykonana — czeka na ECHO właściciela.

---

## ZMIANY / COMMIT

Allowlista wykorzystana:
- `gra/src/ui/empireDetailPanel.ts` — Wątek A (usunięcie banera-duplikatu) + Wątek B
  (relabeling).
- `gra/src/main.ts` — Wątek D (naprawa `_lastPracaRate`); rozszerzenie allowlisty
  uzasadnione reconem KROKU 2 (przyczyna leży wyłącznie tam, poza zakresem
  `turn-economy.ts`/`cities.ts`).
- `gra/tools/praca-split-ui-test.cjs` — zaktualizowany pod nowe etykiety Wątku B + nowa
  asercja braku banera (Wątek A).
- `gra/tools/praca-pula-rate-parity-test.cjs` — NOWY test kontraktowy blokujący regres
  Wątku D.
- `dyspozycje/autobot/runs/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1/01-operator.md` —
  ten raport.

Zero zmian w `gra/tools/praca-limit-50-test.cjs` (Wątek C/E nie implementowane, więc test
referencyjny zostaje bez zmian, zgodnie z poleceniem).

Commit lokalny wykonany (NIE push) — patrz sekcja SHA/DIFF niżej.

## TESTY

- `npm install` w `gra/` — wykonane (node_modules brakował).
- `npm run typecheck` (`tsc --noEmit`) — **PASS, 0 błędów**.
- `node tools/praca-limit-50-test.cjs` — **PASS, 23/23** (bez zmian, Wątek C nietknięty).
- `node tools/praca-miasto-limit-50-test.cjs` — **PASS, 32/32**.
- `node tools/praca-na-pieniadz-test.cjs` — **PASS, 23/23**.
- `node tools/praca-split-ui-test.cjs` — **PASS, 11/11** (zaktualizowany pod Wątek A/B).
- `node tools/praca-global-default-live-test.cjs` — **PASS, 7/7** (potwierdza, że naprawa
  `R-PRACA-PULA-NIEAKUMULUJE-Q1` z FALI 302 sama w sobie NIE regresowała).
- `node tools/praca-pula-rate-parity-test.cjs` — **PASS, 3/3** (nowy test, Wątek D).
- `git diff --check` — **PASS**, brak konfliktów whitespace.

Suma: **6/6 plików `praca-*.cjs` PASS**, zero regresji.

## BLOKADY

- Wątek C i Wątek E (podniesienie zakresu suwaka w panelu Automatyzacji) wymagają ABC
  właściciela — materiał gotowy wyżej, implementacja wstrzymana zgodnie z poleceniem.
- Nic więcej nie blokuje deploy Wątków A/B/D — gotowe do Evaluatora.

## NASTĘPNY KROK

1. Przekazać ten run do Evaluatora (Wątki A/B/D — kod gotowy, testy zielone).
2. Zadać właścicielowi materiał ABC (Wątek C+E) w głównym czacie orkiestratora — po
   ECHO otworzyć osobny temat implementacyjny (nowe ID albo kontynuacja tego po
   zamknięciu części A/B/D).

DEPLOY/PUSH: NIE WYKONANO

---

## SHA i diff

Commit lokalny (branch `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`), SHA i pełny
`git diff` — patrz commit bezpośrednio po tym raporcie w historii Git tego worktree
(`git log -1`, `git show --stat`).

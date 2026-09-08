# R-HOTSEAT-ETAP6A-RECON-INPUT-Q1 — Evaluator runda 1

**Metoda:** świeży `grep -n`/`Read`/`sed -n` niezależnie od dokumentu Operatora, w tym
samym worktree (`/home/user/wt-hotseat-etap6a-recon`, HEAD `cf9a1e3b`). Każdy cytat kodu
i numer linii w `01-operator-runda1-analiza.md` sprawdzony osobno. Dodatkowo: przeszukane
całe zakresy handlerów DOM (`canvas.addEventListener('mousedown'/'mousemove'/'dblclick')`,
oba `window.addEventListener('keydown', …)`) pod kątem miejsc `ownerId`, niezależnie od
tabel Operatora, żeby sprawdzić kompletność (zgodnie z dyspozycją — "szukaj dodatkowych,
tak jak Evaluator Etapu 5").

## Wyniki weryfikacji — co się ZGADZA

- §0 (korekta Etap 5 niezintegrowany): **potwierdzone w pełni**, świeżo:
  `grep -rn "switchActiveHuman" gra/src/` → 0 trafień; `find gra/src -iname "*hotseat*" -o
  -iname "*hot-seat*"` → 0 plików; `git merge-base --is-ancestor db09fef1 HEAD` → exit 1
  (nie-przodek); `git branch -a --contains db09fef1` → wyłącznie
  `autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`; `grep -c "isMe(" gra/src/main.ts` → 0.
  Rejestr (`dyspozycje/REJESTR-PROSB-I-ZADAN.md:99`) potwierdza wpis WYŁĄCZNIE dla wersji
  RECON Etapu 5, brak wpisu dla implementacji — zgodne z dokumentem.
- `ME()`/`isHuman()` na `main.ts:10358-10365`, akcesory ekonomiczne `main.ts:26167+`
  (`ownerTreasury`/`ownerPracaPool` używają `isHuman(ownerId)`), `human-owners.ts`
  eksportujący `isHumanOwner/isActiveHuman/isAiOwner/nextHumanSeat/isHotSeat` — wszystko
  potwierdzone świeżym `grep`/`Read`.
- Wszystkie 40 cytowanych linii klastrów A-H (poza jednym zastrzeżeniem niżej, zarzut 2)
  sprawdzone `sed -n '<linia>p' gra/src/main.ts` — **każdy cytat kodu zgadza się dokładnie**
  co do treści i numeru linii, włącznie z `game/army-cycle.ts:55`.
- `endActiveHumanTurn` (32999), `advanceSeat` (33174), `runWorldEndTurn` (28643),
  `renderLoop` (33327), `playerIsAtWarWith` (9825, hardkoduje `0` dwukrotnie) — potwierdzone
  definicje i literały dokładnie jak w dokumencie.
- Wiązanie `onEndTurn: () => advanceSeat()` / `endTurn: () => advanceSeat()` potwierdzone
  (linie 21042/21630 zgodnie z dokumentem).
- Suma 273 wystąpień `ownerId\s*(===|!==)\s*0` w całym `main.ts` (świeży grep) —
  potwierdzona, blisko `~272` z dispatchu, co wspiera wniosek Operatora o pochodzeniu tej
  liczby (§2 pkt 4).
- Klaster wykluczeń (tooltip/panel, build-mode, `afterPlayerUnitSpawned`,
  `playerIsAtWarWith`) — sprawdzony liniowo, każda z 11 wykluczonych linii ma treść zgodną
  z opisanym powodem wykluczenia (rendering/build-mode/spawn-trigger/dyplomacja).
- Arytmetyka klastrów A-H: 3+16+2+3+1+10+1+5 = 41 — zgadza się.
- Rozbicie „13 z 41 to `!==0`" — przeliczone ręcznie z tabeli (A:2, B:2, C:2, D:1, E:1,
  G:1, H:4 = 13) — **zgadza się**, choć dokument nie pokazuje samego wyliczenia wprost.
- `gra/tools/scout-explore-deselect-cycle-test.cjs` istnieje (potwierdzone `ls`) — cytowany
  wzorzec harnessu jest prawdziwy.
- Commit `cf9a1e3b`: pojedynczy plik, allowlist-only, working tree czysty — potwierdzone
  `git show --stat` i `git status`.
- Cytaty z Etapu 1 (linie 2069-2070, 7564, 10867, 22183, 22262, 29308, 29447, 30481-30482)
  — wszystkie faktycznie zawierają `isAiOwner(humanSeats, …)` jak opisano.

## ZARZUTY

1. **[Kompletność — brakujące miejsce kategorii „input"]** Dokument nie znajduje
   `main.ts:33273` — literał `sel.ownerId === 0` wewnątrz DRUGIEGO handlera
   `window.addEventListener('keydown', …)` (rejestrowanego `main.ts:33185`, poza handlerem
   z linii 23787, którego dokument w ogóle nie analizuje osobno). Kontekst (świeży `sed`):
   klawisz **B** ("Found a city on the last hovered/clicked hex") — gdy brak `lastBHex`/
   `hoverKey`, kod pada na `selectedId`: `const sel = units.find(x => x.id === selectedId);
   if (sel && sel.ownerId === 0) { foundQ = sel.q; foundR = sel.r; }`. To jest dokładnie
   kategoria „zaznaczenie" (sprawdzenie właściciela zaznaczonej jednostki przed użyciem jej
   pozycji) — analogiczne semantycznie do A1/A2/G1, wywołane inputem klawiatury zamiast
   myszy. Nie jest wymienione ani w tabelach A-H, ani w tabeli wykluczeń §2. Ten sam drugi
   handler `keydown` (33185-36213) zawiera też wpięcie **Spacji** →
   `cycleToAdjacentPlayerUnit(selectedId, 1)` (linia 33215) — czyli jest to FAKTYCZNY punkt
   wejścia klawiszowego cyklu jednostek, o którym dispatch mówił wprost ("cykl jednostek —
   klawisz Tab/Space"), a którego dokument nie analizuje wcale (ograniczając „cykl" tylko do
   `army-cycle.ts:55`, co jest częścią mechanizmu, ale nie jego punktem wejścia
   klawiszowym). Konsekwencja: liczba „41 rdzeniowych" jest zaniżona o co najmniej 1
   (linia 33273), a opis mechanizmu cyklu w §1/Klaster A jest niepełny (brak wzmianki o
   `cycleToAdjacentPlayerUnit`/wiązaniu Spacji, mimo że dispatch explicite je wymienia).
   Sprawdziłem systematycznie oba handlery `keydown` (23787-23825 i 33185-36213) oraz
   pełne ciała `mousedown`/`mousemove`/`dblclick` — poza tym jednym miejscem nic więcej nie
   znalazłem pominiętego.

2. **[Błąd arytmetyczny / nieścisły opis w §4]** Zdanie: *„To jest dokładnie klaster D+F z
   §1 (10 z 13 pozycji tego klastra fizycznie leży wewnątrz ciała `endActiveHumanTurn`,
   patrz F1-F5 + D1-D3)."* — **F1-F5 to 5 pozycji, D1-D3 to 3 pozycje, razem 8, nie 10.**
   Dodatkowo samo sformułowanie „fizycznie leży wewnątrz ciała `endActiveHumanTurn`" jest
   nieprecyzyjne dla D1-D3: `executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`
   (definicje D1-D3, `main.ts:23275-23332`) to ODDZIELNE funkcje zdefiniowane setki linii
   PRZED `endActiveHumanTurn` (32999) — są WOŁANE z jej wnętrza (przez
   `runPlannedMarchesAtPlayerEndTurn()` na linii 33127, potwierdzone `grep`), nie leżą w niej
   leksykalnie. Tylko F1-F5 (33055-33111) leżą faktycznie w leksykalnym ciele
   `endActiveHumanTurn` (potwierdzone `sed -n '32999,33130p'` — линии 33055-33111 są
   wewnątrz `void (async () => { … })()` tej funkcji). F6-F10 (33405-33466) leżą w
   `renderLoop` (33327+), zgodnie zresztą z własną tabelą Operatora w §1 (kolumna
   "Funkcja" poprawnie odróżnia `endActiveHumanTurn` od `renderLoop` dla F1-F5 vs F6-F10) —
   więc błąd jest wyłącznie w zdaniu podsumowującym §4, nie w tabeli źródłowej. Poprawny
   opis powinien brzmieć: „8 z 13 (F1-F5) leży fizycznie w ciele `endActiveHumanTurn`; D1-D3
   są wołane z jej wnętrza, ale zdefiniowane osobno; F6-F10 leżą w `renderLoop`, wołanym
   z innego miejsca (koniec animacji ruchu, nie koniec tury)". Nie unieważnia to głównego
   wniosku (Etap 4 przygotował hak `humanOwnerId`, nieużyty), ale liczba i lokalizacja w
   zdaniu podsumowującym jest błędna i myląca dla rundy implementacji (ktoś szukający
   "10 pozycji w ciele endActiveHumanTurn" znajdzie tylko 8, a 2 nie tam gdzie zdanie
   sugeruje).

3. **[Drobna, niekrytyczna nieścisłość — brak wzmianki]** `disbandPlayerUnit`
   (`main.ts:6010`, guard `u.ownerId !== 0` na linii 6014) jest wywoływana z HUD
   (`main.ts:20464`, wewnątrz callbacku analogicznego do `canMerge`/`canSplit` z klastra H)
   — strukturalnie ten sam wzorzec co Klaster H ("akcja HUD na zaznaczonej jednostce
   gracza"), ale nie jest ani policzona w klastrze H, ani wymieniona w tabeli wykluczeń §2
   z uzasadnieniem. Różni się od klastra H tylko tym, że "rozwiązanie" nie jest jednym z
   sześciu czasowników z definicji kategorii (a) w dispatchu (klik/zaznaczenie/ruch/atak/
   marsz/cykl) — więc wykluczenie jest OBRONIALNE tą samą logiką co wykluczenie
   build-mode/tooltip, ale dokument nigdzie tego nie mówi wprost, więc czytelnik nie może
   odróżnić "sprawdzone i świadomie wykluczone" od "przeoczone". Rekomendacja: dodać jedną
   linię do tabeli wykluczeń w rundzie poprawki, analogicznie do pozostałych pięciu
   pozycji — nie wymaga nowej rundy tylko z tego powodu, ale powinno zostać domknięte przy
   okazji poprawki zarzutu 1.

Zarzuty 1 i 2 są materialne (wpływają na kompletność listy i poprawność opisu nakładania z
Etapem 4, które implementacja Etapu 6a będzie brać dosłownie) — wymagają poprawki w
rundzie 2 tego samego tematu. Zarzut 3 jest kosmetyczny i może zostać domknięty przy okazji.

Plan dowodu no-op (Chromium, nie headless) i rozliczenie z liczbą "~25" (przyczyny
rozjazdu w §2) pozostają poprawne merytorycznie niezależnie od zarzutów 1-3 — wymagają
tylko aktualizacji liczby "41"→"42" (lub więcej, jeśli runda 2 znajdzie kolejne miejsca po
poprawce zarzutu 1) i korekty zdania w §4.

---

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6A-RECON-INPUT-Q1
GOAL: Recon-only (zero zmian kodu) dla podetapu 6a ("input", §C planu hot-seat) — inwentaryzacja świeżym grepem, rozliczenie liczby ~25, propozycje podmian, sprawdzenie nakładania z Etapem 4/5, plan dowodu no-op.
ZMIANY/COMMIT: Brak nowych zmian tej rundy (Evaluator nie modyfikuje `gra/`). Ten dokument (`02-evaluator-runda1.md`) zacommitowany do allowlisty runu.
TESTY: Weryfikacja dowodowa świeżym `grep -n`/`sed -n`/`git merge-base --is-ancestor`/`git show --stat` — każdy cytat kodu i numer linii z dokumentu Operatora sprawdzony niezależnie; dodatkowo przeszukane całe ciała `mousedown`/`mousemove`/`dblclick`/oba `keydown` pod kątem pominiętych miejsc `ownerId`.
BLOKADY: 2 zarzuty materialne (niekompletność listy — brakujące `main.ts:33273` + brak analizy wiązania Spacji/`cycleToAdjacentPlayerUnit`; błąd arytmetyczny "10 z 13" w §4 powinno być "8 z 13" z nieprecyzyjnym opisem D1-D3 jako "wewnątrz ciała") + 1 zarzut kosmetyczny (brak jawnego wykluczenia `disbandPlayerUnit`). Patrz ZARZUTY wyżej.
RUNDY: 1/5 (Evaluator; Operator wraca na rundę 2 tego samego tematu/gałęzi)
NASTĘPNY KROK: Operator, runda 2, TEN SAM temat/gałąź: (a) dodać `main.ts:33273` do inwentaryzacji (klaster A lub nowy, z podmianą `isMe`), (b) opisać wiązanie Spacji (`cycleToAdjacentPlayerUnit`, main.ts:33215) jako właściwy punkt wejścia klawiszowy cyklu obok `army-cycle.ts:55`, (c) poprawić zdanie w §4 na "8 z 13 (F1-F5)" z rozróżnieniem "fizycznie wewnątrz" (F1-F5) vs "wołane z wnętrza" (D1-D3), (d) opcjonalnie dopisać `disbandPlayerUnit` do tabeli wykluczeń, (e) zaktualizować sumę "41"→"42" (lub więcej) we wszystkich miejscach dokumentu (w tym nagłówku podsumowania i rozliczeniu z "~25").
ZARZUTY: 1) Brakujące miejsce kategorii input: `main.ts:33273` (klawisz B, sprawdzenie `sel.ownerId===0`) + brak analizy wiązania Spacji (`main.ts:33215`, `cycleToAdjacentPlayerUnit`) jako punktu wejścia cyklu — obie w drugim handlerze `keydown` (main.ts:33185+), którego dokument w ogóle nie analizuje. 2) Błąd arytmetyczny w §4: "10 z 13 pozycji … F1-F5 + D1-D3" — F1-F5(5)+D1-D3(3)=8, nie 10; dodatkowo D1-D3 nie leżą "fizycznie wewnątrz ciała" `endActiveHumanTurn` (są oddzielnymi funkcjami wołanymi z jej wnętrza), tylko F1-F5 leżą tam faktycznie. 3) (kosmetyczny) `disbandPlayerUnit` (main.ts:6010/6014/20464, wzorzec identyczny do klastra H) nie jest ani policzony, ani jawnie wykluczony z uzasadnieniem.
DEPLOY/PUSH: NIE WYKONANO

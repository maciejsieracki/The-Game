# 02-evaluator — P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1

STATUS: **PASS**
TEMAT: P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1
GOAL: Karty informacyjne „Koniec tury” (`SidePanelEvent`, `kind:'info'`) o identycznej treści
(title + subtitle po stripie HTML) w obrębie jednej tury łączą się w JEDNĄ kartę z widoczną
liczbą wystąpień, zamiast zaśmiecać panel powtórzeniami. Wpisy `kind:'diplo'` zostają 1:1,
bez scalania — nawet identyczne tekstowo z innymi wpisami dyplomatycznymi.

## Krok 0 — stale worktree base

Mój worktree (`worktree-agent-a72b4499f368322c8`) był na **zupełnie innym branchu**
(`worktree-agent-a72b4499f368322c8`, historia niezwiązana z tym tematem — bez katalogu
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/`, bez `eot-event-defer.ts` w
ogóle w tej wersji drzewa dotykającej tego tematu). `cd`/`git -C` do żywego drzewa
`/home/user/The-Game` jest twardo zablokowane przez izolację worktree (błąd narzędzia).
Zweryfikowałem `git merge-base --is-ancestor 47cdca1 33f79f7` → **YES** (mój ówczesny HEAD,
`47cdca1`, był przodkiem `33f79f7`) — bezpieczny fast-forward `git merge --ff-only 33f79f7`
w OBRĘBIE mojego własnego worktree (bez dotykania żywego drzewa, obiekty gita są
współdzielone między worktree tego samego repo). Po fast-forwardzie: `HEAD = 33f79f7`,
zgodnie z wymogiem KROK 0 z dyspozycji Evaluatora. Zero zmian w żywym drzewie
`/home/user/The-Game`.

## ZMIANY/COMMIT

**Brak zmian kodu** — weryfikacja adwersaryjna nie znalazła defektu wymagającego poprawki.
Commit finalny (HEAD mojego worktree, ten sam co przed weryfikacją, bo nic nie zmieniłem
poza tym raportem):

Po dodaniu tego raportu commituję WYŁĄCZNIE `02-evaluator.md` (allowlista:
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/`). SHA podany na końcu raportu.

Pliki zweryfikowane (bez modyfikacji): `gra/src/game/eot-event-defer.ts`,
`gra/tools/eot-event-defer-test.cjs`.

## WERYFIKACJA ADWERSARYJNA — punkt po punkcie

### 1. diplo vs info — scalanie WYŁĄCZNIE info, potwierdzone własnym testem ad-hoc

Napisałem i uruchomiłem tymczasowy plik `gra/tools/.eval-adhoc-mixed-test.cjs` (usunięty po
uruchomieniu, nie commitowany) z listą **2 identyczne diplo + 2 identyczne info W TEJ SAMEJ
liście jednocześnie**:
```
[diplo "CywA handluje z CywB: 10 Złota", info "Wyrąb: +25 Drewna...", diplo (dup), info (dup)]
```
Wynik: **3 karty** — 2 osobne karty `diplo` (ZERO scalenia, zero dopisku licznika) + 1
scalona karta `info` z dopiskiem „(2 wystąpienia)”, na pozycji PIERWSZEGO wystąpienia info
(pozycja 1, między diplo#1 na pozycji 0 i diplo#2 na pozycji 2). id-y: `eot-hint-99-0/1/2`,
bez kolizji. 10/10 asercji PASS. Potwierdza, że logika grupowania (`if (d.kind === 'info')`
jako jedyna brama do `infoGroupIndexByKey`) faktycznie izoluje obie gałęzie równocześnie w
jednym wywołaniu, nie tylko w osobnych testach (test 1d Operatora sprawdzał diplo osobno od
info — mój test sprawdza je RAZEM, co jest silniejszym dowodem braku przecieku między
gałęziami).

### 2. Klucz scalania (`title + ' ' + subtitle`) — ryzyko fałszywego pozytywu

Przejrzałem WSZYSTKIE ~250 wywołań `showHintMessage` w `main.ts` (wszystkie przechodzą przez
tę samą funkcję opakowującą, więc wszystkie są kandydatami do kolejki EOT — `showHintMessage`
linia ~11978 sprawdza `shouldDeferEotEvents(endTurnInProgress)` bezwarunkowo dla każdego
wywołania).

- Kanoniczny przypadek z 00-dispatch.md (`main.ts` ~25634, pętla po `hexClearingStates`,
  „Wyrąb: +N Drewna (pozostało M tury)”) **nie zawiera żadnego identyfikatora hexa/miasta** —
  to ŚWIADOMY, zgłoszony przez właściciela przypadek, w którym dwa różne heksy dają
  nierozróżnialny dla gracza komunikat i POWINNY się scalić (GOAL wprost to opisuje).
- Komunikaty niosące identyfikator (`city.name`, np. linie 12381/12433/12452/12472/12530
  oblężenia, kapitulacje) różnicują się nazwą miasta — kolizja wymagałaby DWÓCH RÓŻNYCH
  miast o IDENTYCZNEJ nazwie w tej samej turze. Realne, ale: (a) to nie jest ryzyko
  wprowadzone przez tę zmianę — nazwy miast już dziś mogą kolidować niezależnie od dedupu;
  (b) 00-dispatch.md świadomie ograniczył klucz scalania do dokładnego dopasowania tekstu i
  nie wymagał dodatkowego identyfikatora poza tekstem — rozszerzanie klucza (np. o hexKey/
  cityId) byłoby poza zakresem NARROW z dispatcha i wymagałoby zmiany podpisu
  `DeferredEotHint` (dziś tylko `{msg, durationMs}`, bez żadnego id źródła) — czyli
  realnie NIEMOŻLIWE do zrobienia w obecnym zakresie bez zmiany kontraktu wywołań
  `showHintMessage`, co dispatch wyraźnie zabronił („main.ts... punkty wywołania
  showHintMessage zostają bez zmian”).
- Wniosek: ryzyko jest **teoretyczne, nie praktyczne** — analogiczne do ryzyka dla diplo
  (00-dispatch już świadomie zaakceptował identyczny kompromis: „brak dowodu, że to w ogóle
  występuje w praktyce”). Nie blokuję na tej podstawie — zgodne z jawną, udokumentowaną
  decyzją zakresu w dispatchu, nie z przeoczeniem Operatora.

### 3. Kolizje `id` (`eot-hint-${turn}-${i}` po scaleniu)

Grep po `eot-hint-` w całym `gra/`: wszystkie miejsca poza `eot-event-defer.ts` używają
WYŁĄCZNIE dopasowania prefiksu (`id.startsWith('eot-hint-')` w
`dismissEotOrEraWarLogEntry`, `.indexOf('eot-hint-') === 0` w
`sidepanel-events-toolbar-test.cjs`) albo dopasowania DOKŁADNEGO `id` (`warEventLog.findIndex(e
=> e.id === id)`) — żadne miejsce nie zakłada konkretnej liczby kart ani numeracji sprzed
scalenia. `mergeDeferredEotSideEvents` w ogóle nie odwołuje się do wzorca `id`, tylko
przenosi gotowe obiekty `SidePanelEvent`. `important-event-cards-test.cjs` sprawdza literalny
string szablonu `` `eot-hint-${turn}-${i}` `` w źródle (nie liczbę wystąpień) — PASS bez
zmian. Brak kolizji.

### 4. Testy z 00-dispatch.md — WSZYSTKIE uruchomione, liczby potwierdzone

`npm install` w `gra/` (worktree nie miał `node_modules`), Node v22 (środowisko sesji).

| Test | Wynik | Zgodność z raportem Operatora |
|---|---|---|
| `eot-event-defer-test.cjs` | **19/19 PASS** | zgodne |
| `era-change-toast-defer-test.cjs` | 7 passed, 0 failed + 8/8 mutacji złapanych + 4/4 sond bezpiecznych | zgodne |
| `dyplo-karta-duplikat-komunikat-test.cjs` | 15 passed, 0 failed | zgodne |
| `eot-diplomacy-header-test.cjs` | 18/18 PASS | zgodne |
| `sidepanel-events-toolbar-test.cjs` | 19 pass, 0 fail | zgodne |
| `npm run typecheck` (`tsc --noEmit`) | brak błędów, exit 0 | zgodne |
| (dodatkowo) `important-event-cards-test.cjs` | 10 pass, 0 fail | (nie wymagany w dispatchu, uruchomiony jako dowód braku regresji dot. `id: \`eot-hint-\${turn}-\${i}\`,`) |

Zero rozbieżności między liczbami Operatora a moim niezależnym uruchomieniem.

### 5. Dopisek licznika w `subtitle` — bezpieczeństwo dla UI

Grep `\.subtitle` w całym `gra/src`: jedyne miejsce renderujące `SidePanelEvent.subtitle` to
`sidePanelHud.ts` (linie 610, 636) — wstawia surowy string do `<div class="sp-sub">` bez
żadnego substring/regex/przycinania. Pozostałe trafienia `.subtitle` w kodzie
(`battleScene.ts`, `postBattleSummary.ts`, `unitPanelHud.ts`) dotyczą INNYCH typów danych
(popup dosadzenia jednostki, podsumowanie bitwy, panel jednostki) — zero związku z
`SidePanelEvent`. Dopisek „(N wystąpień/wystąpienia/wystąpienie)” na końcu `subtitle` jest
bezpieczny.

### 6. `merged[existingIdx]!.count++` — poprawność indeksu

`infoGroupIndexByKey` (Map) jest zapisywana WYŁĄCZNIE wewnątrz gałęzi `if (d.kind ===
'info')`, więc `existingIdx` zawsze wskazuje pozycję w `merged`, pod którą wcześniej trafił
wpis `kind:'info'` — nigdy `diplo` (diplo w ogóle nie dotyka tej mapy — osobna gałąź kodu,
`kind` per wpis jest ustalane raz w pierwszym `.map()` i nigdy potem nie mutowane). Typ
`EotEventDraft.kind: 'info' | 'diplo'` jest przypisywany raz i tylko odczytywany później —
brak ścieżki, którą `kind` mógłby się „zmienić w locie”. Bez błędu.

## BLOKADY

Brak.

## NASTĘPNY KROK

Final Control (Sonnet 5, effort High, osobny subagent) → integracja orkiestratora na
branchu `autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1`. Bez integracji do `main`, bez push, do
czasu wyraźnej autoryzacji właściciela.

## DEPLOY/PUSH: NIE WYKONANO

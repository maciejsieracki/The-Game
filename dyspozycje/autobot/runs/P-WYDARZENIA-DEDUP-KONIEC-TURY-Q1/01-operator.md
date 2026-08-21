# 01-operator — P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1

STATUS: PASS
TEMAT: P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1
GOAL: Karty informacyjne „Koniec tury” (`SidePanelEvent`, `kind:'info'`) o identycznej treści
(title + subtitle po stripie HTML) w obrębie jednej tury łączą się w JEDNĄ kartę z widoczną
liczbą wystąpień, zamiast zaśmiecać panel powtórzeniami. Wpisy `kind:'diplo'` zostają 1:1,
bez scalania — nawet identyczne tekstowo z innymi wpisami dyplomatycznymi.

## Krok 0 — stale worktree base (WYKRYTE I ROZWIĄZANE)

`git merge-base --is-ancestor 69ea42f HEAD` → **NO**. Worktree był o 3 commity za branchem
`autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1` (`87b44cd..69ea42f`, wszystkie 3 wyłącznie
`docs/`/`dyspozycje/` — zero zmian w `gra/`, potwierdzone `git show --stat` dla każdego).
Katalog `dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/` w ogóle nie istniał w
worktree (brakował `00-dispatch.md`). Zweryfikowano bezpośrednim `diff` (nie git — worktree
izolacja blokuje `cd` do żywego drzewa), że oba pliki produkcyjne z allowlisty
(`gra/src/game/eot-event-defer.ts`, `gra/tools/eot-event-defer-test.cjs`) są BAJT W BAJT
identyczne między stale worktree a żywym drzewem `/home/user/The-Game` (branch
`autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1` tam checked out) — bezpieczne kontynuowanie
edycji w worktree. Skopiowano `00-dispatch.md` z żywego drzewa do worktree (jedyny brakujący
plik, czysto informacyjny, nie wpływa na kod).

## ZMIANY/COMMIT

Commit lokalny (NIE wypchnięty): **8de84ff886926f8f4c6f9d4ca43f24f45c6f0eb**
(pełny SHA, worktree `worktree-agent-a0db735e2fd8c12b9`, worktree path:
`/home/user/The-Game/.claude/worktrees/agent-a0db735e2fd8c12b9`)

Pliki (zgodnie z allowlistą, nic poza tym):
- `gra/src/game/eot-event-defer.ts` — zmiana produkcyjna: scalanie w `deferredHintsToSidePanelEvents()`.
- `gra/tools/eot-event-defer-test.cjs` — rozszerzenie o asercje 1a-1e z dispatcha.
- `dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/` — `00-dispatch.md` (skopiowany
  z żywego drzewa, patrz Krok 0) + ten raport.

### Implementacja

`deferredHintsToSidePanelEvents()` rozbita na dwa etapy:
1. `hints.map(...)` → lista `EotEventDraft` (icon/title/subtitle/kind/origin) — DOKŁADNIE ta
   sama logika rozróżniania dyplomacja/info co przed zmianą (bez modyfikacji), tylko bez
   przydzielania `id` na tym etapie.
2. Nowa pętla scalania: `Map<string, number>` (`infoGroupIndexByKey`, klucz = `title + ' ' +
   subtitle` po stripie HTML) pamięta indeks w wynikowej tablicy `merged`, w którym wylądowała
   grupa PIERWSZEGO wystąpienia dla `kind:'info'`. Kolejne identyczne wpisy `info` tylko
   inkrementują `count` istniejącej pozycji — NIE tworzą nowego wpisu, NIE przesuwają grupy
   (kolejność = pozycja pierwszego wystąpienia, zgodnie z GOAL). Wpisy `kind:'diplo'` zawsze
   trafiają jako nowa, osobna pozycja (`count` zawsze 1) — pominięte przez logikę grupowania
   (branch `if (d.kind === 'info')`), więc 1:1 jak przed zmianą, nawet gdy tekstowo identyczne
   z innym wpisem dyplomatycznym.
3. Finalny `.map((d, i) => ...)` przydziela `id: eot-hint-${turn}-${i}` z `i` = indeks W
   TABLICY PO SCALENIU (bez dziur/kolizji) oraz dopisuje licznik do `subtitle` WYŁĄCZNIE gdy
   `count > 1`: `` `${subtitle} (${count} ${pluralPl(count,'wystąpienie','wystąpienia','wystąpień')})` ``.

### Odmiana polska liczby mnogiej — decyzja o duplikacji

W kodzie istnieją dwa warianty `pluralPl`: `sidePanelHud.ts` (2-formowy: one/many — za mało
dla poprawnej odmiany „wystąpienie/wystąpienia/wystąpień") oraz `techDiscoveryNotice.ts`
(3-formowy: 1 / 2-4 (few) / 5+ z wyjątkiem 12-14 (many) — poprawny wzorzec). Zdecydowałem o
**lokalnej duplikacji** 3-formowego wzorca z `techDiscoveryNotice.ts` zamiast importu:
`eot-event-defer.ts` to czysty moduł transformacji danych, `techDiscoveryNotice.ts` to moduł
UI popupu odkryć technologii — import stworzyłby przypadkowe sprzężenie dwóch niezwiązanych
modułów dla 6 linii bezstanowej logiki. Duplikacja krótkiej czystej funkcji jest tańsza niż
nowa zależność międzymodułowa. Uzasadnienie udokumentowane też w komentarzu w kodzie.

### Format licznika wystąpień

`(3 wystąpienia)` dopisane do `subtitle` (nie samo „×4” — jednoznaczne, mówi wprost czego
dotyczy liczba). Przykład z życia (zgłoszenie właściciela): „Wyrąb: +25 Drewna (pozostało 0
tury) (3 wystąpienia)”.

### Incydent po drodze: literalne `\uXXXX` w komentarzach po Edit

Podczas jednej z edycji narzędzie `Edit` zapisało kilka linii komentarzy oraz JEDEN string
literal (argumenty `pluralPl(...)` w linii z `subtitle`) jako DOSŁOWNY tekst `ą` zamiast
prawdziwego znaku UTF-8 (potwierdzone `python3` odczytem surowych bajtów — plik NIE był
uszkodzony jako całość, tylko te konkretne linie). W stringu TS/JS `\uXXXX` jest poprawną
składnią escape'a i zadziałałoby identycznie w runtime, ale było niespójne stylistycznie z
resztą pliku (reszta używa prawdziwych znaków UTF-8) i w komentarzach (`//`) `\uXXXX` NIE jest
interpretowane — zostałoby dosłownym, nieczytelnym tekstem. Naprawione punktowym skryptem
Python (`re.sub` dekodujący `\uXXXX` → prawdziwy znak) na DOKŁADNIE tych 9 linii (174-179,
195-196, 202), bez dotykania preegzystującego `icon: 'ℹ️'` (ta sama notacja była już
w oryginalnym pliku, celowo zostawiona bez zmian). Zweryfikowane `grep` — zero pozostałych
literalnych `\uXXXX` po naprawie, plik czysty UTF-8 poza tym jednym, oryginalnym miejscem.

## TESTY (dokładne wyniki, liczby przed/po)

Wszystkie z katalogu `gra/` (Node v22.22.2). `npm install` uruchomiony jednorazowo — worktree
nie miał `node_modules` (żywe drzewo też nie, wygląda na standardowy stan przed pracą).

| Test | PRZED (baseline, stary kod) | PO (nowy kod + rozszerzony test) |
|---|---|---|
| `eot-event-defer-test.cjs` | 5/5 PASS | **19/19 PASS** (dodano 1a-1e: 14 nowych asercji) |
| `era-change-toast-defer-test.cjs` | — (niezależny od zmiany) | OK — 7 passed / 0 failed + 8/8 mutacji złapanych + 4/4 sond bezpiecznych |
| `dyplo-karta-duplikat-komunikat-test.cjs` | — | 15 passed, 0 failed |
| `eot-diplomacy-header-test.cjs` | — | 18/18 PASS |
| `sidepanel-events-toolbar-test.cjs` | — | 19 pass, 0 fail |
| `npm run typecheck` (`tsc --noEmit`) | — | brak błędów (czysty exit, zero output poza nagłówkiem npm) |

Zero regresji — wszystkie testy zależne od modułu przechodzą bez zmian w liczbach PASS
względem stanu przed zmianą (uruchomione też PRZED implementacją zmiany dla `era-change`,
`dyplo-karta`, `eot-diplomacy-header`, `sidepanel-events-toolbar` — identyczne wyniki
PASS/PASS, patrz transkrypt sesji).

### Pokrycie kryteriów końca (00-dispatch.md §Kryteria końca pkt 1)

- **1a** (3 identyczne hinty → 1 karta z licznikiem): PASS — `"Wyrąb: +25 Drewna (pozostało 0
  tury) (3 wystąpienia)"`.
- **1b** (2 różne hinty → 2 osobne karty, bez zmian): PASS.
- **1c** (kolejność = pozycja pierwszego wystąpienia): PASS — hinty `A,B,A,C` → wynik
  `["A (2 wystąpienia)","B","C"]`, grupa A NIE przesunięta na koniec.
- **1d** (wpisy diplo nigdy nie scalane, nawet identyczne): PASS — 2 pary identycznych wpisów
  diplo → 4 osobne karty, zero dopisków licznika.
- **1e** (id bez kolizji, format `eot-hint-${turn}-${i}` z `i` po scaleniu): PASS —
  `["eot-hint-20-0","eot-hint-20-1","eot-hint-20-2"]` dla 4 hintów z 1 duplikatem.

## BLOKADY

Brak.

## NASTĘPNY KROK

Evaluator (Sonnet 5, effort High) → Final Control (Sonnet 5, effort High, osobny subagent) →
integracja orkiestratora na branchu `autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1`. Bez integracji
do `main`, bez push, do czasu wyraźnej autoryzacji właściciela.

## DEPLOY/PUSH: NIE WYKONANO

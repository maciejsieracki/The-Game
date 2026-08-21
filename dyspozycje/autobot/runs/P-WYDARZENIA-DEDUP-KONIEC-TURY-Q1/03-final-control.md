# 03-final-control — P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1

STATUS: **READY_FOR_DEPLOY** (z perspektywy Final Control — gotowe do integracji
przez orkiestratora; sama integracja i `READY_FOR_DEPLOY` jako etykieta procesu
pozostają w rękach orkiestratora, nie tego etapu)
TEMAT: P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1
GOAL: Karty informacyjne „Koniec tury” (`SidePanelEvent`, `kind:'info'`) o identycznej
treści (`title` + `subtitle` po stripie HTML) w obrębie jednej tury łączą się w JEDNĄ
kartę z widocznym licznikiem wystąpień (z poprawną polską odmianą liczby mnogiej),
zamiast zaśmiecać panel powtórzeniami. Wpisy `kind:'diplo'` zostają 1:1, bez scalania —
nawet identyczne tekstowo z innymi wpisami dyplomatycznymi. Kolejność wynikowej listy =
pozycja pierwszego wystąpienia grupy. `id` po scaleniu = `eot-hint-${turn}-${i}` z `i`
indeksem PO scaleniu.

## KROK 0 — stale worktree base

Mój worktree (`worktree-agent-a0fb5c084cf29a901`) miał HEAD `47cdca1`, na branchu
niezwiązanym z tematem (`worktree-agent-a0fb5c084cf29a901`, brak katalogu
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/`, brak zmian w
`eot-event-defer.ts`). Zweryfikowano:

- `git merge-base --is-ancestor 38b8956 HEAD` → **NO** (38b8956 nie jest przodkiem mojego HEAD)
- `git merge-base --is-ancestor HEAD 38b8956` → **YES** (mój HEAD, `47cdca1`, JEST przodkiem `38b8956`)

Zgodnie z dyspozycją: bezpieczny `git merge --ff-only 38b8956` (fast-forward, obiekty
gita współdzielone między worktree tego samego repo, zero dotknięcia żywego drzewa
`/home/user/The-Game`). Wynik: `Fast-forward 47cdca1..38b8956`, 10 plików zmienionych
(dokumentacja procesu + katalog runu tematu + oba pliki produkcyjne z allowlisty).
Po merge: `git status` czysty, HEAD = `38b8956` (commit Evaluatora „PASS, weryfikacja
adwersaryjna”), zgodnie z wymogiem KROK 0 z dyspozycji.

## ZMIANY/COMMIT

Commit bazowy po fast-forwardzie (przed moim raportem): `38b8956b921217a5405e2ce9b1a39563eef29536`.

**Zgodność allowlisty (00-dispatch.md §Allowlista) — zweryfikowana samodzielnie:**

```
git diff 69ea42f HEAD --stat
```

```
 .../01-operator.md                                 | 126 +++++++++++++++++++
 .../02-evaluator.md                                | 139 +++++++++++++++++++++
 gra/src/game/eot-event-defer.ts                    |  90 ++++++++++++-
 gra/tools/eot-event-defer-test.cjs                 |  75 +++++++++++
 4 files changed, 427 insertions(+), 3 deletions(-)
```

4 pliki, dokładnie zgodne z allowlistą 1:1: jedna zmiana produkcyjna
(`gra/src/game/eot-event-defer.ts`), rozszerzenie testu
(`gra/tools/eot-event-defer-test.cjs`), oraz artefakty etapów w
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/` (`01-operator.md`,
`02-evaluator.md` — `00-dispatch.md` już istniał na branchu przed dispatchem-do-mnie,
policzony osobno w historii). Zero dotknięcia `main.ts`, `sidePanelHud.ts`, `tokens.css`
ani jakiegokolwiek innego pliku `gra/`. Zero zmian poza allowlistą.

Po dodaniu tego raportu commituję WYŁĄCZNIE
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/03-final-control.md` —
zgodnie z allowlistą i rolą Final Control (kontrola, nie integracja). SHA finalny
podany na końcu tego raportu.

## WERYFIKACJA KODU — świeże oko, niezależnie od raportów Operatora/Evaluatora

Przeczytany w całości `gra/src/game/eot-event-defer.ts` (finalna wersja na HEAD) oraz
`gra/tools/eot-event-defer-test.cjs`.

1. **Scalanie WYŁĄCZNIE `kind:'info'`**: pętla scalania (`for (const d of drafts)`)
   zapisuje do `infoGroupIndexByKey` i sprawdza duplikaty TYLKO wewnątrz
   `if (d.kind === 'info')`; gałąź `diplo` zawsze trafia jako nowa pozycja
   (`merged.push({ ...d, count: 1 })` poza warunkiem) — potwierdzone czytaniem kodu,
   zgodne z GOAL („dyplomacja poza zakresem”).
2. **Klucz scalania = `title + ' ' + subtitle` PO stripie HTML**: `subtitle` jest już
   wynikiem `h.msg.replace(/<[^>]+>/g, '')` z wcześniejszego `.map()`, klucz budowany
   z tej już-oczyszczonej wartości — zgodne z GOAL.
3. **Kolejność = pozycja pierwszego wystąpienia**: `infoGroupIndexByKey.set(key,
   merged.length)` zapisuje pozycję TYLKO przy pierwszym wystąpieniu (wewnątrz
   `else`-jak-ścieżki, czyli gdy `existingIdx === undefined`); kolejne duplikaty robią
   `merged[existingIdx]!.count++; continue;` — NIE wywołują `merged.push`, więc grupa
   fizycznie zostaje na indeksie pierwszego wystąpienia w tablicy `merged`. Zgodne z GOAL.
4. **Widoczny licznik z poprawną odmianą polską**: `pluralPl(n, one, few, many)` — reguła
   1 / 2-4 (few, z wyjątkiem 12-14 → many) / 5+ (many) — poprawna polska odmiana rzeczownika
   po liczebniku. Dopisek `` `${subtitle} (${d.count} ${pluralPl(...)})` `` WYŁĄCZNIE gdy
   `count > 1` — dla `count === 1` `subtitle` zostaje nietknięty (potwierdzone testem 1b:
   `subtitle === diffHints[i].msg`, bez dopisku). Jednoznaczny („3 wystąpienia”, nie samo „×3”).
5. **id po scaleniu**: finalny `.map((d, i) => ({ id: `eot-hint-${turn}-${i}`, ... }))`
   operuje na `merged` (tablicy PO scaleniu) — `i` to indeks w tej tablicy, nie oryginalny
   indeks przed scaleniem. Brak dziur/kolizji z definicji (mapowanie 1:1 tablicy bez gapów).
6. **Dyplomacja nietknięta poza zakresem**: gałąź `isDiplomacy` (identyfikacja `isAiAiTrade`
   / `isPlayerAiDiplomacy`) jest DOKŁADNIE tą samą logiką co przed zmianą (Operator to
   zadeklarował, potwierdzone czytaniem — brak różnic w tej części kodu względem
   udokumentowanego zachowania sprzed tematu: etykieta „Dyplomacja”, `kind:'diplo'`,
   `origin:'other-civs'` tylko dla AI↔AI). Zmiana dotyka WYŁĄCZNIE etapu PO tym mapowaniu.

Kod robi dokładnie to, co opisuje 00-dispatch.md — bez rozszerzeń i bez luk.

**Uwaga (nie blokująca, bez wpływu na werdykt):** duplikacja `pluralPl` (zamiast importu
z `techDiscoveryNotice.ts`) jest udokumentowaną, uzasadnioną decyzją Operatora (unikanie
sprzężenia modułu czysto transformacyjnego z modułem UI popupu) — zgadzam się z tym
uzasadnieniem, dispatch nie narzucał konkretnego mechanizmu odmiany, tylko wymóg
poprawności i możliwość duplikacji („można zaimportować albo zduplikować lokalnie —
decyzja Operatora, uzasadnić w raporcie” — spełnione).

## TESTY — uruchomione SAMODZIELNIE (nie na podstawie liczb z raportów)

Środowisko: `gra/` nie miał `node_modules` (jak w obu poprzednich etapach) →
`npm install` (69 pakietów, bez błędów instalacji; `npm audit` zgłasza istniejące
podatności w zależnościach dev-tooling, niezwiązane z tym tematem i poza zakresem).

| Test | Wynik u mnie | Zgodność z 01-operator.md | Zgodność z 02-evaluator.md |
|---|---|---|---|
| `node tools/eot-event-defer-test.cjs` | **19/19 PASS**, exit 0 | zgodne (19/19) | zgodne (19/19) |
| `node tools/era-change-toast-defer-test.cjs` | 7 passed / 0 failed, 8/8 mutacji złapanych, 4/4 sond bezpiecznych, exit 0 | zgodne | zgodne |
| `node tools/dyplo-karta-duplikat-komunikat-test.cjs` | 15 passed, 0 failed, exit 0 | zgodne | zgodne |
| `node tools/eot-diplomacy-header-test.cjs` | 18/18 PASS, exit 0 | zgodne | zgodne |
| `node tools/sidepanel-events-toolbar-test.cjs` | 19 pass, 0 fail, exit 0 | zgodne | zgodne |
| `npm run typecheck` (`tsc --noEmit`, z `gra/`) | brak błędów, exit 0 | zgodne | zgodne |

Zero rozbieżności między moim niezależnym uruchomieniem i liczbami zgłoszonymi przez
Operatora i Evaluatora — dla wszystkich 6 komend z 00-dispatch.md.

### Pokrycie kryteriów końca (00-dispatch.md §Kryteria końca)

- **1a** (3 identyczne hinty → 1 karta z licznikiem): PASS, treść dokładnie
  `„Wyrąb: +25 Drewna (pozostało 0 tury) (3 wystąpienia)”`.
- **1b** (2 różne hinty → 2 osobne karty): PASS, bez dopisku licznika.
- **1c** (kolejność = pierwsze wystąpienie): PASS, `["A (2 wystąpienia)","B","C"]`.
- **1d** (diplo nigdy nie scalane): PASS, 4/4 osobne karty, zero dopisków licznika.
- **1e** (id bez kolizji/dziur, indeks po scaleniu): PASS,
  `["eot-hint-20-0","eot-hint-20-1","eot-hint-20-2"]`.
- Punkt 2 (regresja 4 testów zależnych): PASS na wszystkich 4, liczby identyczne
  z oboma raportami.
- Punkt 3 (`tsc` bez nowych błędów): PASS, exit 0, zero output poza nagłówkiem npm.

## GOTOWOŚĆ DO INTEGRACJI

- `git status` po merge fast-forward: **czysty**, brak niescommitowanych zmian (przed
  dodaniem tego raportu).
- Historia commitów na branchu czytelna i w kolejności: dispatch (`69ea42f`) →
  implementacja Operatora (`45b6e4f`) → poprawka placeholdera SHA (`33f79f7`) →
  weryfikacja Evaluatora (`38b8956`, HEAD przed tym raportem).
- Brak śladów integracji z `main` lub push: `git reflog` bez wpisów push, oba raporty
  (`01-operator.md`, `02-evaluator.md`) kończą się jawnie `DEPLOY/PUSH: NIE WYKONANO`
  (zweryfikowane `grep`). `git remote -v` pokazuje skonfigurowane `origin`, ale brak
  jakiegokolwiek dowodu w historii/reflogu, że ktokolwiek wysłał do niego zmiany z tego
  tematu.

## Przegląd 00-dispatch.md pod kątem pominiętych kryteriów

Przeczytany cały dokument świeżym okiem (nie tylko punkty już zaznaczone jako zrobione
przez Operatora/Evaluatora). Wszystkie punkty §GOAL, §Zakres, §Allowlista, §Kryteria
końca i §Pętla mają odpowiadające im dowody w śladzie (kod, testy, brak dotknięcia
`main.ts`/`sidePanelHud.ts`, brak push). Nie znalazłem żadnego kryterium końca ani
ograniczenia zakresu pominiętego przez oba poprzednie etapy.

## BLOKADY

Brak.

## NASTĘPNY KROK

Integracja przez orkiestratora na branchu `autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1` —
merge do `main` i ewentualny deploy/push wymagają osobnej, wyraźnej autoryzacji
właściciela poza tym etapem. Final Control nie integruje i nie wystawia samodzielnie
`READY_FOR_DEPLOY` jako etykiety procesu (R-PROC-AUTOBOT.md §1) — powyższy status
oznacza rekomendację gotowości, nie wykonaną integrację.

## DEPLOY/PUSH: NIE WYKONANO

# R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1`
RUNDA: 1/5
DOMAIN: INFRA (nowy moduł + flaga funkcjonalna, ZERO PODMIAN w istniejących miejscach
wywołania — pierwszy etap dużego planu `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Właściciel zatwierdził `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` (wszystkie ABC-1..4
rozstrzygnięte) i polecił rozpocząć pracę od pierwszych punktów planu, PO domknięciu
całego zawisłego backlogu spoza hot-seatu (wykonane — patrz `REJESTR-PROSB-I-ZADAN.md`,
deploy FALA 359). Ten temat to **Etap 0** z §C planu: fundament, na którym stoją
wszystkie kolejne etapy. Zgodnie z planem **Etap 0 jest bezpieczny z definicji** —
kryterium „gotowe" to „typecheck + bramki zielone, zachowanie bit-w-bit" (żadna
istniejąca ścieżka kodu się nie zmienia).

**KRYTYCZNE — przeczytaj CAŁY `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` przed jakimkolwiek
ruchem**, w szczególności §B1 (kontrakt modułu), §C wiersz „0", §D (dziesięć ryzyk —
kontekst czemu ten fundament ma takie, nie inne kształty pól). Uwaga: numery linii
`main.ts` cytowane w planie są NIEAKTUALNE (plan powstał 2026-09-04/05, od tego czasu
main.ts zmienił się wielokrotnie) — lokalizuj przez grep po nazwach funkcji
(`civFogShortcutsEnabled`), nigdy po cytowanym numerze linii.

## GOAL

**Krok 1 (obowiązkowy rdzeń tego etapu).** Nowy plik `gra/src/game/human-owners.ts`,
moduł bezstanowy i w pełni testowalny w izolacji (zero importu z `main.ts`, zero importu
DOM/three.js), dokładnie kontrakt z planu §B1:

```ts
export const HUMAN_OWNER_PRIMARY = 0;
export interface HumanSeats {
  humanOwnerIds: readonly number[];   // [0] w single, [0, N] w hot-seat
  activeHumanOwnerId: number;
}
export function isHumanOwner(seats: HumanSeats, ownerId: number): boolean
export function isActiveHuman(seats: HumanSeats, ownerId: number): boolean
export function isAiOwner(seats: HumanSeats, ownerId: number): boolean   // !human && !barbarzyńca && !rebeliant
export function nextHumanSeat(seats: HumanSeats): number | null
export function isHotSeat(seats: HumanSeats): boolean
```

Sentinele do uwzględnienia w `isAiOwner` (grep ich realnych definicji w `gra/src/game/`
i `main.ts`, nie zgaduj wartości): barbarzyńcy i rebelianci mają dziś dedykowane,
ujemne `ownerId` (plan §0 pkt 3 wspomina `-1` barbarzyńcy, `-99` rebelianci jako
przykład — POTWIERDŹ realną stałą/konwencję w kodzie, np. grep `ownerId === -1`,
`REBEL_OWNER`, `BARBARIAN_OWNER` czy podobne; jeśli sentinel jest inaczej nazwaną
stałą eksportowaną gdzie indziej — zaimportuj ją, nie duplikuj liczby na nowo).

`nextHumanSeat`: zwraca kolejny ownerId w `humanOwnerIds` po `activeHumanOwnerId`
(cyklicznie), `null` gdy `humanOwnerIds` ma tylko jeden element (nie ma dokąd
przełączyć). `isHotSeat`: `humanOwnerIds.length > 1`.

**Krok 2 (flaga funkcjonalna, wzorowana na `civFogShortcutsEnabled`).** W `main.ts`,
w bezpośrednim sąsiedztwie `civFogShortcutsEnabled()` (znajdź przez grep — plan cytuje
nieaktualny numer linii), dodaj nową, analogiczną funkcję `hotSeatEnabled(): boolean`
— **własny, osobny mechanizm przełączania** (własna zmienna środowiskowa Vite, np.
`VITE_CIV_HOTSEAT`, własny parametr URL np. `?hotseat=1`), NIE dzieląc logiki z fog-flagą.
Ta funkcja **nie jest wywoływana z żadnego miejsca w tej rundzie** — to jest świadomie
martwy kod na tym etapie (przyszłe etapy 4-5 i 7 go użyją do bramkowania drugiego
fotela). Zgodnie z planem: doprecyzuj w komentarzu przy funkcji, że domyślne zachowanie
docelowe to `false` w `Gra-FINALNA.html`, `true` w `gra-robocza/Gra-ROBOCZA.html` —
ale w TEJ rundzie funkcja niczego nie bramkuje, więc nie musi jeszcze spełniać tego
kryterium w praktyce (nikt jej nie woła).

**Krok 3 (ŚWIADOMIE ODROŻONE do Etapu 1 — nie rób tego teraz).** Plan §B1 wspomina też
żywy stan `humanSeats`/`playerStateByHuman`/`exploredByHuman` obok `const player` w
`main.ts` oraz aliasy `isHuman(id)`/`isMe(id)`/`ME()`. **NIE dodawaj ich w tej rundzie.**
Powód: nie mają dziś żadnego konsumenta (pierwszy realny konsument to Etap 1,
`isAiOwner` w 31 miejscach `ownerId > 0`), a `playerStateByHuman` wymagałby typu
`PlayerState`, który nie jest dziś nigdzie formalnie zdefiniowany jako osobny typ —
zgadywanie jego kształtu teraz, bez realnego użycia, jest czystym ryzykiem bez
korzyści. Ta decyzja o kolejności NIE jest zmianą architektury planu, wyłącznie
przesunięciem TEGO KONKRETNEGO kawałka scaffoldingu do rundy, w której faktycznie
zyskuje pierwszego konsumenta.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz uznania „zero podmian" za spełnione bez realnego `git diff` pokazującego, że
JEDYNE zmiany poza nowym plikiem to dodanie (nie modyfikacja) `hotSeatEnabled()` w
`main.ts` — żadna istniejąca linia nie może się zmienić. Zakaz zakładania wartości
sentinela barbarzyńców/rebeliantów bez potwierdzenia grepem w realnym kodzie.

## BINARNE KRYTERIUM SUKCESU

- `gra/src/game/human-owners.ts` istnieje, eksportuje dokładnie te nazwy z kontraktu
  §B1, zero importu z `main.ts`/DOM/three.js.
- Nowa bramka (`gra/tools/hotseat-human-owners-test.cjs` albo podobna nazwa) testuje
  KAŻDĄ z pięciu funkcji + stałą, włącznie z: single-human (`humanOwnerIds=[0]`),
  hot-seat 2-human (`humanOwnerIds=[0,3]`), poprawne wykluczenie barbarzyńcy/rebelianta
  w `isAiOwner`, cykliczność `nextHumanSeat` (w obie strony), `isHotSeat` true/false.
- `hotSeatEnabled()` dodana w `main.ts` obok `civFogShortcutsEnabled()`, nigdzie
  niewywoływana, zero zmiany istniejących linii.
- `git diff` na `main.ts` pokazuje WYŁĄCZNIE dodane linie (nowa funkcja), zero linii
  usuniętych/zmienionych.
- `tsc --noEmit` czysto, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test) zielone, WSZYSTKIE inne istniejące
  bramki AI/ekonomia/dyplomacja bez zmiany wyniku (dowód: uruchom `ai-*-test.cjs`
  i `diplomacy-*-test.cjs` przed i po, identyczne liczby).

## ALLOWLISTA

- `gra/src/game/human-owners.ts` (nowy plik)
- `gra/tools/hotseat-human-owners-test.cjs` (nowy plik, nazwa orientacyjna)
- `gra/src/main.ts` — WYŁĄCZNIE dodanie nowej funkcji `hotSeatEnabled()`, zero innych
  zmian w tym pliku
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1/**`

Zakazane bezwzględnie: jakakolwiek inna zmiana w `gra/src/**` (w tym jakiekolwiek
wywołanie nowych funkcji z istniejącego kodu — to jest praca Etapu 1+), `gra/data/**`,
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i
`git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap0`, gałąź
`autobot/R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1`, baza jawnie `origin/main` (commit
`0a86a07e` w chwili założenia, może być nowszy przy starcie pracy — potwierdź
`git log -1` PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian zachowania gry — ten temat jest fundamentem bez konsumentów.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli w trakcie pracy dojdziesz do wniosku, że kontrakt modułu z planu (nazwy
  funkcji, kształt `HumanSeats`) wymaga zmiany względem tego, co jest napisane w
  `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §B1 — STOP, DECISION_REQUIRED z
  uzasadnieniem; nie odchodź od zatwierdzonego kontraktu samodzielnie.
- Sekwencjonowanie „Krok 3 odroczony do Etapu 1" (wyżej) NIE wymaga DECISION_REQUIRED
  — to already rozstrzygnięta przez orkiestratora decyzja proceduralna, nie zmiana
  architektury.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.

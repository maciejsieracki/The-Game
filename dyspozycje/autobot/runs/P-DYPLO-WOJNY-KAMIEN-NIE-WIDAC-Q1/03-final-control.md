# 03 — FINAL CONTROL (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: Trzecia, niezależna reprodukcja audytu + kontrola procesu. **Produktem jest
odpowiedź dla właściciela, nie integracja kodu.**
MODEL+EFFORT: **Opus 5, effort high**
RUNDY: 1/5

---

## 0. Werdykt w jednym akapicie

**Potwierdzam wynik Operatora i Evaluatora — ale nie przez powtórzenie ich pomiaru.**
Znalazłem **wspólny sterownik** obu ról (gracz zakłada jedno miasto i przez 60 tur
tylko kończy turę, więc nigdy nikogo nie odkrywa) i **zbudowałem scenariusz, który
ten sterownik łamie**: gracz buduje zwiadowcę i włącza „Zwiedzaj". Osobno —
i to jest najmocniejsza część tego raportu — **dwa z trzech blokad dają się
udowodnić z samego źródła, bez żadnego pomiaru**, więc żaden harness nie mógł ich
wyprodukować. Gotowość do integracji: **NIE DOTYCZY** — temat kończy się decyzją
właściciela, nie mergem.

---

## 1. Kontrola procesu (§16b)

| # | sprawdzane | wynik |
|---|---|---|
| 1 | `00-dispatch.md` istnieje, `GOAL` niezmieniony | TAK — `GOAL` identyczny w 00/01/02/03 |
| 2 | to samo ID we wszystkich rundach | TAK — `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` |
| 3 | werdykt Evaluatora oparty na artefaktach, nie deklaracjach | TAK — 4 zrzuty JSON + własny harness; przeliczył surowe dane Operatora własnym kodem |
| 4 | czy `PASS-WITH-NOTES` nie ukrywa uwagi o GOAL/dowodzie/zakresie/§9 | NIE ukrywa — uwagi to znaleziska Z1–Z8, czyli **treść** audytu, nie dług |
| 5 | licznik rund nie zresetowany | TAK — 1/5 w obu raportach, zgodne z dispatchem |
| 6 | granice §9 | brak naruszeń — patrz §5 |
| 7 | licznik rund / model | Opus 5 High w obu rolach, zgodnie z dispatchem (C-062) |
| 8 | gotowość do integracji | **NIE DOTYCZY** — dispatch: „ten temat nie kończy się integracją kodu" |

**NOTA F1 (na korzyść Evaluatora):** Evaluator sam zgłosił, że zdanie Operatora
„0/6 głównych AI miało kontakt z graczem" jest prawdziwe tylko dla przebiegu
mutanta, nie dla przebiegów bazowych 222/333 (`dowody-ev/weryfikacja-danych-operatora.md`,
NOTA E1). Sprawdziłem to i **korekta Evaluatora jest słuszna** — a co ważniejsze,
osłabia ona wniosek Z5 dokładnie w tym miejscu, w którym trzeba było go osłabić.
To jest zachowanie, którego §13b wymaga, i odnotowuję je jako spełnione.

---

## 2. REGUŁA PRZECIW SAMOOSZUKIWANIU — czy zmierzono ten sam skrót dwa razy

Zadanie kazało mi sprawdzić, czy obie role nie zmontowały tego samego stuba
(lekcja `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`). **Znalazłem taki wspólny element —
i jest istotny.**

**SONDY są faktycznie różne** (Operator: instrumentacja wejść bramy w `ai.ts`;
Evaluator: diff macierzy `diplomacyRelations` + census komend na granicy `main.ts`).
Tu zarzutu nie ma.

**STEROWNIK jest identyczny** — w obu harnessach ten sam kod:

| element | Operator (`wojny-kamien-audyt.vite.config.ts`) | Evaluator (`wojny-kamien-ev.vite.config.ts`) |
|---|---|---|
| założenie 1. miasta | `foundFirstCity()` — skan promieniowy `canFoundPlayerCityAt` | **ten sam kod, znak w znak** |
| koniec tury | `flushDeferredAutoPreBattle()` + `triggerPlayerEndTurn()` | **ten sam** |
| odblokowanie | `hidePreBattle` + `clearDeferredAutoPreBattleQueue` + `resetEndTurnBlockers` | **ten sam** |
| parametry gry | `buildParams()` bez pokazania kreatora | **ten sam** |
| **działania gracza przez 60 tur** | **żadne** | **żadne** |

Konsekwencja tego wspólnego sterownika jest dokładnie taka, przed jaką ostrzega
lekcja z `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`: gracz, który nigdy nie rusza się
z miejsca, **nie odkrywa nikogo**; `diplomaticallyDiscoveredOwners` zostaje przy
3 miastach-państwach obok stolicy (`[43,44,45]` w każdym z 6 przebiegów obu ról);
warstwa `diplomacyLayerForOwner` daje wtedy `'pre_contact'` dla wszystkich
głównych AI, a `filterDiplomacyCommandsForLayer` kasuje im **wszystkie** komendy.
**Sam ten stub wystarczy, żeby wyprodukować wynik „zero wojen" — niezależnie od
tego, czy mechanizm gry działa.** Dlatego mój pomiar tego stuba **nie używa**.

---

## 3. Dowody, których ŻADEN harness nie mógł wyprodukować

Trzy z pięciu znalezisk da się rozstrzygnąć **wyłącznie z kodu** (rząd 2 hierarchii
§13a). Przeczytałem je sam, linia po linii, w moim worktree na tipie gałęzi.
Te trzy wnioski są odporne na jakikolwiek błąd sterownika — mój, Operatora
i Evaluatora — bo nie zależą od żadnego przebiegu.

### 3.1 Z1 — przejęcie miasta-państwa trwale wyłącza AI z mechanizmu (DOWÓD ŹRÓDŁOWY)

`isOwnerClusterCityState` (`display-names.ts:50-59`) zwraca `true`, gdy właściciel ma
**jakiekolwiek** miasto z flagą `startCityState`:

```ts
if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;
```

Wyzwalacz wojny wymuszonej Kamienia (`main.ts:28025`) i Brązu (`main.ts:27963`) mają
ten warunek zanegowany, więc taki właściciel **nigdy nie trafia do `pending`**
i **nigdy nie trafia do `stoneCandidates`** (`main.ts:28065-28068`).

**Wyczerpujące przeszukanie całego `gra/src` po `startCityState` — 9 trafień w `main.ts`,
1 w `display-names.ts`, 4 w `ai.ts`/`cities.ts`. Kasowanie flagi istnieje w DOKŁADNIE
JEDNYM miejscu:** `main.ts:23625`, wewnątrz `annexCityStateToOwner`, czyli
**wchłonięcia dyplomatycznego**. Sprawdziłem obie ścieżki podboju militarnego —
kapitulację głodową (`main.ts:12456-12459`: `city.ownerId = newOwner; city.foundedByOwner = false;`)
i `applyCityCaptureToMap` (`main.ts:24007+`) — **żadna nie zeruje `startCityState`**.

**Wniosek: zdobywca miasta-państwa zostaje na stałe policzony jako miasto-państwo.**
To nie jest hipoteza z pomiaru — to jest własność kodu.

### 3.2 Z2/Z6 — brama wojny na gracza jest arytmetycznie NIESPEŁNIALNA (DOWÓD ŹRÓDŁOWY)

Odtworzyłem ten dowód niezależnie, zanim przeczytałem plik Evaluatora, i **wychodzi
identycznie**. Dla pary AI→gracz, w tej samej iteracji tej samej pętli, z tych samych
`potAI`/`potPlr`:

| krok | miejsce | treść |
|---|---|---|
| 1 | `main.ts:27647` | `rw = potAI / (potAI + potPlr)` |
| 2 | `main.ts:27615` + `diplomacy.ts:1590-1592` | `respekt = clamp(round(100 · rw), 0, 100)` |
| 3 | `diplomacy.ts:1739`, `:1743` | `tickDiplomacy` przepuszcza `respekt` **bez zmiany** |
| 4 | `diplomacy.ts:1032`, `:1386`, `:1738` | `zaufanie = clamp(…, 0, 100)` — **nigdy ujemne** |
| 5 | `diplomacy.ts:791-798` + `:183-184` (`mnoznikZaufania = mnoznikRespektu = 1`) | `score = clamp(zaufanie + respekt, 0, 200)` |

Stąd tożsamość **`score ≥ respekt = round(100 · rw)`**. Brama (`ai.ts:4377-4384`) żąda
jednocześnie `rw ≥ effProgWojnaSila` **i** `score < progMinimalnyRelacja`.
Ponieważ `effProgWojnaSila = Math.max(0.3, …)` (`ai.ts:4219-4222`), a realne minimum po
premiach archetypu to **0,38** (`ai.ts:4017`, `:4032`, `:4048`):

> `rw ≥ 0,38` ⟹ `respekt ≥ 38` ⟹ `score ≥ 38`, przy `progMinimalnyRelacja = 30`
> (`diplomacy.ts:172`; delta trudności ±10, `diplomacy.ts:471-475`).

**38 > 30 — oba warunki nie mogą być prawdziwe naraz. Dla każdego ziarna, każdej tury,
każdego stosunku sił.** Na trudności Łatwy (próg 20) tym bardziej. Jedyne okno to
Trudny (próg 40) przy `rw ∈ [0,380; 0,399]` — czyli gdy AI jest **słabsza** od gracza.

**To odwraca hipotezę dispatchu.** Dispatch zakładał, że „przewaga 1,5:1 nad graczem
może być rzadka". Jest odwrotnie: **przewaga AI czyni wojnę niemożliwą**, bo ta sama
liczba (`respekt`) jest jednocześnie miarą przewagi i składnikiem relacji.

### 3.3 Punkt 4 dispatchu — gracz strukturalnie wykluczony jako cel (DOWÓD ŹRÓDŁOWY, PODWÓJNY)

Gracz jest wykluczony **dwa razy niezależnie**:

1. `aiOwnerList` (`main.ts:27166-27172`) budowana jest z `if (u.ownerId > 0)` /
   `if (c.ownerId > 0)` — **owner 0 nigdy w niej nie występuje**;
2. filtr `stoneCandidates` (`main.ts:28065`) dokłada jawne `oid > 0`.

**Odpowiedź na punkt 4: TAK, gracz jest strukturalnie wykluczony.** Zgodne z literą
decyzji Q2 („cel ma być najbliższą terytorialnie cywilizacją AI") — **nie defekt**.

### 3.4 Punkt 5 dispatchu — czy gracz widzi wojny AI↔AI (DOWÓD ŹRÓDŁOWY)

`recordWarDeclarationEvent` (`main.ts:7753`) zaczyna się od:

```ts
if (declarerId !== 0 && targetId !== 0) return;
```

**Wojna AI↔AI nie generuje ŻADNEJ karty w panelu Wydarzeń.** Jedyny kanał to pasywny
wiersz w panelu dyplomacji (`collectKnownWarsBetweenOthers`, `main.ts:16067`) — i tylko
gdy gracz odkrył co najmniej jedną ze stron. Zero toastu, zero karty, zero sygnału na mapie.

### 3.5 Z7 — jedyna działająca ścieżka DOW na gracza (DOWÓD ŹRÓDŁOWY)

Potwierdzam znalezisko Evaluatora własnym odczytem: `main.ts:27193` bramkuje wojnę
klastra miast-państw na gracza warunkiem `_menuCityStateDifficultyVsPlayer === 'hard'`,
a `main.ts:29919-29922` ustawia tę zmienną **wprost z trudności gry** (`diff`, domyślnie
`'normal'`, `main.ts:29902`). Ta ścieżka **wywołuje** `recordWarDeclarationEvent` i toast
(`main.ts:27239-27245`), więc na „Trudnym" właściciel faktycznie zobaczyłby wypowiedzenie.


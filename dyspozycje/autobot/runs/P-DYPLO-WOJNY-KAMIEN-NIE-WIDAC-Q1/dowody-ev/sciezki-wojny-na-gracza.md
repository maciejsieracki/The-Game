# Wszystkie sciezki, ktorymi AI moze wypowiedziec wojne GRACZOWI

Weryfikacja Evaluatora, runda 1. Zrodlo: kod (rzad 2 hierarchii §13a), pelne
przeszukanie po `'wojna_wypowiedziana'` i `setDiploRelation` w `gra/src/main.ts`.
Kazdy wiersz ma plik:linia i warunek wejscia.

| # | sciezka | miejsce | warunek wejscia | czy dziala przy USTAWIENIACH DOMYSLNYCH (Normalny) |
|---|---|---|---|---|
| 1 | komenda AI `wypowiedz_wojne` (priorytet 4 `decideAIDiplomacy`) | `ai.ts:4377-4386` → `main.ts:28136-28158` | `rw >= effProgWojnaSila` **i** `score < progMinimalnyRelacja` | **NIE — warunki wzajemnie sprzeczne** (dowod nizej) |
| 2 | wymuszona wojna Kamienia | `main.ts:28031-28095`, `ai.ts:4158-4173` | cel z `stoneCandidates`, filtr `oid > 0` | **NIE — gracz strukturalnie wykluczony jako cel** |
| 3 | wymuszona wojna Brazu | `main.ts:27957-28011`, `ai.ts:4137-4152` | analogiczny filtr `oid > 0` | **NIE** (ta sama przyczyna) |
| 4 | wojna klastra miast-panstw na gracza | `main.ts:27193-27245` | `_menuCityStateDifficultyVsPlayer === 'hard'` | **NIE — domyslnie `'normal'`** (`main.ts:29919-29922`: wprost z trudnosci gry; „Normalny" → `normal`, `main.ts:29894-29901`). **Wlacza sie na trudnosci „Trudny"** |
| 5 | `ownerDeclareWarOn(AI, 0)` po odrzuceniu ultimatum | `main.ts:14627`, `:14768` | `entry.payload.warThreat === true` | **NIE — `warThreat` ustawia wylacznie UI GRACZA** (`ui/diplomacyNegotiationModal.ts:394`, `ui/diplomacyTradeBasket.ts:2562`; `main.ts:17830` buduje propozycje z `proposerOwnerId: 0`). AI tego pola nie ustawia nigdzie |
| 6 | `joinAllyToWar` — sojusznik dolacza do cudzej wojny | `main.ts:17014-17030` | musi juz istniec wojna z udzialem sojusznika gracza | **NIE — w Kamieniu nie ma zadnej wojny do dolaczenia** |
| 7 | barbarzyncy | `main.ts:7492-7498` | zawsze `wojna`, wymuszane defensywnie | to nie jest cywilizacja; `recordWarDeclarationEvent` odrzuca barbarzyncow (`main.ts:7754`) |

**Wniosek: przy ustawieniach domyslnych ZADNA sciezka nie moze doprowadzic do
wypowiedzenia wojny graczowi w epoce Kamienia.** Obserwacja wlasciciela („nie widze,
zeby ktos wypowiedzial mi wojne") jest w 100% trafna i w pelni wyjasniona konstrukcja
kodu, a nie pechem ziarna.

## Dowod dla sciezki 1 — brama jest arytmetycznie NIESPELNIALNA

Brama (`ai.ts:4377-4386`) wymaga jednoczesnie `rw >= effProgWojnaSila` **i**
`score < progMinimalnyRelacja`. Dla pary z GRACZEM silnik wiaze `score` z `rw`:

| krok | miejsce | tresc |
|---|---|---|
| 1 | `main.ts:27647` | `respektWzgledny = potAI / (potAI + potPlr)` — to jest `rw` |
| 2 | `main.ts:27615` | `respekt = computeRespekt(potAI, potPlr)` |
| 3 | `diplomacy.ts:1586-1593` | `computeRespekt = clamp(round(100 * potAI/(potAI+potPlr)), 0, 100)` = `round(100*rw)` |
| 4 | `main.ts:27618`, `:27644` | ten `respekt` jest zapisany do relacji i przechodzi przez `tickDiplomacy` bez zmiany (`diplomacy.ts:1739`, `:1743`) |
| 5 | `diplomacy.ts:1738` | `zaufanie = clamp(..., 0, 100)` — **nigdy ujemne** |
| 6 | `diplomacy.ts:791-798`, `:183-184` | `score = clamp(zaufanie*1 + respekt*1, 0, 200)` |

Stad **`score >= respekt = round(100*rw)`**. Jednoczesnie `effProgWojnaSila` ma twarda
podloge `Math.max(0.3, ...)` (`ai.ts:4219-4222`), a realny zakres po wszystkich premiach
archetypu to **[0,38; 0,68]** (`ai.ts:4017`, `:4032`, `:4048`, `:4218`). Zatem gdy pierwszy
warunek jest spelniony, `respekt >= 38`, czyli `score >= 38`, a `progMinimalnyRelacja`
wynosi **30** na trudnosci Normalnej (`diplomacy.ts:172`, `data/diplomacy.json`,
delta trudnosci `diplomacy.ts:471-475`). **38 > 30 — drugi warunek nie moze byc prawdziwy.**

Wyczerpujace sprawdzenie calej siatki parametrow: `brama-ai-gracz-spelnialsc.md`
(`gra/tools/wojny-kamien-ev-brama.cjs`). Na 24 komorki (3 trudnosci x 2 `podbojBoost`
x 4 `warSilaBonus`) **23 sa calkowicie puste**. Jedyna niepusta to trudnosc **Trudny**
(`progMinimalnyRelacja = 40`) przy `podbojBoost = 0,12` i `warSilaBonus = -0,10`
(archetyp agresywny o `tolerancjaRyzyka >= 7` i `sklonnoscDoPodboju >= 4`) —
i tam wojna wymaga `rw` w przedziale **[0,380; 0,399]**, czyli AI **slabszej** od gracza,
przy `zaufanie <= 1`.

**To odwraca hipoteze dispatchu.** Dispatch zakladal, ze „w epoce Kamienia przewaga 1,5:1
nad graczem moze byc rzadka". Jest odwrotnie: **przewaga AI CZYNI wojne niemozliwa**, bo ta
sama liczba (`respekt`) jest jednoczesnie miara przewagi i skladnikiem relacji. Im AI
silniejsza, tym dalej jej do wypowiedzenia wojny.

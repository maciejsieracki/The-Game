# Analiza modułowa

Główna analiza architektury projektu: [`../../ANALIZA-ARCHITEKTURY-Civ.md`](../../ANALIZA-ARCHITEKTURY-Civ.md) (katalog główny repozytorium).

Pełna synteza operacyjna (lane'y, decyzje ABC, sprinty): [`../CURSOR-RAPORT-KONCOWY.md`](../CURSOR-RAPORT-KONCOWY.md).

Ten katalog (`docs/analiza/`) zawiera pogłębione analizy techniczne per obszar kodu.

---

## Numeracja: 01–08 (deep-dive techniczny)

Pliki `01`–`08` to analizy **wg obszaru kodu** (ścieżka w `gra/src/`), przygotowane równolegle przez subagentów Cursor (2026-06-26).

| # | Plik | Opis jednym zdaniem |
|---|------|---------------------|
| 01 | [01-SILNIK-main.md](01-SILNIK-main.md) | Monolityczny `main.ts` (~2827 linii): stan gry, pętla tury, integracja UI/map/game, luki wpięcia. |
| 02 | [02-GAME-logika.md](02-GAME-logika.md) | 23 moduły `game/`: ekonomia, AI, dyplomacja, combat, research, kultura, oblężenie — pure logic ~80%. |
| 03 | [03-MAPA-RENDER.md](03-MAPA-RENDER.md) | `map/`, `render/`, `units/`: generator mapy, renderer 3D, ruch, terytorium, widoczność. |
| 04 | [04-UNITS-BATTLE.md](04-UNITS-BATTLE.md) | `battle/` + `combat.ts` + `siege.ts`: auto-bitwa, manual battle, auto-resolve SS5l, mur oblężniczy. |
| 05 | [05-UI-panele.md](05-UI-panele.md) | 11 modułów `ui/`: HUD, panel miasta, nauka, dyplomacja, pre-bitwa; blokada 6B (HUD). |
| 06 | [06-DYSPOZYCJE-stan.md](06-DYSPOZYCJE-stan.md) | Stan prac per lane z DZIENNIK + handoffy: % ukończenia, blokery, decyzje oczekujące. |
| 07 | [07-DANE-TESTY.md](07-DANE-TESTY.md) | 16 plików JSON w `data/`, 21 testów `tools/*-test.cjs`, pipeline `xlsx → json`. |
| 08 | [08-DOKUMENTACJA.md](08-DOKUMENTACJA.md) | Luki dokumentacja vs kod: SILNIK-ARCHITEKTURA nieaktualna, rozbieżności lane'owych speców. |

---

## Pliki lane (alternatywna numeracja — wg działu)

Równolegle z syntezą powstały pliki **wg działu projektu** (nazewnictwo z wcześniejszych sesji lane). Nie zastępują `01`–`08` — uzupełniają je perspektywą właściciela lane.

| Plik | Lane / dział | Uwaga |
|------|--------------|-------|
| [02-EKONOMIA.md](02-EKONOMIA.md) | Civ-EKONOMIA | Ekonomia globalna, surowce, wealth |
| [02-EKONOMIA-MIASTO.md](02-EKONOMIA-MIASTO.md) | Civ-EKONOMIA + MIASTO | Przecięcie ekonomii miasta (EKONOMIA wchłonęła MIASTO 2026-06-25) |
| [03-MIASTO.md](03-MIASTO.md) | Civ-MIASTO | Budynki, produkcja, panel miasta |
| [03-UNITS-BITWA.md](03-UNITS-BITWA.md) | Civ-UNITS | Jednostki + bitwa (perspektywa lane): 46 jednostek, morale 8 czynników, rout-before-death, AI bitwy 1A/2A/3A, machiny oblężnicze |
| [04-MAPA-RENDER.md](04-MAPA-RENDER.md) | Civ-MAPA | Render świata + miasta kamień/brąz + ulepszenia + ruch + klastry + generator (rozszerzone perspektywy lane) |
| [04-UNITS.md](04-UNITS.md) | Civ-UNITS | Setup jednostek, ruch na mapie |
| [05-AI-CYWILIZACJE-DANE.md](05-AI-CYWILIZACJE-DANE.md) | AI + CYWILIZACJE + DANE | AI wpięte (188 testów), roster 9 cyw, tech.json Żelazo, dyplomacja tier 5, religie 9 (re-eksport wiszący) |
| [05-UI.md](05-UI.md) | Civ-UI | Skrót analizy UI |
| [06-DANE.md](06-DANE.md) | Civ-DANE | Cywilizacje, tech, dane startowe |
| [06-DYPLOMACJA-SPOLECZENSTWO.md](06-DYPLOMACJA-SPOLECZENSTWO.md) | Civ-DYPLOMACJA | diplomacy.ts 617l, Zaufanie+Respekt 0..200, 5 tierów, T1-T4 zamknięte, religie 9, tempo gry |
| [07-AI-MAPA-DYPLOMACJA-CYWILIZACJE.md](07-AI-MAPA-DYPLOMACJA-CYWILIZACJE.md) | AI + MAPA + DYPLOMACJA + CYWILIZACJE | Synteza wielu lane'ów |
| [07-UI-UX.md](07-UI-UX.md) | Civ-UI | Makiety + HUD (6B BLOK), drzewko Q2=A, panele armii/nauki/dyplomacji, bitwa UI |
| [08-DOKUMENTACJA-OPS.md](08-DOKUMENTACJA-OPS.md) | DOKUMENTACJA / OPS | PLAYBOOK, DZIENNIK, workflow 3-fazowy, OneDrive, build pipeline, test suite ~762 |

**Zasada numeracji:** `01`–`08` = techniczny deep-dive po ścieżkach kodu; pliki `02-EKONOMIA`, `03-MIASTO` itd. = notatki / syntezy **po dziale** (właściciel lane). Przy konflikcie nazw priorytet ma plik `01`–`08`.

---

## Powiązane dokumenty

- [`../CURSOR-START-TUTAJ.md`](../CURSOR-START-TUTAJ.md) — szybki start po powrocie
- [`../CURSOR-PLAN-DZIALANIA.md`](../CURSOR-PLAN-DZIALANIA.md) — plan sprintów i decyzje
- [`../CURSOR-BACKLOG.md`](../CURSOR-BACKLOG.md) — backlog zadań
- [`../../PLAYBOOK-operacyjny-Civ.md`](../../PLAYBOOK-operacyjny-Civ.md) — workflow GLM / Composer / Opus

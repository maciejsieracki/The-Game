# C → MASTER — Fix odskoku obrońcy (fan-out) + morze

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-01 |
| **Obieg** | Maciej: playtest ODSKOK 3v3 · zgłoszenie bugów · **przekaż do Mastera** |
| **Flaga** | **→ MASTER: GOTOWE** |
| **Warstwa** | **🟡 cross** (`post-battle-map.ts` + `main.ts` passability) |
| **Decydent** | Maciej — kierunek odskoku **przeciwny do ataku** (nie losowy) |

---

## 1. Problem (playtest Macieja)

Scenariusz: `Gra-podglad-PLAYTEST-ODSKOK.html` · 3× Hastati vs 3× Łucznik · Auto.

| Bug | Objaw | Przyczyna |
|-----|--------|-----------|
| **Kierunek** | Obrońcy lądowali **w stronę atakujących** (za nimi) | `pickFanOutDirection` = **losowy** sąsiad heksu bitwy |
| **Morze** | Jednostki na heksach wody | `mapHexPassableForUnit` porównywało `'Morze'` z enum `'morze'` → morze traktowane jako ląd |

---

## 2. Co wdrożono (stałe w źródle)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/post-battle-map.ts` | `pickRetreatTargetAwayFromAttacker` — heks 1 krok **najdalej od centroidu ATK**; remis: DEF ucieka od ATK, ATK w stronę własnej linii |
| `gra/src/main.ts` | `mapHexPassableForUnit` → `TerenBazowy.Morze/Wybrzeze/Gory` (enum, nie stringi) |
| `gra/src/game/playtestOdskok3v3.ts` | Preset 3v3 + `Gra-podglad-PLAYTEST-ODSKOK.html` (pathname) |
| `gra/tools/post-battle-map-test.cjs` | **5/5 PASS** |
| `docs/AUTO-WALKA-MOC-ALGORYTM.md` | § fan-out: kierunek = **od atakujących**, nie losowy |
| `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md` | Sekcja ODSKOK |

**Usunięte:** losowy `pickFanOutDirection` (zastąpiony logiką kierunkową).

---

## 3. Co MASTER ma zrobić

1. ~~**Przyjąć** fix~~ — **ACK Master 2026-07-01**
2. **Integrator F:** 🔵 dyspozycja `MASTER-do-INTEGRATOR_C-odskok-fanout-2026-07-01.md` — bramka → kanon
3. ~~**Opus review**~~ — review subagent Master (obieg 2026-06-30)
4. **Maciej:** retest `PLAYTEST-ODSKOK.html` po kanonie P0

---

## 4. Bramka (self-check C)

| Test | Wynik |
|------|-------|
| `post-battle-map-test.cjs` | **5/5** |
| `auto-battle-power-test.cjs` | 14/14 (wcześniejsza sesja) |
| vite build | OK |

**PLAYTEST-ODSKOK md5 (C publish):** `5E1A1C9F7F5D7F5A6FA402C757D1B3F9`

---

## 5. DoD

- [ ] Po wygranej ATK obrońca fan-out **w przeciwnym kierunku do ataku** (centroid składu ATK)
- [ ] Brak placementu na morzu/wybrzeżu/górach
- [ ] Remis: obie strony fan-out w sensownych kierunkach (DEF od ATK, ATK w stronę własnej linii)
- [ ] Kanon po F + Opus

---

**Powiązane:** `C-do-INTEGRATOR_rebuild-playtest-2026-07-01.md` · `UNITS-do-MASTER_auto-walka-v2b.md` (baza v2b)

---

## 6. Audyt innych ścieżek odskoku (2026-07-01)

| Ścieżka | Moduł | Kierunek | Woda/morze | Werdykt |
|---------|--------|----------|------------|---------|
| Auto-walka gracza (mapa) | `applyPostBattleMap` | ✅ od ATK | ✅ enum TerenBazowy | **NAPRAWIONE** |
| Bitwa ręczna 3D → mapa | ten sam | ✅ | ✅ | **NAPRAWIONE** |
| Szturm oblężenia (preBattle / silent) | `finishSiegeStormBattle` → ten sam | ✅ | ✅ | **OK** (wspólny moduł) |
| AI atak (`doAutoPowerMapBattle`) | ten sam | ✅ | ✅ | **OK** |
| Barbarzyńcy AI odwrót | `barbarians.ts` → pathfinding | osobna logika | używa koszt ruchu | **OK** (nie fan-out) |
| Przegrana ATK | `retreatAtkRosterToStart` | pole startowe | przez pozycje start | **OK** (bez fan-out) |
| Remis | DEF od ATK + ATK w stronę własnej linii | ✅ | ✅ | **NAPRAWIONE** |
| Merge „osobno” (odrzucenie stosu) | `findBounceHexFromOrigin` | heks startu / sąsiad | **brak walidacji** → | **NAPRAWIONE** (`isHexPassableForUnit`) |
| Split armii | `findAdjacentEmptyHexes` | — | już `isHexPassableForUnit` | **OK** |
| Wycofaj atak (preBattle Escape) | anulowanie | brak ruchu | — | **OK** |
| Odwrót oblężenia (panel) | `endMapSiege` | brak fan-out | — | **OK** |

**Wniosek:** jeden moduł `post-battle-map.ts` obsługuje **cały fan-out po walce**; fix kierunku + morza obejmuje wszystkie tryby walki. Dodatkowy bug tylko w **merge bounce** — poprawiony w tej samej sesji.

**Testy:** `post-battle-map-test.cjs` 7/7 · `army-merge-bounce-test.cjs` 2/2

---

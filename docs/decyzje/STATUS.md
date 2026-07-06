# Dashboard decyzji — aktualizuje Master Silnik

**Model:** czaty A–E (ABC + lane) · **Grupa F** (main.ts) · **Master Silnik** (orkiestracja).  
**Protokoły:** `docs/master/README.md` · `docs/czaty/OD-MASTERA.md` · `docs/decyzje/MAPA-PYTAN-OPEN.md`

**Ostatnia weryfikacja:** 2026-07-01 (reconciliacja md5 · kanon = robocza)

**AKTUALNY KANON:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` · md5 **`4602e752d7e4b21f3c2460e494e82a8f`** (2026-06-29 12:25)

## Playtest Macieja (finalna)

| Stan | Akcja |
|------|--------|
| **CZEKA playtest** | Opus + checklist Fazy B na kanonie `4602e752…` |

---

| Priorytet | Temat | Status | → Grupa F | Następny krok |
|-----------|-------|--------|-----------|----------------|
| **P0** | **F-BRAMKA** → ROBOCZA | **✅ DONE** | md5 `4602e752…` *(aktualny kanon)* | **Opus APPROVE** → playtest Maciej |
| **P0** | **F-START-FIX** | **✅ DONE** | generujSwiat | — |
| **P0** | **F-HUD / F-HUD-2** | **✅ w kodzie** | mountD1bHud | Opus |
| **P0** | **B2-Q5 hex 🔥** | **✅ w kodzie** | getRevolt | Opus |
| **P0** | **B2** Q1–Q6 | **ZAMKNIĘTE** | F-B2+porzadek | smoke ✅ |
| **P0** | **C1/C2** bitwa | **ZAMKNIĘTE** | F-C1 w kodzie | battle-smoke ✅ |
| **P1** | **civ-bonusy test** | **4 FAIL** | lane D | CYWILIZACJE P2 |
| **P1** | **F-PROD-SPAWN** | **TODO** | spawn z produkcji | po Opus |
| **P1** | **#1–3** B2 Szczęście | **OTWARTE ABC** | — | czat B |
| **P1** | **D-START miasta-kopie-typu** | **ZAMKNIĘTE spec** | — | CYWILIZACJE AI defensywne + MAPA pełny spawn |
| **P1** | **D-START + N-1…N-5** | **ZAMKNIĘTE** | — | CYWILIZACJE → MAPA → SILNIK |
| **P1** | **E1-Q9…Q12** | **OTWARTE ABC** | F-E1 provisional | czat E |
| **P1** | **C3** oblężenie | **ZAMKNIĘTE** | w kanonie `4602e752…` | — |
| **P2** | **A4-D4** budowa mapy | dec. zamknięte | w kodzie | Opus |
| **P2** | **F-D4** bonusy cyw. | **3A pełne v1.0** | 4 fail w teście | lane D |
| **P2** | **B5** żywność imperium | stub | EKONOMIA | `advanceEmpireFood` |

**Zamknięte (nie pytaj):** D1–D15 karta · D-START-1B/2B/3A · D-START miasta-kopie-typu · N-1A…N-5B · A1-Q5…Q12 · A2-Q4 · A4-D4 · B2-Q1…Q6 · C1-Q1…Q5 · C2-Q2…Q7 · B3 · B4 model

---

## Bramka i wersje

| Plik | Stan 2026-07-01 |
|------|-----------------|
| `Gra-podglad-ROBOCZA.html` | **✅ ISTNIEJE** md5 `4602e752d7e4b21f3c2460e494e82a8f` |
| `Gra-podglad.html` | **kanon** md5 `4602e752d7e4b21f3c2460e494e82a8f` (identyczny z ROBOCZA) · czeka Opus + playtest |
| *(historyczne)* | `2276ec0f`, `d813159b`, `611613f4…`, `9665790E…` itd. *(stary — aktualny kanon: `4602e752…`)* |

Flow: `docs/czaty/SCHEMAT-DWIE-WERSJE.md` · weryfikacja: `docs/master/WERYFIKACJA-SILNIK-2026-06-27.md`

---

## Lane (skrót)

| Lane | % | Bloker |
|------|---|--------|
| **Grupa F** | batchy wpięte | **Opus** |
| **UI** | ~95% | Opus |
| **MAPA** | ~85% | getRevolt ✅ |
| **UNITS** | ~90% | Opus |
| **EKONOMIA** | ~76% | B5 stub |
| **CYWILIZACJE** | ~72% | civ-bonusy 4 FAIL (P2) |

**Pełny audyt:** `docs/master/AUDYT-2026-06-27.md` · **Weryfikacja bramki:** `docs/master/WERYFIKACJA-SILNIK-2026-06-27.md`

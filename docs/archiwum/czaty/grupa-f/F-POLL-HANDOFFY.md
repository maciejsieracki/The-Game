# Grupa F — poll handoffów (co ~30 min)

> Agent F czyta ten plik + uruchamia `gra/tools/f-poll-handoffy.ps1` przy każdym ticku loopa.

## Co skanować (kolejność)

1. `dyspozycje/SILNIK-DO-MASTERA.md` § START
2. `docs/czaty/DO-MASTERA.md` § F (najnowsze wpisy)
3. `docs/czaty/OD-MASTERA.md` § Grupa F
4. `dyspozycje/DZIENNIK-MASTERA.md` (nagłówek + ostatnie wpisy Grupa F)
5. `dyspozycje/_handoff/*SILNIK*` + grep `CZEKA|GOTOWE-do-wpiecia|czeka wpięcie`
6. `dyspozycje/F-KOLEJKA-P0.md` § P1

## Kiedy wpiąć vs czekać

| Sygnał | Akcja F |
|--------|---------|
| Handoff `GOTOWE` + moduł na dysku + brak w `main.ts` | Wpięcie + bramka + raport |
| `→ SILNIK: GOTOWE` w DO-MASTERA § lane | Wpięcie |
| Master dyspozycja w OD-MASTERA § F | Wykonaj |
| Czeka Grupa A/E/B (C3, E1-UX, spec) | **Nie** wpinaj — dopisz w OSTATNI SKAN |
| Brak zmian vs poprzedni skan | Krótki wpis „bez zmian” |

## OSTATNI SKAN

*(agent nadpisuje sekcję poniżej przy każdym pollu)*

### [2026-06-28] tick auto #12 (loop 30 min)

**Bez zmian** vs poprzedni skan · kanon md5 `0a049ccc…`  
**Kolejka F kodowa:** **PUSTA** · test sesji + delegacja Maciej **ZAMKNIĘTE**  
**Nowe `→ SILNIK: GOTOWE`:** brak · lane czeka `start` (UI/MAPA/CYW/EKO)  
**Otwarte:** playtest Maciej · Opus HUD-S7 · diplomacy 3 FAIL → CYW

### [2026-06-28] sesja test — meldunek MASTER

**Kanon=ROBOCZA** md5 `0a049ccc…` · bramka **8/9** (diplomacy 132/135, 3 FAIL lane)  
**Delegacja lane:** ✅ · **Playtest Maciej:** CZEKA · **Opus:** CZEKA  
**→ MASTER:** `GOTOWE-ROBOCZA sesja-2026-28` w `SILNIK-DO-MASTERA.md`

### [2026-06-28 00:24] tick auto #11 (loop 30 min)

**Bez zmian** vs 00:20 · ROBOCZA `e87a5ca2…` · **8/8 wpięć** TAK · kolejka F P0 pusta  
**Otwarte w SILNIK.md:** OBL-S5 machiny (czeka sygnał Mastera / playtest) · SIL-UX-1 już w kodzie

### [2026-06-28 00:12] tick — bez zmian vs 00:10

**ROBOCZA** md5 `e87a5ca2f8eb5e4657ab28dd3da38644` · **8/8 wpięć** TAK  
**Kolejka F P0:** **PUSTA** — brak nowych `→ SILNIK` · meldunek u Mastera (Opus → kanon)  
**Akcja F:** brak kodu · czeka dyspozycja Mastera (A-START / OBL-S5 / E1-UX)

### [2026-06-28 00:10] F-B-WYRAB-TARTAK wdrożone → MASTER

**ROBOCZA** md5 `e87a5ca2f8eb5e4657ab28dd3da38644` — wyrąb/tartak/tech gate  
**Kolejka F P0:** **PUSTA** (Grupa B domknięta) · czeka dyspozycja Mastera  
**Testy:** grupa-b-lane 23/23 · smoke OK

### [2026-06-28 00:05] tick ręczny — F-B-PILNE wdrożone

**ROBOCZA** md5 `be6f0ff491e7be2e34f22fa554d8a236` — batch **F-B-PILNE**  
**8/8 wpięć** TAK · **Kolejka:** F-B-WYRAB-TARTAK następny  
**Testy:** grupa-b-lane 23/23 · society-breakdown 18/18 · smoke OK

### [2026-06-27 23:55] tick auto #10 (loop 30 min)

**ROBOCZA** md5 `db39196596fac12eabef1af6a573f18a` — fix **mgła miast AI** (CityRenderer + refreshFog)  
**8/8 wpięć** TAK · 23 handoffy `GOTOWE` w skrzynce — **brak nowych hooków SILNIK** (to batchy MASTER/UI/MAPA, nie auto-wpięcie)  
**Kolejka kodowa F:** **F-B-PILNE** + **F-B-WYRAB-TARTAK** (Grupa B → czeka dyspozycja / wykonanie w sesji F)  
**Akcja F:** brak auto-wpięcia · mgła miast opublikowana w ROBOCZA

### [2026-06-27 23:25] tick auto #10 (poll ręczny — Maciej „sprawdź skrzynkę”)

**Kanon = ROBOCZA** md5 `bf99e18b9f164dd1a734bbb5114755f1` · OBL-MAP-01 **ZAMKNIĘTY** (Maciej PLAYTEST OK)  
**8/8 wpięć** TAK · brak nowych handoffów `→ SILNIK` · brak dyspozycji w `OD-MASTERA` § F po zamknięciu kanonu  
**Kolejka F:** **PUSTA** — czeka Master: A-START → E-START-UX → D-CELTOWIE → E1-UX-01  
**Akcja F:** brak kodu · doc drift: `SILNIK.md` / `DZIENNIK` nagłówek / `SILNIK-STAN` (Master ops)

### [2026-06-27 23:23] tick auto #9 (loop 30 min)

**ROBOCZA** `bf99e18b…` (OBL-MAP-01) · 8/8 wpięć TAK · brak nowych handoffów SILNIK  
**Status:** → MASTER test oblężenia (GOTOWE-ROBOCZA wysłane) · F czeka

### [2026-06-27 22:53] tick auto #8 (loop 30 min)

**ROBOCZA** `cd4677e6…` (fix `siegeMapPanel` boot) · 8/8 wpięć TAK · brak nowych handoffów SILNIK  
**Akcja F:** czeka retest Maciej PLAYTEST-WALKA + Master Opus

### [2026-06-27 22:23] tick auto #7 (loop 30 min)

**Bez zmian** vs 22:00 · ROBOCZA `6aedd5ce…` · kolejka kodowa F **PUSTA**  
**Maciej:** playtest OK przekazany Masterowi (~22:00) → **czeka Opus → kanon**  
**Akcja F:** brak wpięcia

### [2026-06-27 20:53] tick auto #4 (loop 30 min)

**Bez zmian** vs 20:23 · ROBOCZA `e2401cac…` · backlog bez zmian

### [2026-06-27 20:23] tick auto #3 (loop 30 min)

**Bez zmian** vs 19:57 · ROBOCZA `e2401cac…` · backlog: A-FOG-Q1B, civ-roster, Grupa B 2–5

### [2026-06-27 19:53] tick auto #2 (loop 30 min)

**Bez zmian** vs 19:51 · ROBOCZA md5 `e2401cac61fec8d2d6465573e90b50d8`  
**Otwarte:** A-FOG-Q1B (nowy od A) · civ-roster · Grupa B batch 2–5  
**Akcja:** brak auto-wpięcia

### [2026-06-27 19:23] tick auto (loop 30 min)

**Zmiana vs 19:07:** ROBOCZA md5 `563a5c947cc5208a8da26380f67c0690` (było `8839726…`) — ktoś przebudował; **brak nowych handoffów**

**Priorytet START:** weryfikacja ui-flow + mgła/ghost (kod już w main.ts) → bramka + Opus

**Do wpięcia (bez zmian):**
- `CYWILIZACJE-do-SILNIK_E1-roster-startowy.md` — civ-roster ❌
- `EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md` — empire-food, power, okolica, kultura ❌

**Akcja F:** brak auto-wpięcia (bez nowej dyspozycji) · czeka decyzja użytkownika

### [2026-06-27 18:51] tick — loop 30 min **UZBROJONY**

**Mechanizm:** `%TEMP%\f-poll-loop-grupa-f.ps1` · skrypt `gra/tools/f-poll-handoffy.ps1` · pierwszy tick za ~30 min

**Od Mastera:** bez zmian · czeka playtest Maciej + Opus  
**ROBOCZA:** md5 `365ba2835e1dc6391124458763dfc9c7`

**Gotowe do wpięcia:**
- `CYWILIZACJE-do-SILNIK_E1-roster-startowy.md` — `civ-roster.ts` · main.ts **NIE**

**Zablokowane:** C3 (A) · deploy · E1-UX (E)

**Następny poll:** ~30 min (auto) lub ręcznie: `cd gra; .\tools\f-poll-handoffy.ps1`

# REJESTR PLAYTESTÓW — jedno miejsce (Maciej + wszyscy czaty)

> **Dla Ciebie (Maciej):** o playtestach (**w tym zaległych**) mówi **tylko Master** — lane'y milczą.  
> **Dla lane A–F:** dopisują **§2** · **ZAKAZ** wzmianek w czacie z Maciejem.  
> **Eksport na koniec v1.0:** **§4** — Master wypełni po Twoim pełnym przejściu.

**Pełna checklista (~60 punktów):** [`maciej/MACIEJ-PLAYTEST-CHECKLIST.md`](maciej/MACIEJ-PLAYTEST-CHECKLIST.md)  
**Procedura bramki:** [`../obieg/OBOWIAZ-PLAYTEST-GATE.md`](../obieg/OBOWIAZ-PLAYTEST-GATE.md) · [`../obieg/OBOWIAZ-PLAYTEST-REJESTR.md`](../obieg/OBOWIAZ-PLAYTEST-REJESTR.md)

**Ostatnia aktualizacja:** 2026-07-02 (MASTER-PT-01=C · B1-Q3-UI=A)

---

## §0 Brama v1.0 — kiedy zaczynasz testy

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **Tylko Master** informuje o playtestach. Lane wpisują §2. **Otwarcie §0:** dopiero gdy Master uzna, że gra ma komplet v1.0 (~60 pkt checklisty) — decyzja **MASTER-PT-01=C** (2026-07-02). |
| **Status bramy** | ⏸ **ZAMKNIĘTA** |
| **Kryterium otwarcia** | Master: lane IDLE · brak pilnych ABC · checklista [`maciej/MACIEJ-PLAYTEST-CHECKLIST.md`](maciej/MACIEJ-PLAYTEST-CHECKLIST.md) gotowa do pełnego przejścia |
| **Data otwarcia pełnego playtestu** | _puste — Master wpisze po spełnieniu kryterium_
| **Plik gry (jeden kanon)** | `Gra-podglad.html` · `gra-kanon/START.html` |
| **md5 kanonu (bieżący)** | **`0fd96b6f5fb021fb3294dde29c5692ce`** |

**Do dnia otwarcia bramy:** **ignoruj** playtest w czatach — lane'y dopisują tylko §2 (Master widzi plik).

---

## §1 Lista dla Macieja — co będzie do przetestowania (skrót)

Legenda: **🔴 MUST** · **🟡 SHOULD** · **⚪ LATER** · status rejestru: **⏸ kolejka** · **▶ otwarty** (tylko po §0) · **✅ OK** · **🐛 BUG**

### A. Start i kreator

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-S01–S07 | 🔴/🟡 | Menu, kreator, epoka, cywilizacja, kampania | ⏸ kolejka v1.0 |
| PT-E2 | 🟡 | E2 smoke: Mało vs Dużo gęstości | ✅ **`2 OK`** 2026-07-02 |

### B. Mapa i HUD

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-M01–M09 | 🔴/🟡 | HUD 6B, minimapa, dyplomacja chipy, moc, spichlerz HUD | ⏸ kolejka v1.0 |
| PT-A5 | 🟡 | Miasta Roblox + ghost założenia | ⏸ kolejka (w kanonie) |

### C. Miasto i ekonomia

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-E01–E13 | 🔴/🟡 | Panel miasta, okolica, tick, wealth, spichlerz, woda | ⏸ kolejka v1.0 |
| PT-Z05 | 🟡 | Trudność easy / normal / hard (B2-D18) | ⏸ kolejka (w kanonie) |

### D. Walka

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-F01 | 🔴 | Atak wrogiego miasta z mapy (5 scenariuszy F-AC7) | ⏸ kolejka (w kanonie) |
| PT-W01–W08 | 🔴/🟡 | Potyczka, odskok, oblężenie, katapulta | ⏸ kolejka v1.0 |

### E. Dyplomacja

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-P7 | 🟡 | Prezent / dar (audiencja, akcja 13, Rel ≥ 30) | ⏸ kolejka (w kanonie) |
| PT-D3 | 🟡 | D3 v1.1: sojusze, trybut, load save | ⏸ kolejka (w kanonie) |
| PT-D01–D08 | 🔴/🟡 | Audiencja, koszyk PN, przemarsz, transfer | ⏸ kolejka v1.0 |

### F. Meta i zwycięstwo

| ID | Pri | Co sprawdzisz (skrót) | Status |
|----|-----|------------------------|--------|
| PT-V06 | 🔴 | Ekran zwycięstwa / przegranej (E-P0-06) | ⏸ kolejka (w kanonie) |
| PT-Z01–Z04 | 🔴/🟡 | 50+ tur, zapis, fog of war | ⏸ kolejka v1.0 |

**Szczegóły scenariuszy batchy:** [`LISTA-PLAYTESTS.md`](LISTA-PLAYTESTS.md) (techniczna kolejka Mastera)

---

## §2 Kandydaci playtestu (append-only — wszyscy agenci)

> **Kto dopisuje:** Master, Grupy A–E (w meldunku GOTOWE), Integrator F (po kanonie).  
> **Format wiersza:** nie zmieniaj starych wierszy — tylko **dopisuj** na dole tabeli.  
> **Status:** `⏸ KOLEJKA` · `▶ OTWARTY` (tylko Master + §0 otwarte) · `✅ ZAMKNIĘTY` · `🐛 BUG`

| Data | ID | Batch / temat | Lane | md5 (kanon) | Scenariusze (skrót) | Handoff | Status |
|------|-----|---------------|------|-------------|---------------------|---------|--------|
| 2026-07-02 | PT-E2 | E2-PARAMS smoke gęstość | E+A | `01490681…` | Mało vs Dużo surowców | `MASTER-E2-SMOKE-BRAMKA-2026-07-02.md` | ✅ Maciej `2 OK` |
| 2026-07-02 | PT-F01 | F-P1-01 atak miasta z mapy | A→C→F | `e2be159f…` | 5× F-AC7 (preBattle, mur, auto-atak…) | `F-do-MASTER_F-P1-01-2026-07-02.md` | ⏸ KOLEJKA |
| 2026-07-02 | PT-V06 | E-P0-06 ekran zwycięstwa | D+E→F | `e2be159f…` | dominacja · nauka · przegrana | `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` | ⏸ KOLEJKA |
| 2026-07-02 | PT-Z05 | B2-D18 balans trudności | B→F | `e2be159f…` | easy/normal/hard start + progi | `EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md` | ⏸ KOLEJKA |
| 2026-07-02 | PT-P7 | Prezent / dar G3-B | D | `e2be159f…` | audiencja · akcja 13 · Rel≥30 | `MASTER-do-MASTER_P7-PREZENT-wiring-2026-07-02.md` | ⏸ KOLEJKA |
| 2026-07-02 | PT-A5 | Miasta Roblox + ghost | A | `e2be159f…` | styl epoki · ghost założenia | lane A A5 | ⏸ KOLEJKA |
| 2026-07-02 | PT-D3 | D3 v1.1 dyplomacja silnik | D→F | `e2be159f…` | sojusze · trybut · load save | `F-do-MASTER_SILNIK-D-V11-2026-07-02.md` | ⏸ KOLEJKA |
| 2026-07-05 | PT-BLEDY-MAPA | BLEDY P0 rzeki + pustynia | F→Master | `0fd96b6f…` | rzeki→morze · pustynia bez oceanów · nowa gra Ctrl+F5 | `F-do-MASTER_BLEDY-2026-07-05.md` | ✅ Maciej OK rzeki · OK pustynia |

---

## §3 Log wyników (append-only — po playtest Macieja)

| Data | ID | md5 | Wynik | Uwagi Macieja / BUG |
|------|-----|-----|-------|---------------------|
| 2026-07-02 | PT-E2 | `01490681…` | ✅ OK | Maciej: **`2 OK`** — smoke wizualny E2 |

---

## §4 Eksport końcowy v1.0 (Master wypełni po pełnym playtest)

_Pusty do dnia otwarcia §0. Po zakończeniu: skopiuj tutaj podsumowanie z §1 + §3 + werdykt._

| Pole | Wartość |
|------|---------|
| **Data zakończenia pełnego playtestu** | |
| **md5 kanonu testowanego** | |
| **🔴 MUST — OK / razem** | / |
| **🟡 SHOULD — OK / razem** | / |
| **Otwarte BUGi (lista)** | |
| **Werdykt Macieja** | ⬜ v1.0 OK · ⬜ v1.0 z poprawkami · ⬜ nie v1.0 |
| **Eksport pełny (opcjonalnie)** | _Maciej: Export czatu Cursor → `docs/archiwum-czatow/maciej-decyzje/`_ |

---

## Dla agentów — szybka reguła

1. **Lane A–F:** batch w kanonie → **dopisz §2** · **nigdy** nie mów Maciejowi o playtest.  
2. **Master:** **jedyny** informuje Macieja (kolejka, zaległości, prośba) · wyniki → **§3**.  
3. **§0 ZAMKNIĘTA** → Master **nie** prosi o test · Maciej **nie** dostaje list z lane.  
4. Maciej **`playtest lista`** → odpowiada **Master** z §1 (nie lane).

---

*Właściciel treści playtestu: Maciej · Nadzór i eksport: Master · Źródło techniczne batchy: `LISTA-PLAYTESTS.md`*

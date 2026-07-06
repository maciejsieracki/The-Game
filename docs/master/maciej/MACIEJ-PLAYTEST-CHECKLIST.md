# MACIEJ — rejestr playtestu (v1.0)

> **Po co:** jedna lista „co sprawdzić”, żeby nie pamiętać z głowy.  
> **Kiedy:** dopiero gdy gra jest **~100% grywalna** (Master otworzy §0 w [`../REJESTR-PLAYTESTOW.md`](../REJESTR-PLAYTESTOW.md)).  
> **Do dnia v1.0:** możesz ten plik **ignorować** — nic nie jest od Ciebie wymagane co sesję.

**Powiązane:**
- **Jedno miejsce (lista + eksport):** [`../REJESTR-PLAYTESTOW.md`](../REJESTR-PLAYTESTOW.md)
- Miasto tylko: `docs/grupa-b/PLAYTEST-MIASTO-MACIEJ.md`
- Walka tylko: `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md`

---

## 0. Brama — kiedy zaczynam pełny playtest

| Pole | Wartość |
|------|---------|
| **Data startu pełnego playtestu** | _puste — wypełni Master_ |
| **Plik gry (jeden kanon)** | `Gra-podglad.html` · `gra-kanon/START.html` |
| **md5 kanonu** | **`e2be159f457ded870e198d0e0eaa847d`** (2026-07-02) |
| **Status v1.0** | ⏸ **brama ZAMKNIĘTA** — rejestr [`../REJESTR-PLAYTESTOW.md`](../REJESTR-PLAYTESTOW.md) §0 |
| **Kolejka batchy (Master)** | [`../REJESTR-PLAYTESTOW.md`](../REJESTR-PLAYTESTOW.md) §2 · szczegóły [`../LISTA-PLAYTESTS.md`](../LISTA-PLAYTESTS.md) |

**Zasada:** testujesz **pełną grę od menu do zwycięstwa**, nie pojedyncze batchy z ROBOCZA (chyba że Master prosi o wyjątek).

---

## 1. Jak zgłaszać (tylko czat — bez wklejek do Mastera)

| Piszesz | Znaczenie |
|---------|-----------|
| `playtest OK` | cała sekcja / cała gra OK |
| `playtest OK §3` | tylko sekcja 3 (Miasto) OK |
| `BUG: …` | co, gdzie, krok po kroku (1–3 zdania) |
| `playtest POMIŃ` | świadomie odkładasz (np. brak czasu) |

Master dopisuje BUG do tego pliku w kolumnie **Uwagi / BUG**.

---

## 2. Rejestr sesji (Ty lub Master dopisuje wiersz)

| Data | md5 / plik | Sekcje zrobione | Wynik | Uwagi |
|------|------------|-----------------|-------|-------|
| _przykład_ | `7DB15616…` | §1–§4 | BUG: … | |
| | | | | |

---

## 3. Legenda checklisty

| Symbol | Znaczenie |
|--------|-----------|
| 🔴 | **MUST** — v1.0 bez tego nie „jest” |
| 🟡 | **SHOULD** — ważne, ale można po pierwszym przejściu |
| ⚪ | **LATER** — sandbox / edge case / po v1.0 |
| ☐ / ☑ | nie zrobione / zrobione |
| — | puste pole na BUG lub datę |

**Kolumny:** `ID` · `Pri` · `Test` · `☐` · `Uwagi / BUG`

---

## 4. CHECKLIST — pełna gra

### §1 Start, menu, kreator 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-S01 | 🔴 | Nowa gra → menu działa, widać wszystkie opcje | ☐ | |
| PT-S02 | 🔴 | Kreator: wybór mapy, trudności, tempa, liczby rywali | ☐ | |
| PT-S03 | 🔴 | Kreator: epoka przed cywilizacją (E1) — sensowne opcje | ☐ | |
| PT-S04 | 🔴 | Wybór cywilizacji — bonusy widoczne, start gry bez błędu | ☐ | |
| PT-S05 | 🟡 | Inkowie: **brak Brązu** w epokach startowych (INK-Q1) | ☐ | |
| PT-S06 | 🟡 | Kampania / wideo / intro — nie blokuje (jeśli w v1.0) | ☐ | |
| PT-S07 | ⚪ | Reset gry, powrót do menu | ☐ | |

---

### §2 Mapa, HUD, kamera 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-M01 | 🔴 | HUD 6B: zasoby, tura, epoka, badania czytelne (D1=C) | ☐ | |
| PT-M02 | 🔴 | Minimapa: widać mapę, klik przesuwa kamerę (D15) | ☐ | |
| PT-M03 | 🔴 | Chipy dyplomacji: sojusze / pakiety / wojny (A1-revB) | ☐ | |
| PT-M04 | 🔴 | Moc + rekruci na HUD (P-A) | ☐ | |
| PT-M05 | 🔴 | Zapasy wojska **X / max** na HUD (B5-SP); bez Spichlerza: `—` | ☐ | |
| PT-M06 | 🟡 | Głód wojska — czerwony alert na HUD | ☐ | |
| PT-M07 | 🟡 | Jednostka zaznaczona — panel ruchu / akcji (A2) | ☐ | |
| PT-M08 | 🟡 | Overlay kultura / religia przy minimapie (jeśli w v1.0) | ☐ | |
| PT-M09 | ⚪ | Jakość mapy / dekoracje — bez regresji wizualnej | ☐ | |

---

### §3 Miasto, ekonomia, okolica 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-E01 | 🔴 | Panel miasta otwiera się, widać produkcję i budynki | ☐ | |
| PT-E02 | 🔴 | Okolica: 👤 na polu, profile Żywność/Produkcja (B) | ☐ | |
| PT-E03 | 🔴 | Koniec tury: tick żywności, skarbiec, nauka | ☐ | |
| PT-E04 | 🔴 | Wealth / zamożność — pasek i wpływ (D3=A) | ☐ | |
| PT-E05 | 🔴 | Spichlerz: bufor 🍞, suwak wzrost/armia 70/30 (B5) | ☐ | |
| PT-E06 | 🔴 | Spichlerz: limit zapasów armii, overflow nie przekracza cap (B5-SP) | ☐ | |
| PT-E07 | 🔴 | Panel Spichlerz **bez** chipa 📦 zapasów — tylko HUD (B5-SP) | ☐ | |
| PT-E08 | 🟡 | Szczęście / porządek / bunt — nie psuje T1 (B2-D16 po wdrożeniu) | ☐ | |
| PT-E09 | 🟡 | Kara wody tylko gdy brak dostępu do wody/rzeki (B2-D17) | ☐ | |
| PT-E10 | 🟡 | Kup jednostkę za 💰 (nie przez kolejkę Pracy) | ☐ | |
| PT-E11 | 🟡 | Ulepszenia terenu: farma, tartak, hodowla, warstwy FOOD | ☐ | |
| PT-E12 | 🟡 | Łodzie rybackie **tylko w terytorium** miasta (A-R7) | ☐ | |
| PT-E13 | ⚪ | Sandbox: `Gra-podglad-PLAYTEST-MIASTO.html` — regresja ekonomii | ☐ | |

---

### §4 Walka, odskok, oblężenie 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-W01 | 🔴 | Potyczka 1v1: preBattle → Auto **lub** Ręczna (C1/C2) | ☐ | |
| PT-W02 | 🔴 | Po bitwie: podsumowanie (straty, wynik) widoczne | ☐ | |
| PT-W03 | 🔴 | Odskok wroga po przegranej (P0 odskok) | ☐ | |
| PT-W04 | 🔴 | Oblężenie miasta z mapy → szturm / obóz (C3) | ☐ | |
| PT-W09 | 🔴 | **F-P1-01:** miasto bez muru → preBattle → capture | ☐ | [`LISTA-PLAYTESTS` PT-F01](../LISTA-PLAYTESTS.md) |
| PT-W10 | 🔴 | **F-P1-01:** wycofaj z preBattle · ruch zostaje | ☐ | |
| PT-W11 | 🔴 | **F-P1-01:** klik wrogie miasto ≠ panel miasta | ☐ | |
| PT-W05 | 🟡 | Szanse na preBattle = sensowne (M armii) | ☐ | |
| PT-W06 | 🟡 | Katapulta / oblężenie spec (D10 — jeśli w v1.0) | ☐ | |
| PT-W07 | 🟡 | Posiłki / panel armii (D7/D8 — jeśli w v1.0) | ☐ | |
| PT-W08 | ⚪ | PLAYTEST-WALKA / ODSKOK / OBLEZENIE — regresja C | ☐ | |

---

### §5 Dyplomacja 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-D01 | 🔴 | Audiencja / negocjacje — otwiera się, widać relacje | ☐ | |
| PT-D02 | 🔴 | Koszyk PN: dar / wymiana, PN → Zaufanie (P4) | ☐ | |
| PT-D03 | 🔴 | Sojusz defensywny vs pełny — różne zachowanie (D3 v1.1) | ☐ | |
| PT-D04 | 🔴 | Przemarsz przez terytorium bez zgody → kara (P5) | ☐ | |
| PT-D05 | 🔴 | Transfer tech/surowca w koszyku (P6) | ☐ | |
| PT-D06 | 🟡 | NAP, trybut, handel jednorazowy, granice otwarte | ☐ | |
| PT-D07 | 🟡 | Ultimatum / wasal (jeśli w v1.0) | ☐ | |
| PT-D08 | ⚪ | AI dyplomacja — kilka tur bez crashy | ☐ | |

---

### §6 AI, cywilizacje, mapa 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-A01 | 🔴 | AI buduje, walczy, kończy turę | ☐ | |
| PT-A02 | 🔴 | Barbarzyńcy / neutralni (jeśli w v1.0) | ☐ | |
| PT-A03 | 🟡 | Miasta AI — kopie typu, nazwy (D-START) | ☐ | |
| PT-A04 | 🟡 | Miasta BRĄZU na mapie (D12 — jeśli w v1.0) | ☐ | |
| PT-A05 | 🟡 | Złoża rezerwują hex — brak farmy gracza na złożu | ☐ | |
| PT-A06 | ⚪ | Generator E2: suwaki jakości / rzeki (E2-PARAMS) | ☐ | |

---

### §7 Meta, zwycięstwo, stabilność 🔴

| ID | Pri | Test | ☐ | Uwagi / BUG |
|----|-----|------|---|-------------|
| PT-Z01 | 🔴 | Gra 50+ tur bez crashy / zawieszenia | ☐ | |
| PT-Z02 | 🔴 | Zapis / wczytanie (jeśli w v1.0) | ☐ | |
| PT-Z03 | 🟡 | Warunek zwycięstwa — ekran końca (E-P0-06) | ☐ | [`LISTA-PLAYTESTS` PT-V06](../LISTA-PLAYTESTS.md) |
| PT-Z04 | 🟡 | Fog of war sensowny (E1 pyt. 9) | ☐ | |
| PT-Z05 | 🟡 | Trudność easy / normal / hard (B2-D18) | ☐ | [`LISTA-PLAYTESTS` PT-Z05](../LISTA-PLAYTESTS.md) |

---

## 5. Podsumowanie (wypełnij na końcu)

| Metryka | Wartość |
|---------|---------|
| Data zakończenia pełnego playtestu | |
| md5 kanonu | |
| 🔴 MUST — zrobione / razem | /  |
| 🟡 SHOULD — zrobione / razem | /  |
| Otwarte BUGi | |
| **Werdykt Macieja** | ⬜ v1.0 OK · ⬜ v1.0 z listą poprawek · ⬜ nie v1.0 |

---

## 6. Dla Mastera (aktualizacja pliku)

- Po promocji kanonu: uzupełnij **§0** (data, md5).
- Po `BUG:` od Macieja: wpisz w wierszu checklisty + opcjonalnie `docs/CURSOR-BACKLOG.md`.
- Po zamknięciu v1.0: ustaw **§5 Werdykt** + wpis w `DZIENNIK-MASTERA.md`.

---

*Utworzono: 2026-07-01 · Właściciel checklisty: Maciej · Nadzór: Master*

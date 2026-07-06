# Część XVII — Zaawansowane

> **Poradnik gracza (Pełny)** · zapisy, skróty, panele balansu  
> Powiązane: Część I §1.3 · Część X §57 (preBattle) · `panele-sterowania/`

Ten rozdział jest dla graczy, którzy znają już podstawy (Części 0–III), oraz dla osób tworzących grę — krótko wyjaśnia zapisy, skróty klawiaturowe i skąd biorą się liczby w plikach danych.

---

## 100. Save / Load

### 100.1. Quick save z preBattle

Na **ekranie przed bitwą** (preBattle — Część X §57) możesz użyć **szybkiego zapisu** przed ryzykowną walką ręczną. Slot quick zwykle **nadpisuje** ostatni szybki zapis — nie polegaj na wielu wersjach w jednym slocie.

Zapis **w środku** bitwy 3D zwykle **nie jest** dostępny — zapisuj przed potwierdzeniem wejścia do taktyki.

### 100.2. Zapisy ręczne i autosave

| Sposób | Gdzie |
|--------|-------|
| **Zapis ręczny** | Menu w grze → Zapisz grę |
| **Wczytanie** | Menu główne → Wczytaj (lista z datą i nazwą państwa) |
| **Kontynuuj** | Ostatni autosave (jeśli istnieje) |
| **Autosave co X tur** | Status v1 — verify w buildzie |

Gra zapisuje **lokalnie** — nie musisz zarządzać folderami (OneDrive użytkownika nie dotyczy operacji zapisu w UI).

### 100.3. Migracja starych zapisów

Po **dużej aktualizacji** balansu lub formatu save stare pliki mogą **nie wczytać** się — zobaczysz komunikat o wersji. Dobra praktyka: ręczny zapis przed patchem, jeśli grasz długą partię.

### 100.4. Co jest w save

Stan mapy, miast, jednostek, drzewka tech, dyplomacji, trwających oblężeń i generatora (seed mapy). Multiplayer save — 🔮 przyszłość.


### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 101. Skróty klawiaturowe i flow UX

### 101.1. Mapa strategiczna

| Skrót | Akcja |
|-------|-------|
| **Enter** / **N** | Koniec tury (gdy aktywny — §16.3 Część III) |
| **H** | Karta wybranej jednostki (Część IV §22) |
| **C** | Tryb budowy ulepszeń pól (Część V §26) |
| **Klik minimapy** | Skok kamery (§18.3) |

### 101.2. preBattle i bitwa 3D

| Skrót | Akcja |
|-------|-------|
| **Enter** | Potwierdź auto-walkę / wejście w bitwę |
| **Escape** | Wycofaj atak |
| **S / P / H / M** | Formacje w bitwie taktycznej (§60.2) |
| **Ctrl+M** | Mapa taktyczna |

### 101.3. Panel miasta

- **Esc** — zamknij panel.
- Zakładki — **mysz** (globalne skróty numeryczne: status v1).
- **Wykonaj** w dolnym pasku — nie ma jednego skrótu klawiszowego dla wszystkich akcji.

### 101.4. Dostępność

v1.0 = **PC**, mysz + klawiatura. Sterowanie dotykowe i pełna skala UI — 🔮 post-v1. Przy skrótach w grze docelowo pojawia się Wiki‑S w tooltipie.


### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 102. Dla twórców: panele balansu A–E

*Sekcja informacyjna — **gracz końcowy nie edytuje** Excela.*

### 102.1. Excel → eksport → JSON

Balans gry żyje w arkuszach **`panele-sterowania/Panel-X.xlsx`**. Po zmianie wartości zespół uruchamia **targetowany** skrypt eksportu (np. tylko budynki → `buildings.json`). **Pełny** export wszystkich arkuszy naraz jest zabroniony — ryzyko nadpisania cudzych danych.

### 102.2. Mapowanie panel → pliki

| Panel | Domena | Przykładowy JSON |
|-------|--------|------------------|
| **A** | Mapa, teren | parametry generatora |
| **B** | Miasto, ekonomia | `buildings.json`, `econ-params.json` |
| **C** | Jednostki, walka | `units.json`, `combat-params.json` |
| **D** | Cywilizacje, AI | `civs.json`, `civ-matrix.json`, `ai-params.json` |
| **E** | UI, start, zwycięstwo | parametry kreatora, progi dominacji |

Pełna tabela: `panele-sterowania/PANEL-STEROWANIA-SPEC.md`.

### 102.3. Co z tego wynika dla gracza

- Ty grasz **buildem** z opublikowanymi danymi — nie widzisz Excela.
- Po aktualizacji gry liczby w poradniku mogą się **zmienić** (rewizja w stopce).
- **Decyzje gameplay** (np. Spichlerz B5) są ważniejsze niż pojedyncza komórka w arkuszu — opisane w `docs/decyzje/`.

### 102.4. Spójność Wiki ↔ dane

Enciklopedia (`docs/encyklopedia/`) i katalogi poradnika (28, 45, 57) są **generowane lub synchronizowane** z JSON. Jeśli coś się nie zgadza z grą — zgłoś wersję buildu; prawdopodobnie kanon dokumentacji czeka na rewizję po patchu.

Regeneracja katalogów:

```powershell
python gra/tools/gen-poradnik-batch.py
```


### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik gracza rev. E · 2026-07-03 · spis: §100–102*

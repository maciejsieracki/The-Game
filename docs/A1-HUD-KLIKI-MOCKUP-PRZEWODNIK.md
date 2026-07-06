# A1 — Przewodnik mockupów kliknięć (HUD D1B)

| Pole | Wartość |
|------|---------|
| **Hub** | `UI/Makieta-HUD-D1B-preview.html` |
| **Data** | 2026-06-26 |
| **Status** | **P0 wdrożone** — przeklikaj wszystko z huba |

Otwórz hub w przeglądarce (F5). Każdy klikalny element otwiera **gotowy ekran** — nie toast.

**Szybki start:** `UI/Makieta-START.html` — launcher całej ścieżki.

---

## [A] Pasek górny

| Klik | Co zobaczysz | Typ |
|------|--------------|-----|
| Zasoby (🍞🪙🔨…) | Tooltip przy najechaniu | TT |
| **Power ⚜ 62** | Modal — 6 składników potęgi + ranking | MD |
| Epoka | Brak kliku (pasek %) | — |
| **🤝 Kartagina** | Dyplomacja — fokus sojusznika | FS |
| **🕊️ Rzym** | Dyplomacja — fokus paktu | FS |
| **⚔ Persja / Egipt** | Dyplomacja — fokus wroga | FS |
| **☰ Menu** | Menu główne gry | FS |

---

## [C] Panel Imperium + Akcje

| Klik | Co zobaczysz | Typ |
|------|--------------|-----|
| **🏙 Miasta** | Lista miast → klik miasta → panel miasta | MD → FS |
| **🔬 Nauka** | Drzewko technologii (pełny SVG) | FS |
| **🎭 Kultura** | Parametry imperium | MD |
| **⛪ Religia** | Religia państwa | MD |
| **🏛 Cuda** | Lista cudów + postęp | FS |
| **🤝 Dyplomacja** | Pełny panel relacji | FS |
| **⚔ Wojsko** | Panel armii (generałowie, drag&drop) | DK |
| **🔨 Budowa** | Banner + panel ulepszeń + klik hex | MP |

---

## [D] Mapa 3D (hotspoty demo)

| Klik | Co zobaczysz |
|------|--------------|
| **Ateny** (środek mapy) | Panel miasta |
| **Hoplita** (zielony okrąg) | Panel jednostki [H] u dołu |
| **Persowie** (czerwony) | Pre-bitwa — jeśli najpierw zaznaczysz Hoplitę |
| Hex w trybie Budowa | Komunikat „postawiono ulepszenie" |

---

## [E] Wydarzenia

| Klik | Co zobaczysz |
|------|--------------|
| **⚔ Blocking** (czerwony) | Pre-bitwa Grecy vs Persja |
| **🔬 Metalurgia** | Drzewko technologii |
| **🏙 Ateny produkcja** | Panel miasta |
| **WYKONAJ** | To samo co blocking (pre-bitwa) |
| ✕ na chipie | Usuwa chip (bez panelu) |

Po zamknięciu pre-bitwy (← Mapa) — **Koniec tury** się odblokowuje (G1).

---

## [F] / [F2] Minimapa

| Klik | Efekt |
|------|--------|
| Minimapa | Toast — skok kamery |
| **🗺️ Granice** | Legenda terytorium ON/OFF |
| **🏷️ Nazwy** | Etykiety Ateny / Persepolis na mapie |
| **🎭 / ⛪ Zasięg** | Fioletowa / niebieska warstwa na mapie |

---

## [I] / [I2]

| Klik | Efekt |
|------|--------|
| **Zakończ turę** | Następna tura (gdy brak blocking) |
| **WYKONAJ** | Patrz [E] |

---

## Pliki mockupów

| Plik | Panel |
|------|--------|
| `Makieta-dyplomacja.html` | Dyplomacja |
| `Makieta-preBattle.html` | Pre-bitwa |
| `Makieta-cuda.html` | Cuda |
| `Makieta-panel-jednostki.html` | Jednostka [H] |
| `Makieta-panel-armii.html` | Wojsko |
| `Makieta-drzewko-uklad-bez-przeciec.html` | Nauka |
| `Gra-podglad-MIASTO.html` | Miasto |
| `Gra-podglad-MENU.html` | Menu |

**Powrót:** ESC lub **← Mapa** (pasek u góry pełnoekranu).

---

## Legenda typów

| Kod | Opis |
|-----|------|
| **FS** | Pełny ekran (iframe) |
| **MD** | Modal średni (overlay na mapie) |
| **DK** | Panel dokowany od dołu (armia) |
| **MP** | Tryb na mapie (budowa) |
| **TT** | Tooltip |

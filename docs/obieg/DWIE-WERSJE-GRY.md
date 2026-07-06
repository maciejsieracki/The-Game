# Trzy wersie gry — ROBOCZA · KANON · FINALNA (2026-07-05)

> **Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md) · **Decyzja Maciej:** 2026-07-01 + przemianowanie 2026-07-05

---

## Zasada (krótko)

| Wersia | Plik główny | Kto dotyka |
|--------|-------------|------------|
| **Robocza** | **`gra-robocza/Gra-ROBOCZA.html`** | Kod: A–E w `gra/src/` · publish: **Integrator F** |
| **Kanon** | **`gra-kanon/Gra-KANON.html`** | **Tylko Master** (promocja po OK Macieja) |
| **Finalna** | **`Gra-FINALNA.html`** (root) | **Tylko Master** (kopia przy promocji) |
| **Kod źródłowy** | **`gra/src/`** | A–E moduły · F `main.ts` |

**Hub Macieja (dev):** `gra-robocza/START.html` · **Lane i F nie publikują kanonu ani finalnej.**

---

## Przepływ

```
Lane GOTOWE → Master → F: main.ts + bramka → publish-robocza-snapshot.ps1
→ gra-robocza/Gra-ROBOCZA.html (+ ROBOCZA-MANIFEST md5)
Maciej testuje roboczą → OK
Master: publish-kanon-snapshot.ps1 → gra-kanon/Gra-KANON.html + Gra-FINALNA.html
```

---

## Skrypty

| Skrypt | Kto | Wynik |
|--------|-----|--------|
| `gra/tools/bramka-test-publish.ps1` | **F** | testy PASS → wywołuje `publish-robocza-snapshot.ps1` |
| `gra/tools/publish-robocza-snapshot.ps1` | **F** (po bramce) | pełny snapshot → **`gra-robocza/`** |
| `gra/tools/publish-kanon-snapshot.ps1` | **Master** | **`gra-robocza/` → `gra-kanon/`** + legacy root `Gra-podglad.html` |
| `gra/tools/backup-grywalna-dzien.ps1` | **Master** przy `start` | `gra-robocza/` → `gra-robocza-kopia/dzien_YYYY-MM-DD/` (max 1×/dzień) |

Build: `npx vite build --outDir $env:TEMP\civ-dist` (nie `dist/` w OneDrive).

---

## Zawartość katalogów grywalnych

Oba katalogi (`gra-robocza/`, `gra-kanon/`) zawierają **pełny zestaw startowy**:

- `START.html` · `Gra-podglad.html` · `PLAYTEST-*.html`
- `data/` · `src/` (snapshot audytu)
- manifest: `ROBOCZA-MANIFEST.json` / `KANON-MANIFEST.json`

---

## Start gry (Maciej)

| Cel | Otwórz |
|-----|--------|
| **Praca / test deweloperski** | `gra-robocza/START.html` |
| **Finalna / stabilna** | `gra-kanon/START.html` |
| **Wybór z root** | `START-GRA.html` (redirect) |

Root `Gra-podglad-ROBOCZA.html` i PLAYTEST-* = **legacy** (deprecacja — źródło prawdy: `gra-robocza/`).

**Maciej (D1A):** jedno drzwi → [`MACIEJ-PLAYTEST-JEDNO-DRZWI.md`](MACIEJ-PLAYTEST-JEDNO-DRZWI.md)

---

## Kopia dzienna (start dnia Master)

```powershell
cd gra
.\tools\backup-grywalna-dzien.ps1
```

Pełny backup projektu (osobno): `tools/backup-civ-daily.ps1`.

---

## Stan wdrożenia (2026-07-01)

| Faza | Status |
|------|--------|
| A — reguły + plan | ✅ |
| B — skrypty | ✅ |
| C — migracja `gra-robocza/` | 🔵 pierwszy snapshot wykonany |
| D — egzekucja w czatach A–F | ⬜ komunikat + ścieżki START |
| E — weryfikacja izolacji | ⬜ checklist |

**Źródło md5 roboczej:** `gra-robocza/ROBOCZA-MANIFEST.json`  
**Źródło md5 finalnej:** `gra-kanon/KANON-MANIFEST.json`

---

*Powiązane: [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md) · [`_ZASADY.md`](_ZASADY.md) · [`INTEGRATOR-kolejka.md`](INTEGRATOR-kolejka.md)*

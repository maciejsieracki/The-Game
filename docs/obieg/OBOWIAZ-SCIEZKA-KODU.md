# ⛔ OBOWIĄZ — ścieżka kodu vs wersja grywalna (2026-07-05)

> **Decyzje Macieja:** D1A · D2A · D3A · **broadcast do wszystkich grup A–F + Master hub**  
> **Trigger odczytu:** Maciej wpisuje w czacie grupy: **`ścieżka`** (lub **`reguły`**)  
> **Powiązane:** [`MACIEJ-PLAYTEST-JEDNO-DRZWI.md`](MACIEJ-PLAYTEST-JEDNO-DRZWI.md) · [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md)

---

## Problem (dlaczego Maciej widział „cofnięty” UX)

Wielu agentów edytowało **`gra-robocza/src/`** lub **`gra-kanon/src/`** — to **snapshoty**, nie źródło prawdy.  
Przy następnym publish z **`gra/src/`** zmiany **znikają**. Maciej testuje **bundle HTML**, nie folder `src/`.

---

## Jedna reguła (wszyscy)

| Co | Ścieżka |
|----|---------|
| **Kod (grupy A–E)** | **`gra/src/**`** wyłącznie |
| **`main.ts` (tylko F)** | **`gra/src/main.ts`** |
| **Publish F (robocza)** | **`gra-robocza/Gra-ROBOCZA.html`** |
| **Maciej gra (dev)** | **`gra-robocza/Gra-ROBOCZA.html`** lub hub **`gra-robocza/START.html`** + Ctrl+F5 + pieczętka **ROBOCZA** |
| **Kanon** | **`gra-kanon/Gra-KANON.html`** — tylko Master po OK Macieja |
| **Finalna** | **`Gra-FINALNA.html`** (root) — tylko Master (ta sama promocja co kanon) |

**Broadcast nazw plików:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)

### ⛔ ZAKAZ (natychmiastowy)

- Edycja **`gra-robocza/src/**`**
- Edycja **`gra-kanon/src/**`**
- Build z `gra-robocza/tools/publish-robocza-bundle.ps1` (deprecja — źródło musi być `gra/`)
- Handoffy wskazujące **`gra-kanon/`** jako „źródło prawdy UX”
- Meldunek „gotowe” **bez** publish F + md5 bundla

### ✅ Prawidłowy przepływ

```
Grupa A–E: gra/src/…  →  przekaż do Mastera  →  F: main.ts + bramka + publish-robocza-snapshot.ps1
→ gra-robocza/Gra-ROBOCZA.html (+ pieczętka ROBOCZA)  →  Master prosi Macieja (md5 w 1. linii)
→ po OK Macieja: Master publish-kanon-snapshot.ps1 → gra-kanon/Gra-KANON.html + Gra-FINALNA.html
```

---

## Kto wcześniej robił źle — co naprawić

| Grupa | Błąd | Przykład / dowód | Akcja naprawcza |
|-------|------|------------------|-----------------|
| **E** | Kod w `gra-robocza/src/ui/` | `UI-DO-MASTERA` 2026-07-04: modale C-04/C-05/A-19 | Diff vs `gra/src/ui/` → przenieś brakujące → **→ MASTER → F publish** |
| **A** | Kod w `gra-robocza/src/map/`, `render/` | `MAPA-DO-MASTERA`, DZIENNIK BATCH 3–4 | Weryfikacja sync w `gra/src/` → F publish |
| **F** | Edycja **najpierw** `gra-robocza/src/` | `F-do-MASTER_BLEDY-2026-07-05`, handoff BLEDY | Od teraz: **tylko `gra/src/`** → publish; sync robocza/src **nie edytujemy** |
| **Master** | Dyspozycje „edytuj gra-robocza/src" | `MASTER-do-INTEGRATOR_BLEDY-2026-07-05` | Dyspozycje wyłącznie na `gra/src/` |
| **B, C, D** | Ryzyko sync do snapshotów | sporadyczne kopie w handoffach | Trzymać się **`gra/src/`** + meldunek bez playtestu do Macieja |

---

## Potwierdzenie odczytu (agent — obowiązkowe)

Po **`ścieżka`** od Macieja agent odpowiada **jedną wiadomością**:

```
POTWIERDZAM ŚCIEŻKĘ · Grupa <X>
Kod: tylko gra/src/ · ZAKAZ gra-robocza/src i gra-kanon/src
Playtest Macieja: gra-robocza/Gra-ROBOCZA.html + md5 · Kanon/Finalna: Master
Przeczytałem: docs/obieg/BROADCAST-NAZWY-PLIKOW-2026-07-05.md · OBOWIAZ-SCIEZKA-KODU.md
```

Bez tego potwierdzenia — **nie wdrażaj** nowych zmian.

---

## Master — obowiązki

- Handoffy: ścieżka **`gra/src/...`** + „publish F”
- Playtest do Macieja: pierwsza linia `PLAYTEST: gra-robocza/Gra-ROBOCZA.html · md5=… · Ctrl+F5`
- **NIE** dyspozycjonować edycji snapshotów

---

*Wpis w rejestrze:* `REJESTR-DECYZJI.md` · **OBOWIAZ-SCIEZKA-KODU** · 2026-07-05

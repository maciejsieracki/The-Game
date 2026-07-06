# Plan wdrożenia — izolacja wersji roboczej i finalnej

> **Decyzja Maciej:** 2026-07-01 · **Status:** 🔵 Faza B+C w toku (skrypty ✅ · migracja częściowa)  
> **Powiązane:** [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md) · [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md)

---

## Cel

| Wersja | Kto dotyka | Co zawiera |
|--------|------------|------------|
| **Robocza** | Grupy A–E, **Integrator F**, Master (test) | Pełna grywalna kopia — **oddzielny katalog** |
| **Finalna** | **Tylko Master** (po teście) | Pełna grywalna kopia — **oddzielny katalog** |
| **Źródło kodu** | A–E moduły · F `main.ts` | `gra/` (wspólne repo — build) |

**Zasada:** czaty lane **nie mają dostępu do finalnej**. Integrator **nigdy** nie publikuje do finalnej.

---

## Struktura docelowa (katalogi)

```
Civ/
├── gra/                          ← kod źródłowy (lane + F main.ts)
├── gra-robocza/                  ← GRYWALNA ROBOCZA (F publikuje)
│   ├── START.html
│   ├── Gra-podglad.html
│   ├── PLAYTEST-*.html
│   ├── data/ · src/              ← snapshot do odtworzenia / audytu
│   └── ROBOCZA-MANIFEST.json
├── gra-kanon/                    ← GRYWALNA FINALNA (Master promuje)
│   ├── START.html
│   ├── Gra-podglad.html
│   ├── KANON-MANIFEST.json
│   └── …
├── gra-kanon-archiwum/           ← poprzednie finalne (Master)
├── gra-robocza-kopia/            ← kopia dzienna grywalnej (start dnia)
│   └── dzien_YYYY-MM-DD/
└── (root)                        ← tylko redirecty / legacy (deprecacja)
    Gra-podglad-ROBOCZA.redirect.html → gra-robocza/START.html
    Gra-podglad.html                  → gra-kanon/START.html (informacyjnie)
```

**Start gry:**
- **Praca / test:** `gra-robocza/START.html`
- **Finalna (Maciej):** `gra-kanon/START.html`

---

## Przepływ operacyjny

```
Lane GOTOWE → Master dyspozycja + uruchom F
F: main.ts + bramka → publish-robocza-snapshot.ps1 → gra-robocza/
Master ②: weryfikacja meldunku + md5 gra-robocza/
Master ③: test scope batchu (checklist / playtest)
Master: publish-kanon-snapshot.ps1 → gra-kanon/ (bezpiecznie: archiwum poprzedniego)
```

**Promocja = kopia całej grywalnej roboczej → finalna** (nie pojedynczy plik HTML w root).

---

## Fazy wdrożenia

### Faza A — reguły i dokumentacja ✅ (2026-07-01)

| # | Zadanie | Plik |
|---|---------|------|
| A1 | Zasady dostępu lane vs Master | `_ZASADY.md`, `civ-workflow.mdc`, `master-silnik-orchestration.mdc` |
| A2 | Trzy kroki Master + izolacja | `MASTER-ZADANIA.md`, `DWIE-WERSJE-GRY.md` |
| A3 | Ten plan | `PLAN-DWIE-WERSJE-IZOLACJA.md` |
| A4 | Rejestr decyzji | `REJESTR-DECYZJI.md` |

### Faza B — skrypty ✅ (2026-07-01)

| # | Zadanie | Skrypt |
|---|---------|--------|
| B1 | F publikuje **pełną** roboczą | `gra/tools/publish-robocza-snapshot.ps1` ✅ |
| B2 | Bramka F → tylko robocza (nie root final) | `gra/tools/bramka-test-publish.ps1` ✅ |
| B3 | Master promuje robocza → final | `gra/tools/publish-kanon-snapshot.ps1` ✅ |
| B4 | Kopia dzienna przy `start` | `gra/tools/backup-grywalna-dzien.ps1` ✅ |
| B5 | Hook w Master `start` / auto-watch | `MASTER-START-AUTO.md` 🔵 |

### Faza C — migracja plików 🔵

| # | Zadanie |
|---|---------|
| C1 | Uruchomić `publish-robocza-snapshot.ps1` z aktualnego buildu ✅ (pierwszy snapshot) |
| C2 | Przenieść PLAYTEST-* z root → `gra-robocza/` (bramka już tam publikuje) |
| C3 | Root: redirecty zamiast duplikatów bundle (opcjonalnie zostawić PLAYTEST w root przez 1 sprint — deprecacja) |
| C4 | Zaktualizować `INTEGRATOR-kolejka.md` md5 → ścieżki `gra-robocza/` |

### Faza D — egzekucja w czatach ⬜

| # | Kto | Reguła |
|---|-----|--------|
| D1 | A–E | Graj/testuj: **`gra-robocza/START.html`** · **ZAKAZ** `gra-kanon/` |
| D2 | F | Po bramce: **`publish-robocza-snapshot.ps1`** · meldunek md5 z `gra-robocza/` |
| D3 | Master | Po teście: **`publish-kanon-snapshot.ps1`** · jedyny editor finalnej |
| D4 | Maciej | Finalna: **`gra-kanon/START.html`** · robocza: **`gra-robocza/START.html`** |

### Faza E — weryfikacja ⬜

- [ ] F build nie dotyka `gra-kanon/`
- [ ] md5 `gra-robocza/Gra-podglad.html` ≠ `gra-kanon/` dopóki Master nie promuje
- [ ] Kopia dzienna istnieje w `gra-robocza-kopia/dzien_<data>/`
- [ ] Master `start` uruchamia backup grywalnej (max 1×/dzień)

---

## Backup dzienny (start pracy)

```powershell
cd gra
.\tools\backup-grywalna-dzien.ps1
```

- Kopiuje **`gra-robocza/`** → **`gra-robocza-kopia/dzien_YYYY-MM-DD/`**
- Max **1 kopia na dzień** (sprawdza marker w `ROBOCZA-MANIFEST.json` / plik `.last-backup-date`)
- Master uruchamia przy **`start`** w hubie (przed skanem inbox)
- Pełny backup projektu (osobno): `tools/backup-civ-daily.ps1`

---

## Bezpieczna promocja (Master)

1. Weryfikacja F (md5, bramka, scope)
2. Checklist / test scope batchu w **`gra-robocza/`**
3. `publish-kanon-snapshot.ps1`:
   - archiwum bieżącego `gra-kanon/` → `gra-kanon-archiwum/`
   - kopia **`gra-robocza/`** → **`gra-kanon/`** (+ manifest, START.html)
   - opcjonalnie sync root `Gra-podglad.html` (legacy — Faza C deprecacja)

---

## Ryzyka i mitigacja

| Ryzyko | Mitigacja |
|--------|-----------|
| Lane nadal otwiera root HTML | Redirect + komunikat w `DYSPOZYCJA-GRUPA-*.md` |
| OneDrive dehydratacja | `gra/` always on device · build do `$env:TEMP` |
| Dwa md5 w dokumentach | Źródło: `gra-robocza/ROBOCZA-MANIFEST.json` + `gra-kanon/KANON-MANIFEST.json` |
| Promocja bez testu | Master krok ③ obowiązkowy przed `publish-kanon` |

---

## Następny krok (Master po akceptacji planu)

1. Uruchomić **B1+B2** (skrypty) — ✅ w tym commicie docs
2. **C1:** `publish-robocza-snapshot` z obecnego stanu
3. Komunikat do czatów A–F: nowe ścieżki START

*Ostatnia aktualizacja: 2026-07-01*

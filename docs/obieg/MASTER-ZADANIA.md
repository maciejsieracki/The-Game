# Master Orkiestrator — zadania (hub)

> **Obowiązkowe na każdy `start` / tick auto-watch.** Maciej nie musi prosić o delegację — Master wykonuje pętlę sam.
> **Dwie wersje gry:** [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md) · **Auto-dispatch:** [`MASTER-START-AUTO.md`](MASTER-START-AUTO.md)

---

## Rola Mastera — trzy kroki (Maciej, kanon)

```
① PRZEKAŻ DO F     — dyspozycja + uruchom Integratora (Task / czat F)
② SPRAWDŹ F        — meldunek GOTOWE-ROBOCZA · md5 · bramka · scope
③ GRYWALNA CZĘŚĆ  — review (zamiast Opus) → APPROVE → publish-kanon-snapshot.ps1
                      → gra-kanon/ (+ legacy root Gra-podglad.html)
```

**Master nie wpina `main.ts`.** Kroki ①②③ = **dyspozycja F · weryfikacja meldunku F · promocja kanonu** — **nie** wdrożenie kodu u Mastera.

> **Maciej 2026-07-04:** wdrożenia z grup A–E → **Integrator F** (build + robocza) → odsyła `GOTOWE-ROBOCZA` → Master review + kanon.

---

## ZAKAZ Master — czego NIE robi (hub)

| ❌ Master NIE | ✅ Zamiast tego |
|---------------|-----------------|
| `vite build` · `publish-robocza-snapshot.ps1` | Dyspozycja **Integrator F** |
| Edycja `gra/src/**` · integracja batchu lane | Handoff `MASTER-do-INTEGRATOR_<batch>.md` |
| Uruchamianie testów integracyjnych „za F" | Czeka `F-do-MASTER*` · weryfikuje wpis + md5 |
| Promocja kanon **przed** `GOTOWE-ROBOCZA` od F | Najpierw F → potem `publish-kanon-snapshot.ps1` |

**Wyjątek:** sam review (checklist plików) + promocja HTML kanon po meldunku F.

---

## Zasada kanon (2026-07-01): **dyspozycja → wykonanie**

```
Krok 1  PRZYJMIJ dyspozycję  (ACK · plik · kolejka · DZIENNIK)
Krok 2  WYKONAJ              (w tej samej turze — bez „czeka u F/Master”)
```

| Przyjąłeś… | Krok 2 = wykonaj |
|------------|------------------|
| Meldunek lane `→ MASTER: GOTOWE` | Dyspozycja F **+ uruchom F** (Task subagent / czat F) |
| Meldunek F `→ MASTER: GOTOWE-ROBOCZA` | **Krok ②** weryfikacja · **Krok ③** review + promocja do `gra-kanon/` |
| Batch w kolejce (P0, P1…) | **Nie** zostawiaj samego wpisu w `INTEGRATOR-kolejka.md` |

**Zakaz:** kończyć turę samym raportem „co czeka” bez kroku 2.  
**Wyjątek:** blokada techniczna / brak Node / wymagana decyzja ABC Macieja — wtedy `→ MASTER: BLOK` + opis.

---

## Pętla Mastera (kolejność)

```
1. SKAN     — meldunki lane (*-DO-MASTERA, _handoff/*MASTER*, watch tick)
2. ACK      — handoff + MASTER-WATCH + DZIENNIK
3. DYSPOZYCJA F — MASTER-do-INTEGRATOR_*.md + INTEGRATOR-kolejka.md (P0…Pn)
4. WERYFIKACJA F — czy F wykonał (patrz § poniżej)
5. REVIEW   — subagent readonly na ROBOCZA (APPROVE / BLOCK)
6. PROMOCJA — tylko po APPROVE: gra-robocza/ → gra-kanon/ (§ kanon)
7. MACIEJ    — opcjonalny playtest finalnej + BUG → grupa źródłowa
```

**Przy `start` (przed skanem):** `cd gra` → `.\tools\backup-grywalna-dzien.ps1` (kopia dzienna grywalnej roboczej, max 1×/dzień).

**Zakaz:** status „czeka Master” / „czeka u F” bez **kroku 2** w tej samej turze (patrz § dyspozycja → wykonanie).

---

## 1–3. Po wykryciu „do wpięcia”

| Sygnał | Akcja Master (natychmiast) |
|--------|----------------------------|
| `→ MASTER: GOTOWE` w handoff / `*-DO-MASTERA` | Krok 1: ACK · dyspozycja · kolejka · **Krok 2: uruchom F** |
| Kod lane gotowy, brak blokera ABC | Ten sam batch — **nie** czekaj na Macieja |
| Kolejka F zajęta (batch w trakcie) | Przygotuj dyspozycję P+1 (status „czeka po Pn”) |

**F dostaje:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_<batch>.md` + priorytet w `INTEGRATOR-kolejka.md`.

**Master uruchamia F:** Task subagent `composer-2.5-fast` (batch w hubie) **albo** Maciej `działaj` w czacie Grupa F — sam plik dyspozycji **nie wpina** kodu.

**F NIE publikuje finalnej** — tylko **`gra-robocza/`** (po bramce: `publish-robocza-snapshot.ps1`). Root `Gra-podglad-ROBOCZA.html` = legacy.

---

## 4. Weryfikacja wykonania F

Master **sprawdza pliki**, nie pyta Macieja „czy F skończył”.

| Check | Gdzie | OK gdy |
|-------|-------|--------|
| Flaga meldunku | `dyspozycje/SILNIK-DO-MASTERA.md` | `→ MASTER: GOTOWE-ROBOCZA` |
| md5 roboczej | meldunek F + `gra-robocza/ROBOCZA-MANIFEST.json` | zgodne · ≠ poprzedni batch |
| Bramka | wpis F | testy PASS (logic, smoke, suite batchu) |
| Scope | handoff lane | tylko deklarowany diff — bez cudzych plików |
| Finalna nietknięta | `gra-kanon/KANON-MANIFEST.json` md5 | **bez zmian** dopóki Master nie promuje |

**FAIL / BLOK:** dyspozycja do **grupy źródłowej** (nie „dopnij w F” bez kontekstu lane).

**PASS:** przejdź do review subagent (§5).

---

## 5–6. Review → promocja kanonu

> **2026-07-04 Maciej:** **Opus wycofany.** Review = **Master w hubie** (weryfikacja scope + bramka + checklist) → **APPROVE** → `publish-kanon-snapshot.ps1`. Opcjonalny subagent readonly — nie wymagany osobny czat Opus.

| Etap | Kto | Artefakt |
|------|-----|----------|
| Test / integracja | **Grupa F** lub **lane bez main.ts** | **`gra-robocza/`** · PLAYTEST-* |
| Review | **Master (hub)** | checklist batchu · APPROVE / BLOCK |
| **Finalna gra** | **Master** | **`gra-kanon/`** |

**Promocja (tylko Master, po APPROVE):**

```powershell
cd gra
.\tools\publish-kanon-snapshot.ps1
```

Efekt: archiwum poprzedniego `gra-kanon/` → `gra-kanon-archiwum/` · kopia **`gra-robocza/`** → **`gra-kanon/`** · `KANON-MANIFEST.json` · opcjonalnie sync root `Gra-podglad.html`.

**Maciej gra na finalnej:** `gra-kanon/START.html` · testy deweloperskie: **`gra-robocza/START.html`** / PLAYTEST-*.

---

## Flagi (słownik)

| Flaga od F | Master robi |
|------------|-------------|
| `→ MASTER: GOTOWE-ROBOCZA` | §4 weryfikacja → §5 review |
| `→ MASTER: BLOK` | eskalacja / dyspozycja lane |

| Flaga od lane | Master robi |
|---------------|-------------|
| `→ MASTER: GOTOWE` | §1–3 ACK + dyspozycja F |

**Nie używać:** `→ MASTER: GOTOWE-KANON` od F — kanon publikuje **Master** po review.

---

## Pliki statusu (czytaj co tick)

| Plik | Po co |
|------|--------|
| `docs/obieg/MASTER-WATCH.md` | stan orkiestracji |
| `docs/obieg/INTEGRATOR-kolejka.md` | kolejka F · md5 ROBOCZA vs kanon |
| `dyspozycje/SILNIK-DO-MASTERA.md` | meldunki F |
| `docs/master/MASTER-INBOX-WATCH.json` | stan watch |

---

*Ostatnia aktualizacja: 2026-07-01 · przywrócenie dwóch wersji (Maciej)*

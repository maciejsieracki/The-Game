# Master Silnik — procedury operacyjne

> **Hub:** `docs/master/README.md` · **Role (2026-06-30):** [`docs/obieg/ROLE-2026-06-30.md`](../../obieg/ROLE-2026-06-30.md)
> **Status bieżący:** [`docs/obieg/MASTER-WATCH.md`](../../obieg/MASTER-WATCH.md)
> **Master Orkiestrator** = plan + weryfikacja + dyspozycje — **NIE kod**, **NIE `main.ts`**
> **Grupa F** (osobny czat) = `main.ts` + bramka + build

**Powiązane:** `docs/CZAT-TEMATYCZNY-PROTOKOL.md` · `docs/czaty/README.md` · `docs/decyzje/README.md` · `dyspozycje/DZIENNIK-MASTERA.md`

---

## Model (warstwy)

```
Maciej
  ├─► Grupy A–E: ABC + lane (Composer) — BEZ main.ts
  ├─► Grupa F: main.ts + bramka + Gra-podglad-ROBOCZA.html → GOTOWE-ROBOCZA
  └─► Master SILNIK (GLM 5.2)
         czaty → Opus 4.8 → Gra-podglad.html (finalna, po APPROVE)
```

| Rola | Model | Robi |
|------|-------|------|
| **Grupa F** | Composer 2.5 | `main.ts`, bramka, **ROBOCZA** |
| **Master Silnik** | GLM 5.2 | Opus, **finalna** po APPROVE |
| **Opus** | 4.8 Ask | Review przed kanonem |

---

## Komendy Macieja (ten czat)

| Komenda | Efekt |
|---------|--------|
| `status` | `docs/decyzje/STATUS.md` + skrót wątków |
| `weryfikuj` | Procedura poniżej |
| `weryfikuj <ID>` | Tylko temat np. A2, B2, C2 |
| `pytania <ID>` | Otwarte wpisy w `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md` |
| **`czaty`** | Czytaj `docs/czaty/DO-MASTERA.md` + `*-DO-MASTERA.md` → raport Maciejowi |
| `wpięcie <temat>` | Dyspozycja w `OD-MASTERA.md` § **Grupa F** |
| `test` / `bramka` | Zleć **Grupie F** |

**Czat tematyczny po ABC:** KROK A–G w `docs/decyzje/DYSPOZYCJA-STALA.md`.

| Gdzie | Komenda | Plik |
|-------|---------|------|
| Grupa A–F | `master` | `docs/czaty/OD-MASTERA.md` |
| Master Silnik | `czaty` | `docs/czaty/DO-MASTERA.md` |

Pierwsze uruchomienie: `docs/czaty/PIERWSZE-URUCHOMIENIE-KOMENDY.md`

---

## Procedura `weryfikuj` (OBOWIĄZKOWA — read-only)

Master **nie edytuje kodu**. Po `→ MASTER: GOTOWE-ROBOCZA` od Grupy F:

### Checklist weryfikacji (6 kroków) + review subagent

| # | Co | Jak |
|---|-----|-----|
| 1–5 | Handoff AC · bramka testów · md5 zgodny z dyskiem · scope batcha · brak regresji cross-lane | read-only + `Get-FileHash` + `node tools/*-test.cjs` |
| 6 | **Review subagent** | Master wywołuje subagenta **readonly** (polski): handoff AC + wyniki testów → **APPROVE** / **BLOCK** |
| 7 | **Werdykt** | APPROVE → ACK `MASTER-WATCH` + Slack `#master` · BLOCK → lane źródłowa |

**Opus wycofany** — nie otwieraj osobnego czatu review.

### Krok 1 — Czytaj raporty (kolejność)

1. `docs/decyzje/STATUS.md`
2. `docs/decyzje/<ID>-*.md`
3. `dyspozycje/<LANE>-DO-MASTERA.md` (ostatnie 3 wpisy)
4. `dyspozycje/_handoff/*`
5. `dyspozycje/DZIENNIK-MASTERA.md`

### Krok 2 — Spójność

- Decyzja w `docs/decyzje/` = `*-DO-MASTERA.md`
- Lane nie edytuje `main.ts` (wpięcie = Grupa F)
- `→ SILNIK:` ma sens

### Krok 3 — Bramka (u Macieja)

```powershell
cd gra; .\tools\bramka-test-publish.ps1
```

### Krok 4 — Werdykt w czacie Master

### Krok 5 — Po APPROVE + GOTOWE-ROBOCZA

1. ACK w `MASTER-WATCH.md` + linia `DZIENNIK-MASTERA.md` + Slack `#master`
2. Kanon `Gra-podglad.html` — publikuje **Grupa F** (md5 w `INTEGRATOR-kolejka.md`)
3. Opcjonalny playtest Macieja w hubie

**Master NIE wpięwa `main.ts`.** Review = subagent readonly (krok 6), **nie Opus**.

---

## Obowiązki Master Orkiestrator (hub)

1. Czytać meldunki F (`SILNIK-DO-MASTERA.md`) i pliki obiegu grup
2. Utrzymywać `MASTER-WATCH.md`, wpisy `DZIENNIK-MASTERA.md`
3. **Review subagent** → APPROVE/BLOCK → ACK (bez Opus)
4. Routować dyspozycje do F i grup; **nie** edytować kodu

---

## Source of truth

| Plik | Kto pisze |
|------|-----------|
| `docs/decyzje/<ID>.md` | Czat tematyczny |
| `docs/obieg/MASTER-WATCH.md` | Master Orkiestrator |
| `dyspozycje/DZIENNIK-MASTERA.md` | Master Orkiestrator |
| `gra/src/main.ts` | **Grupa F only** |

---

*2026-06-27 · Hub: `docs/master/`*

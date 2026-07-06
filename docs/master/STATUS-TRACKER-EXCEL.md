# Tracker zadań — Excel (całość gry + grupy)

> **Plik:** `Status-projektu-The-Game.xlsx` (root projektu Civ)

Ten sam plik co przy Claude Code — **dwa poziomy** w jednym workbooku.

---

## Warstwa 1 — CAŁOŚĆ GRY (postęp projektu)

Tak jak wcześniej u Mastera: **każdy element gry** w jednej tabeli — wykonane albo do zrobienia.

| Arkusz | Co pokazuje |
|--------|-------------|
| **Status wg grup** | **Główna lista** (~55 wierszy): A=walka, B=mapa, C=ekonomia, D=AI, E=cywilizacje, F=UI, G=save, H=infra, I=M7 |
| **POSTEP-%** | Procenty per grupa A–F + integracja silnika + grywalność v0.1 / v1.0 |
| **Podsumowanie** | Statystyki: ile Zrobione / Częściowo / Niezrobione + % per grupa |
| **Civ-SILNIK** | Kroki integracji `main.ts` (historia lane) |
| **Civ-MAPA** | Kroki mapy (Grupa A) |

### Statusy (warstwa 1)

| Status | Znaczenie | Kolor |
|--------|-----------|-------|
| **Zrobione** | W grze / zamknięte | zielony |
| **Czesciowo** | Część w kodzie, coś jeszcze wisi | żółty |
| **Niezrobione** | Nie podjęte lub daleko | czerwony |
| **Gotowe, niewpiete** | Moduł gotowy, czeka F (rzadko) | jasnożółty |

**Analiza postępu:** otwórz **Podsumowanie** (liczby) albo filtruj **Status wg grup** po kolumnie Status.

---

## Warstwa 2 — OPERACYJNA (grupy A–F, sprint)

Bieżące zadania do „popchnięcia” grup — kto co robi **teraz**.

| Arkusz | Kto uzupełnia |
|--------|----------------|
| **Dashboard** | Master (skrypt) — P0/P1 |
| **Grupa-A** … **Grupa-F** | **Każda grupa** — własne zadania na bieżąco |
| **Master-Silnik** | Opus, kanon, routing |
| **Otwarte-ABC** | Pytania do Macieja |

Statusy operacyjne: `NIE ROZPOCZĘTE` · `W TOKU` · `GOTOWE` · `→ SILNIK` · `ZAMKNIĘTE` · `CZEKA ABC` · `BLOK`

Stare arkusze (`Civ-EKONOMIA`, `Taski`, …) = archiwum lane — **nie kasuj**.

---

## Odświeżanie (Master)

```powershell
python gra/tools/sync-status-tracker-xlsx.py
```

Skrypt:
1. Aktualizuje **Status wg grup**, **POSTEP-%**, **Podsumowanie**, **Civ-SILNIK/MAPA** z `gra/tools/game-scope-data.py`
2. Aktualizuje **Dashboard** + **Grupa-A…F** + **Master-Silnik** + **Otwarte-ABC**
3. Robi backup `.bak-tracker-YYYY-MM-DD`

Źródło danych całości gry: `gra/tools/game-scope-data.py` (Master edytuje po audycie / playteście).

---

## Workflow grupy

1. Przy `master` — przeczytaj **Grupa-X** (sprint) + zajrzyj w **Status wg grup** (swój obszar).
2. Po zadaniu: zmień **Status** + **Data** w arkuszu Grupa-X.
3. Jeśli zamykasz element całości gry — dopisz Masterowi; Master zaktualizuje `game-scope-data.py` przy sync.

---

## Maciej — szybki podgląd

| Pytanie | Gdzie patrzeć |
|---------|----------------|
| Ile % gry mamy? | **POSTEP-%** → wiersz „REALNA grywalnosc v0.1” / „Do v1.0” |
| Co jeszcze nie zrobione? | **Status wg grup** → filtr Status = Niezrobione |
| Co blokuje teraz? | **Dashboard** + **Otwarte-ABC** |
| Kto ma wiszące zadania? | **Grupa-A…F** → filtr NIE ROZPOCZĘTE / W TOKU |

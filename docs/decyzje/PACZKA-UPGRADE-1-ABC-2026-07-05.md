# Paczka 1/3 — UPGRADE budynków (UPG-LOC, UPG-UI, ABC-21)

> **Data:** 2026-07-05 · **Status:** 🔵 **DECYZJA ZAMKNIĘTA**

## Odpowiedzi Macieja

| ID | Decyzja | Uwagi Macieja |
|----|---------|---------------|
| **UPG-LOC** | **A** | Łańcuch **3 stopni w 1 slocie** + **informacja o poprzednich budynkach** (bonusy się **łączą** / suma w JSON) |
| **UPG-UI** | **B** | Po upgrade: **nowy budynek** + mała ikona **↗ upgrade** |
| **ABC-21** | **B** | **Akademia + Teatr = jeden budynek** (merge, zsumowane staty) |

## Kanon wdrożenia (skrót)

### UPG-LOC A + uwaga
- Jeden slot miasta = ścieżka max **3 poziomy** (np. Koszary → Akademia wojskowa → …).
- Po upgrade stary `id` znika z `builtIds`, **nowy** zajmuje slot.
- UI **musi pokazać skład upgrade'u** — gracz widzi, że bonusy = **suma** poprzednich poziomów (zgodnie z JSON).

### UPG-UI B
- Sekcja „Zbudowane”: np. **„Akademia”** + ikona **↗** (tooltip: „Rozbudowano z Biblioteki · bonusy łączone”).

### ABC-21 B
- **Jeden** budynek kultury/nauki z Filozofii zamiast osobnej Biblioteki→Akademia + Teatr.
- Lane **CYWILIZACJE:** merge wpisów JSON, `upgradeFrom: biblioteka`, staty = suma Biblioteka+Akademia+Teatr (po balansie Panel-B).
- **Teatr osobno — NIE** w v1.0 po tej decyzji.

## Następna paczka

**2/3:** ABC-20 (Port wielki), ABC-22 (Mury/Cytadela), ABC-23 (Drogi brukowane prereq)

## Powiązane

- `ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md`
- `MASTER-do-UI_kult-upgrade-lista-2026-07-04.md` (superseded częściowo przez UPG-UI B)

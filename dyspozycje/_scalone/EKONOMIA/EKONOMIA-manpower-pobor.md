# EKONOMIA — Kanon: Ludność, Rekruci (Manpower), Pobór we Wpływie

**Status:** KANON (Maciej 2026-06-26) · **WPIĘTE** w silnik + HUD mapy

## Słownik UI

| Termin w grze | W kodzie | Znaczenie |
|---------------|----------|-----------|
| **ludki** | `city.population` | Poziom miasta 1–10 (bez zmian) |
| **ludność** | `ludnoscAbsolutna` | Ludzie w imperium (`ludki × ludekNaLudka[epoka]`) |
| **rekruci** | `manpower` / `rekruci` | Pula poboru wojskowego (max ≈ 10% ludności abs.) |

## Wpływ (Potęga) — wagi składników (Maciej 2026-06-26)

| Składnik | Waga |
|----------|------|
| Wielkość armii | 24% |
| Wygrane bitwy | 17% |
| **Ludność** | **15%** |
| **Rekruci** | **15%** |
| Miasta / terytorium | 12% |
| Gospodarka | 10% |
| Epoka | 7% |

Normalizacja osobno: ludność abs. vs max na mapie; rekruci bieżący vs max na mapie.

## Model liczbowy

| Wielkość | Wzór |
|----------|------|
| Ludność absolutna | `ludki × ludekNaLudka[epoka]` |
| Rekruci max | `ludki × manpowerNaLudka[epoka]` |
| Koszt 1 jednostki | `manpowerNaJednostke[epoka]` (= 10% slotu rekrutów) |
| Odnowa co turę | **+10% max** (globalnie); × mnożnik cywilizacji |
| Oblężenie | brak regen gdy `city.oblegane` |

**Przykład ep. 1, 10 ludków:** 100 000 ludzi · max 10 000 rekrutów · werb −100 · regen +1 000/t (× cyw).

## Różnicowanie nacji (bonus_pobor_regen)

W `civs.json` → `bonusy[]`:

```json
{
  "typ": "bonus_pobor_regen",
  "cel": "rekruci",
  "wartosc": 0.35,
  "opis": "...",
  "realizuje": "ekonomia"
}
```

- `wartosc` = delta względem 1.0 (np. +0.35 → regen ×1.35).
- **Rzymianie:** +35% (szybciej niż standard).
- **Grecy:** −15% (wolniej niż standard).
- Inne cywilizacje: brak bonusu → ×1.0.

API: `civManpowerRegenMult(bonusy)` w `manpower.ts`.

## Wpływ (Potęga) — składniki Ludność + Rekruci

Osobne sloty w `PotegaKomponenty` (po decyzji Macieja 2026-06-26):

- **ludnosc** 15% — ludność absolutna imperium
- **rekruci** 15% — bieżąca pula Manpower

Pozostałe 70%: armia 24, bitwy 17, miasta 12, gospodarka 10, epoka 7.

## HUD mapy strategicznej

Środek paska (obok ⚜ Wpływ): **`X rekruci`** — suma puli imperium gracza (`formatManpower`).

## Pliki

| Plik | Rola |
|------|------|
| `gra/data/epoka-ludnosc-manpower.json` | Tabela 10 epok |
| `gra/data/miasto-params.json` | `manpower_regen_proc_max_tura` (=10) |
| `gra/data/civs.json` | `bonus_pobor_regen` per cyw |
| `gra/src/game/manpower.ts` | API + regen + empirePoborTotals + **uzupełnianie HP (Faza 3)** |
| `gra/src/game/power.ts` | Normalizacja Poboru do Wpływu |
| `gra/src/game/turn-economy.ts` | Regen co turę × cyw + **tickManpowerUnitReplenishment** |
| `gra/src/main.ts` | Snapshoty potęgi + HUD |
| `gra/src/ui/hud.ts` | Wyświetlanie rekrutów |
| `gra/tools/manpower-test.cjs` | Testy regresji |

## Faza 3 — uzupełnianie HP jednostek (Maciej 2026-07)

Co koniec tury, **po odnowie puli Manpower** (`tickManpowerRegen`):

| Trudność | % max HP / turę |
|----------|-----------------|
| Łatwy | 25% |
| Normalny | 20% |
| Trudny | 15% |

- Dotyczy **wszystkich właścicieli** (gracz + AI).
- Koszt MP: `ceil(healHp / maxHp × kosztJednostki[epoka])`; przy braku puli — leczenie częściowe.
- Jednostki cywilne pomijane. HP **nigdy nie spada** od tego mechanizmu (bitwa osobno).
- Parametr: `miasto-params.json` → `manpower_uzupelnienie_hp_proc_max_tura`.
- API: `tickManpowerUnitReplenishment()` w `manpower.ts`, wołane z `advanceCityEconomy()`.
- **Wdrożone:** FALA 31 ROBOCZA md5 `f694dcba` (commit `53b9901`, 2026-07-27). Test: `manpower-test.cjs` **62/62**.

## Test

```bash
cd gra && node tools/manpower-test.cjs
```

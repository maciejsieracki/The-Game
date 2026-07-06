# Grupa A → Grupa B (Miasto i ekonomia): wytyczne wyliczania Potęgi (Power)

**Status:** **→ Grupa B: GOTOWE** · **Decyzja Macieja:** B-Power-Q1/Q2/Q3 (2026-06-27)  
**Powiązane:** `docs/decyzje/A1-Power-HUD-centrum.md` · `gra/src/game/diplomacy.ts` (`computePotegaNacji`)

---

## Decyzja Macieja (skrót)

| Kto | Rola |
|-----|------|
| **Grupa A** (mapa / HUD) | **Tylko wyświetlenie** — liczba Power na pasku + overlay po kliku (składniki, ranking demo) |
| **Grupa B** (Miasto i ekonomia) | **Wytyczne i wyliczanie** składników Potęgi z domeny miasta/ekonomii + **kontrakt API** dla silnika |
| **Grupa D** (dyplomacja) | **Konsument** — Respekt i negocjacje oparte na Power (już `computeRespekt` w `diplomacy.ts`) |

Maciej: *„Wyliczanie potęgi — dyspozycja do Miasto i ekonomia. Ty [Grupa A] masz tylko wyświetlić moc; wpływa głównie na dyplomację (Grupa D)."*

---

## Co Grupa B ma dostarczyć

### 1. Spec wyliczania ( dokument )

Plik docelowy (propozycja): **`docs/decyzje/B-power-składniki.md`** lub sekcja w `docs/grupa-b/PANEL-B-SPEC.md`.

Dla każdego składnika Power, za który odpowiada **miasto/ekonomia**:

| Klucz | Waga (kanon) | Pytanie do B |
|-------|--------------|--------------|
| `ludnosc` | 18% | Skąd liczba? Suma populacji miast gracza? Normalizacja vs max na mapie / vs epoka? |
| `miasta` | 14% | Liczba miast? Terytorium (heksy)? Waga stolicy? |
| `gospodarka` | 12% | Które wielkości? (Pieniądz/t, Praca, skarbiec, PN?) — jedna czy mix? |

**Pozostałe składniki** (informacyjnie — **nie** lane B, ale B musi wiedzieć w kontrakcie):

| Klucz | Waga | Lane |
|-------|------|------|
| `wielkoscArmii` | 28% | UNITS |
| `wygraneBitwy` | 20% | UNITS |
| `epoka` | 8% | SILNIK / tech |

Grupa B **nie koduje** armii — ale spec Power powinien opisać **pełną sumę** i wskazać, skąd silnik bierze każdy input.

### 2. Kontrakt API (TypeScript)

Propozycja funkcji lane EKONOMIA/MIASTO:

```ts
/** Składniki 0..1 znormalizowane — tylko domena miasto/ekonomia. */
export interface PowerContributionsCityEconomy {
  ludnosc: number;
  miasta: number;
  gospodarka: number;
}

export function computePowerContributionsCityEconomy(
  ctx: /* GameSnapshot lub minimalny stan imperium */
): PowerContributionsCityEconomy;
```

Silnik (Grupa F) scala z UNITS + epoka → `computePotegaNacji()` → **jedna liczba 0–100** dla HUD i dyplomacji.

### 3. Dane do overlay HUD (Grupa A)

Grupa A overlay potrzebuje **6 wartości** (procent składnika × waga) do paska w mockupie. Grupa B dostarcza:

- nazwy PL składników (jak mockup),
- czy wartości **surowe** czy tylko **znormalizowane** pokazywać graczowi,
- częstotliwość przeliczenia (co turę / po każdej zmianie miasta).

---

## Czego Grupa B NIE robi

- **Nie** edytuje `gra/src/ui/hud.ts` ani mockupów HTML (Grupa A).
- **Nie** zmienia panelu dyplomacji (Grupa D) — tylko stabilny kontrakt Power.
- **Nie** decyduje o wagach % bez ABC Macieja — dziś kanon: `diplomacy.json` → `respekt_-_czynniki`.

---

## Grupa D — informacja (bez zadania w tym handoffie)

Power imperium → **Respekt** per nacja:

```
Respekt(my, X) ≈ 100 × Power_my / (Power_my + Power_X)
```

Zmiana wzoru składników przez B **musi** być spójna z `gra/src/game/diplomacy.ts` i `Civ-CYWILIZACJE/SPEC-Respekt.md`. Grupa D weryfikuje progi AI po dostarczeniu spec B.

Handoff informacyjny: **`A1-do-GRUPA-D_power-respekt.md`** (opcjonalnie — ten plik wystarczy jako § Grupa D).

---

## DoD (Grupa B)

- [x] Dokument wytycznych: `docs/decyzje/B-power-skladniki.md`
- [x] Kontrakt TS: `gra/src/game/power.ts` — handoff zbiorczy § F-B-power
- [x] Wpis w `docs/czaty/DO-MASTERA.md` § Grupa B
- [x] Brak zmian w UI mapy / mockupach

**Flaga:** **→ Grupa B: GOTOWE** → SILNIK batch F-B-power

---

*Źródło decyzji: Maciej, czat Grupa A, 2026-06-27 · A1-Q15=A*

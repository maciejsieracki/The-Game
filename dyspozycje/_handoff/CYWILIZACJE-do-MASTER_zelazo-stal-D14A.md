# CYWILIZACJE → MASTER (dla MAPA + EKONOMIA): weryfikacja surowców Żelazo/Stal — D14=A

**Data:** 2026-06-26 · **Decyzja Macieja:** D14=A · **Lane weryfikujący:** CYWILIZACJE

## Co zweryfikowano (CYWILIZACJE / dane)

### resources.json — OK

| Surowiec | Typ | Odblokowanie | Klucz ASCII (terrain _meta) |
|---|---|---|---|
| Żelazo | surowy | tech Obróbka żelaza + Kuźnia żelaza | `zelazo` |
| Stal | przetworzony | tech Hutnictwo żelaza + Wielka Kuźnia | `stal` |

Wpisy dodane przez EKONOMIA (2026-06-26). Model dostępu v0.1 = boolean (złoże w zasięgu + ulepszenie/budynek).

### terrain-improvements.json — CZĘŚCIOWO

- `_meta.klucze_surowcow_ASCII` zawiera `zelazo | stal` ✅
- Brak dedykowanego ulepszenia terenu „Kopalnia żelaza" / `surowiecOdblokowany: "zelazo"` — dostęp żelaza planowany przez **budynek Kuźnia żelaza** + złoże (EKONOMIA model boolean).

### MAPA / generator — **LUKA (wymaga MAPA)**

`gra/src/map/gen-helpers.ts` → `DEPOSIT_RULES` rozmieszcza tylko:

- `ruda` (Wzgórza/Góry)
- `glina`, `konie`, `wegiel`

**Brak reguły złoża `zelazo` / „Ruda żelaza"** na mapie. Bez tego tech Obróbka żelaza nie ma skąd brać surowca mimo wpisu w resources.json.

Stal **nie wymaga** złoża mapowego (przetworzony: Wielka Kuźnia + żelazo + paliwo).

## Co MASTER ma zrobić (routing)

### → MAPA (priorytet)

1. Dodać regułę złoża **żelazo** w `DEPOSIT_RULES` (propozycja: Wzgórza/Góry, rzadsze niż `ruda`, lub osobna nakładka `ZlozeZelaza` jeśli enum istnieje).
2. Zaktualizować `clusters.ts` `ROSTER_KLUCZE`: `'sumerowie'` → `'babilon'` (ripple RDY-09 z civs.json).
3. `computeAccessibleResources` — klucz `zelazo` gdy złoże + Kuźnia żelaza w zasięgu (kontrakt MAPA-do-MASTER_dostepne-surowce.md).

### → EKONOMIA (potwierdzenie)

- Kuźnia żelaza / Wielka Kuźnia w `buildings.json` — już z `wymaganySurowiec: zelazo/stal`. Bez zmian po stronie CYWILIZACJE.

## DoD

- [ ] Na mapie testowej (seed znany) występują heksy ze złożem żelaza.
- [ ] Po tech Obróbka żelaza + Kuźnia gracz widzi dostęp do surowca Żelazo (boolean).
- [ ] Stal dostępna po Hutnictwo + Wielka Kuźnia (bez złoża mapowego).

## Status

**CZEKA NA MAPA** (złoża żelaza). resources.json = GOTOWE. Handoff flag: **GOTOWE** (weryfikacja CYWILIZACJE) / **CZEKA** (implementacja MAPA).

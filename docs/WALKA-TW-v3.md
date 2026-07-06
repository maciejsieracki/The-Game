# Walka TW v3 — nomenklatura i reguły (kanon projektowy)

**Decyzja Maciej** · Excel → JSON → walka (jeden kontrakt)  
**Model trafienia:** **A1** (Atak/Obrona = hit%, Obrażenia/Przebicie/Pancerz = dmg)  
**Wzór hit%:** **Total War: Rome 2**

---

## Nomenklatura (EN w danych · PL w UI)

| Pole JSON (EN) | PL (UI / Excel) | Rola |
|---|---|---|
| `meleeAttack` | **Atak** | trafienie wręcz (+1% / pkt) |
| `meleeDefence` | **Obrona** | obrona przed trafieniem (−1% / pkt dla wroga) |
| `weaponDamage` | **Obrażenia** | dmg broni **1:1 w walce** |
| `armor` | **Pancerz** | redukcja dmg |
| `piercing` | **Przebicie** | dmg po redukcji pancerzem |
| `chargeBonus` | **Szarża** | bonus rundy 1 (hit + dmg), tylko atakujący |
| `health` | **Zdrowie** | HP |
| `missileAttack` | Atak dystansowy | faza pocisków / vs jednostki |
| `wallAttack` | Atak vs Mur / brama | **tylko oblężnicze** — dmg w mur; **M_siege** (nie pole) |
| `morale` | Morale | ucieczka |

### Skróty (tabele / Excel / rozmowy)

| Skrót | Pełna nazwa | Pole EN |
|-------|-------------|---------|
| **AP** | Atak | `meleeAttack` |
| **OBR** | Obrona | `meleeDefence` |
| **Obraż** | Obrażenia | `weaponDamage` |
| **Panc** | Pancerz | `armor` |
| **Przeb** | Przebicie | `piercing` |
| **Szarża** | Uderzenie | `chargeBonus` |
| **HP** | Zdrowie | `health` |
| **AD** | Atak dystansowy | `missileAttack` |

**Zakaz:** skali 0–100 w JSON, `dmg_scale`, `pancerz_divisor: 200`.

---

## Trafienie — Rome 2 (globalne stałe)

```
hit% = clamp( HIT_BASE + Atak − Obrona_wroga + bonusy,  HIT_MIN,  HIT_MAX )
```

| Stała | Wartość |
|---|---:|
| **HIT_BASE** | **40** |
| **HIT_MIN** | **15** |
| **HIT_MAX** | **75** |

- **1 pkt Ataku = +1%** szansy, **1 pkt Obrony = −1%** dla przeciwnika.
- **Baza 40 jest jedna dla całej gry** — nie per jednostka.
- **Bonusy** (szarża, flank/tył, vs typ, cyw…) dodawane do tego samego wzoru.
- **Postawa (Falanga / Włócznik):** brak bonusu szarży atakującego (runda 1 = zwarcie).
- **RNG:** los 1–100 ≤ hit% → trafienie (jak TW).

**Obrażenia (zwarcie) — roboczo, osobna decyzja:**
```
dmg = max(0, Obrażenia − Pancerz_wroga) + Przebicie + (bonus Szarży do dmg, r1)
```

**Kolejność tury:** atakujący → kontratak obrońcy → HP / morale.

---

## Przykład: Legion → Falanga (staty TW v3 robocze)

| | Atak | Obrona |
|---|---:|---:|
| Legion (atak) | 9 | 7 |
| Falanga (obrońca) | 5 | 10 |

```
hit% = clamp(40 + 9 − 10, 15, 75) = 39%
```

Szarża zanegowana → bez bonusu Szarży.

---

## Poza tym batch-em (osobno)

- Pre-bitwa, oblężenie, auto-werdykt składu
- Kalibracja statów w Excelu
- Implementacja w `combat.ts`

---

## Migracja ze starego JSON (2026-06-29)

**Hard input** = gotowe liczby w JSON/Excelu (silnik TW **nie** dzieli).

| Stary klucz PL | Nowy EN | Konwersja |
|---|---|---|
| Atak | `meleeAttack` | ÷10 → int |
| Obrona | `meleeDefence` | ÷10 → int |
| Obrażenia | `weaponDamage` | ÷10 → int |
| Pancerz | `armor` | ÷10 → int |
| Przebicie | `piercing` | ÷10 → int |
| Uderzenie | `chargeBonus` | ÷10 → int |
| Atak dystansowy | `missileAttack` | **1:1** → int (stary `rangeDamage` bez ÷10) |
| Health | `health` | ×0,25 → int |

Wyjątek playtest: Hastati `meleeAttack=8`, `weaponDamage=8`. Skrypt: `gra/tools/migrate-units-tw-v3.py --from-backup`.

**Super-jednostki (7×):** stary JSON miał **skalę TW** (Atak 8–10, Pancerz 6) — **NIE ÷10**. Overrides w skrypcie migracji. Obrażenia historycznie **0** w archiwum; decyzja Maciej 2026-06-30: **`weaponDamage=10`** dla wszystkich super. Handoff: `dyspozycje/_handoff/UNITS-do-SILNIK_EKSPORT-TW-v3-super-2026-06-30.md`.

---

## Moc intrinsic (podgląd — nie silnik walki)

Decyzja Maciej 2026-06-30: **M = A + O** (nie 10×A).

```
A = meleeAttack + weaponDamage + piercing + chargeBonus/2 + missileAttack/2
O = meleeDefence + armor + health/2
M = A + O
```

Skrypt: `gra/tools/intrinsic-unit-power.py`. Osobny temat: auto-walka na mapie.

**Auto-walka (propozycja):** suma M armii, zwycięzca = większa suma; straty zależne od stosunku R = M_winner/M_loser. Oblężnicze tylko przy oblężeniu. Patrz **`docs/AUTO-WALKA-MOC-ALGORYTM.md`** · symulator **`gra/tools/auto-battle-power.py`**.

---

## Migracja kodu (po decyzji dmg + staty)

1. Excel ↔ `units.json` (wartości TW v3 jak wyżej — bez dodatkowych skal w silniku)
2. `combat.ts`: hit Rome 2 + dmg TW v3, usunąć macierz ÷10
3. Pre-bitwa: **ten sam hit%** co walka (gdy dojdziemy do pre-bitwy)

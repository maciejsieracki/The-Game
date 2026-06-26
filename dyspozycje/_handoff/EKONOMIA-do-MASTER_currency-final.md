# HANDOFF: EKONOMIA -> MASTER — Waluta (Currency) — Model finalny

**Data:** 2026-06-25. Autor: EKONOMIA subagent.
**SUPERSEDUJE:** `EKONOMIA-do-MASTER_waluta-targowisko-x2.md` (poprzednia wersja z gate Targowisko+Waluta na mennicaMnoznik — model zmieniony).

---

## Model finalny (dwa efekty x2)

### Efekt 1 — Handel -> Pieniadz x2 (gate: tech Waluta; WSZYSTKIE miasta, automat)
- Po wynalezieniu **Waluty** caly `handelNetto` jest mnozony przez `walutaMnoznik` (domyslnie **x2**).
- Dziala na **cala pule Handlu PRZED podzialem** na Nauka/Pieniadz/Luksus.
  - Skutek: po Walucie nauka z handlu, Wealth z handlu i Pieniadz z handlu — wszystkie rosna x2.
- Dotyczy WSZYSTKICH miast gracza automatycznie po zbadaniu Waluty.
- Param: `waluta_mnoznik` w `econ-params.json["budynki"]` (easy/normal/hard = 2/2/2).

### Efekt 2 — Praca -> Pieniadz x2 (gate: Targowisko w miescie + Waluta; per-miasto, automat)
- Gdy **maTargowisko=true** i **walutaOdkryta=true**: pula-Praca (`doPuli`) konwertuje sie na Pieniadz.
- `doPuli` = Praca nie idaca na budynki = `floor(pracaNetto * (1 - procentBudynki/100))`.
- `pieniadzZPracy = floor(doPuli * targowiskoPracaMnoznik)` (mnoznik domyslnie 2).
- Wynik pojawia sie w `CityYieldResult.pieniadzZPracy` i `CityEconomyTick.pieniadzZPracy`.
- Gate SCISLY: Targowisko BEZ Waluty = 0; Waluta BEZ Targowiska = 0.
- Param: `targowisko_praca_na_pieniadz_mnoznik` w `econ-params.json["budynki"]` (domyslnie 2).

### Targowisko — bonusy bazowe (potwierdzone, BEZ ZMIAN)
- **+50% Handel** (`ctx.maTargowisko`: Step 3 economy.ts; param `budynek_targowisko_bonus_handlu=0.5`).
- **+3 Pieniadz** (`baza.pieniadz` w buildings.json — Step 4 per budynek).
- `baza.mnoznik = 0` (naprawiony blad; brak wplywu na Prace).

---

## Kontrakt wpinania (MASTER — w petli tury)

### ctx.walutaOdkryta (bool, opcjonalne; default false)
Ustaw `ctx.walutaOdkryta = true` gdy gracz ma tech Waluta w `playerState.zbadane`.
Obecny kod `turn-economy.ts` zawiera `// walutaOdkryta?: undefined` — wystarczy dopisac:
```ts
ctx.walutaOdkryta = playerState.zbadane?.includes('waluta') ?? false;
// lub przez odpowiedni klucz tech ID w tech.json
```

### ctx.maTargowisko (bool)
Ustawiane per-miasto — juz istnieje w `CityYieldContext`; master ustawia True gdy
`builtByCity.get(city.id)?.includes('targowisko')` (analogicznie do maMlyn, maCegielnia).

### ctx.mennicaMnoznik
Pozostaje **1** (neutralny). NIE zastepuje walutaMnoznik — to osobne pola.
Jesli chcesz per-nacje wariacje (1.7-2.4), wez `walutaMnoznik` z civs.json per cyw
i podaj w ctx jako override — ale to opcjonalne (domysl 2 plask dla wszystkich).

### PIENIADZ_MNOZNIK w playerState
Martwa flaga `PIENIADZ_MNOZNIK=10` (stara wersja modelu) — do usuniecia lub
ustawienia wartosci 2 (dla tieru Waluty). Patrz `playerState.ts`.

---

## Pliki zmienione (EKONOMIA subagent, 2026-06-25)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/economy.ts` | + `walutaMnoznik`, `targowiskoPracaMnoznik` do `EconParams`; + `walutaOdkryta?` do `CityYieldContext`; Efekt 1 w Step 6 (handelNetto *= walutaMnoznik); Efekt 2 w Step 9 (pieniadzZPracy); + `pieniadzZPracy` w `CityYieldResult`. |
| `gra/src/game/turn-economy.ts` | + `walutaMnoznik`, `targowiskoPracaMnoznik` do `buildEconParams`; + `pieniadzZPracy` do `CityEconomyTick`; `pieniadzZPracy` w obu tickach (oblegane + normalna sciezka). |
| `gra/data/econ-params.json` | + `waluta_mnoznik` (2/2/2) i `targowisko_praca_na_pieniadz_mnoznik` (2/2/2) w sekcji `budynki`. |
| `EKONOMIA/EKONOMIA-model-scalony.md` | Sekcja 10 przepisana na model finalny (dwa efekty x2). |
| `gra/tools/currency-test.cjs` | Nowy test standalone (21 asercji): Efekt 1 / Efekt 2 / gating / Targowisko bonusy bazowe. |

### Wyniki testow
- `node tools/currency-test.cjs`: **21/21 PASS**
- `node tools/logic-test.cjs`: **180/180 PASS** (bez regresji)

---

## Dwa zalozenia do potwierdzenia przez Maciela

1. **Efekt 1 x2 na CALA pule Handlu** — mnoznik dziala na `handelNetto` PRZED podzialem na
   strumienie Nauka / Pieniadz / Luksus. Skutek: po Walucie takze nauka i Wealth z handlu
   rosna x2 (nie tylko strumien Skarbca/Pieniądza). Czy to jest zamierzony efekt?

2. **Efekt 2 z puli-Pracy `doPuli`** — konwertuje sie Praca ktora NIE idzie na budynki
   (`doPuli = pracaNetto * (1 - procentBudynki/100)`). Suwak 70% na budynki = tylko 30%
   Pracy wchodzi do puli -> pieniadzZPracy. Czy to wlasciwe zrodlo (surplus po budowach)?

---

## Backupy
- `economy.ts.bak-EKONOMIA-currency`
- `turn-economy.ts.bak-EKONOMIA-currency`
- `econ-params.json.bak-EKONOMIA-currency`

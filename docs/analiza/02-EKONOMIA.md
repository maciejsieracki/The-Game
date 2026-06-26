# Analiza 02 — EKONOMIA

*Audyt: 2026-06-26 | Źródła: `gra/src/game/economy.ts`, `turn-economy.ts`, `upkeep.ts`, `econ-params.json`, DZIENNIK*

---

## 1. Zakres lane'a

Ekonomia państwa i miast: Praca, Handel, Pieniądz, Nauka, utrzymanie, okolica, Wealth (szkielet), mnożniki per-cyw.

**Własność:** `economy.ts`, `turn-economy.ts`, `upkeep.ts`, `Ekonomia-parametry.xlsx`, `econ-params.json`.

---

## 2. Stan (% ~78%)

### DONE
- `economy.ts` — formuły Praca/Handel/Pieniądz, splitPraca, waluta×2
- `turn-economy.ts` — adapter per-tura na miasto (advanceCityEconomy)
- `upkeep.ts` — utrzymanie jednostek w Pieniądz/turę
- Okolica (`okolica.ts`) — zasięg liniowy, plony pól w promieniu pop
- Research pool — wspólna pula nauki, gracz wybiera cel
- Mnożnik Handel→Pieniądz ×2 na całą pulę (decyzja Macieja 5A)
- Budynki Żelaza w `buildings.json` (26 wpisów) — dane gotowe, gameplay gated
- Wire-ekonomia kontrakt oblężenia (zapasy, flaga) — 23/23 testów
- Wealth szkielet — 25 testów, moduł bez wpiecia

### IN PROGRESS
- Dostęp surowców boolean (złoże + ulepszenie + przetwórnia)
- Mnożnik per-cyw w `civs.json` (pole istnieje, realizacja deferred)
- Realizacja `civBonusy[]` w systemach ekonomii

### BLOCKED
- **Wealth W1–W6** — czeka decyzje Macieja (scope v0.1)
- **Lista ulepszeń terenu** — Excel → Maciej akceptuje → export JSON

---

## 3. Model ekonomiczny (kanon)

| Zasób | Źródło | Zużycie |
|-------|--------|---------|
| Praca | Pola okolicy + budynki (Młyn +Praca) | Budynki + prace w terenie (suwak) |
| Handel | Pola + Targowisko | Suwak → Nauka / Skarbiec |
| Pieniądz | Handel×mnożnik + podatki + Mennica | Jednostki, budynki, utrzymanie |
| Nauka | % Handlu (domyślnie 20%) | Kupno tech z puli |
| Ludność | Wzrost z żywności+zdrowia | −1 per jednostka |

**Decyzje Macieja (zamknięte):**
- Podział: Praca osobno; Skarbiec+Wealth+Badania = 1 kubełek % (70/20/10)
- Podatek baza 10%
- Mnożnik Handel→Pieniądz baza 2 (1.7–2.4 per-cyw)
- Zasięg okolicy: LINIOWY (Decyzja Naster — potwierdzić)
- Zasięg miasta = populacja 1:1, cap 15; fort+10, posterunek+5

---

## 4. Pliki i testy

| Plik | Test suite | Wynik |
|------|-----------|-------|
| economy.ts | wire-ekonomia-test | 23/23 |
| upkeep.ts | upkeep-test | 51/51 |
| okolica.ts | okolica-test | 16/16 |
| converters | converters-test | 30/30 |
| split-output | split-output-test | 46/46 |
| wealth (szkielet) | wealth-test | 25/25 |
| happiness | happiness-breakdown-test | 38/38 |

---

## 5. Zależności

- **MAPA:** dostęp surowców, zasięgi terytorium, ulepszenia terenu
- **MIASTO:** produkcja budynków, auto-manage
- **DANE:** export econ-params, buildings, terrain-improvements
- **CYWILIZACJE:** mnoznikHandel per-cyw, civBonusy
- **SILNIK:** wpiecie turn-economy w endTurn()

---

## 6. Następne kroki

| # | Zadanie | Rola | AC |
|---|---------|------|-----|
| E1 | Wealth scope v0.1 po decyzji W6 | GLM→Composer | Moduł + testy + handoff SILNIK |
| E2 | Export terrain-improvements.json | Composer | Maciej akceptuje Excel |
| E3 | Pole dostępu surowców boolean | Composer | Test regresji wire-ekonomia |
| E4 | mnoznikHandel per-cyw realizacja | Composer | Wartości w civs.json → economy.ts |
| E5 | Plaster EKONOMIA+UI handoff | Composer | splitPraca/kup-za-Pieniądz w kanonie |

---

## 7. Decyzje ABC

| ID | Temat | Status |
|----|-------|--------|
| W1–W6 | Model Wealth | **BLOK** — Maciej wybiera scope v0.1 |
| U1 | Lista ulepszeń | **BLOK** — przejrzyj terrain-improvements + Excel |
| Zasięg | Stepped vs liniowy | **B** zamknięte — potwierdzić „Decyzja Naster" |

*Rola: GLM (model Wealth) + Composer (kod/JSON)*

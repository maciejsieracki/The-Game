# Playtest — scenariusz walki na mapie świata (C1 + C2)

> **Zlecenie Macieja (Master, 2026-06-27)**  
> Osobny podgląd / start gry do testu **ataku z mapy → preBattle → pole bitwy 3D**, bez przechodzenia całej nowej gry.

---

## Cel

Maciej ma w **jednym pliku** od razu na **mapie świata** (nie w izolowanej scenie bitwy):

1. **Swoją armię** (~12–18 jednostek wojskowych) na heksach.
2. **Miasto przeciwnika** w zasięgu wzroku — do testu **ataku na miasto** (C3 / szturm gdy podpięte).
3. **Słabą jednostkę wroga** obok miasta — w **zasięgu ataku hex=1** — do testu **ataku na jednostkę**.
4. Oba wejścia z mapy: **preBattle TW** → **Bitwa ręczna** → powrót na mapę z survivors.

**Nie zastępuje** podglądów tylko-bitwy (`T`, `Gra-podglad-BITWA.html`, `OBLEZENIE-BITWA`) — te **omijają mapę świata**.

---

## Dwa scenariusze w jednym pliku

| # | Akcja gracza | Oczekiwany flow | Owner logiki |
|---|--------------|-----------------|--------------|
| **A** | Zaznacz jednostkę → klik **wroga** na sąsiednim heksie | preBattle → bitwa 3D → mapa | **F** (preset) + C1 już w `main.ts` |
| **B** | Zaznacz jednostkę → **atak / szturm miasta** wroga (sąsiedni hex lub klik miasta wg C3) | preBattle lub overlay oblężenia → bitwa | **F** preset + **A** jeśli C3 nie podpięte w `main.ts` |

**Stan kodu (2026-06-27):** atak **jednostka vs jednostka** jest w `main.ts`; klik **miasta** otwiera panel miasta — **atak na miasto z mapy może wymagać batcha A (C3)**. Playtest i tak musi mieć **miasto + garnizon** w scenie, żeby Maciej mógł testować B gdy A dostarczy wire.

---

## Deliverable

| Element | Wartość |
|---------|---------|
| Plik | `Gra-podglad-PLAYTEST-WALKA.html` (build z tego samego `main.ts`, osobny outDir lub kopia po build) |
| Wejście | Menu: **„Playtest walki”** LUB URL `?playtest=walka` LUB przycisk dev w menu (widoczny zawsze w ROBOCZA) |
| Owner implementacji | **Grupa F** (`main.ts` + publish) · dane jednostek **UNITS** · kamera/fog **Grupa A** opcjonalnie |

---

## Stan startowy (kanon spec)

### Mapa
- Mała mapa **standardowy** lub **mały**, seed **stały** `424242` (powtarzalność).
- Teren: **równina** w strefie starcia (bez blokujących rzek między armiami).

### Gracz (ownerId = 0)
- **1 miasto** gracza ~5 heksów od strefy walki (opcjonalnie — może być bez miasta).
- **Armia** ~15 jednostek w **jednym klastrze** (sąsiednie hexy), mix:
  - 8× Hastati / miecznik
  - 4× Lucznik
  - 2× Konnica  
  (dokładne typeId z `units.json` — lane UNITS)
- **Wszystkie z pełnym ruchem** (`ruchLeft = ruch`).
- **Fog:** odkryte hexy w promieniu ~12 od armii gracza.

### Przeciwnik (ownerId = 1, np. Grecy)
- **1 miasto AI** 2–4 hexy od armii gracza.
- **1 słaba jednostka** (np. Oszczepnik / niski HP) na heksie **sąsiadującym z miastem**, w **zasięgu 1** od co najmniej jednej jednostki gracza.
- **2–4 jednostki garnizonu** w mieście (opcjonalnie P2).

### UI po starcie
- Komunikat: *„PLAYTEST WALKA — zaznacz jednostkę, klik wroga w zasięgu, preBattle → Bitwa ręczna”*
- Kamera: **przybliżona** na strefę starcia (max zoom średni — nie „w chmurach”).

---

## Kryteria akceptacji (DoD)

| # | Test |
|---|------|
| 1 | Dwuklik pliku → w <10 s widać mapę 3D z armią + miasto wroga + słabą jednostkę |
| 2 | Klik własnej jednostki → panel [H] |
| 3 | **Scenariusz A:** klik wroga w zasięgu → **preBattle** (Auto / Ręczna / Wycofaj) |
| 3b | **Scenariusz B:** atak **miasta** wroga z mapy (gdy C3 podpięte) — ten sam lub osobny flow preBattle |
| 4 | **Bitwa ręczna** → scena 3D → po zakończeniu **powrót na mapę** |
| 5 | Na mapie widać **skutek** (wrog zniknął / raniony — survivors) |
| 6 | **Wycofaj** na preBattle anuluje atak bez straty ruchu (C1-Q5) |
| 7 | Bramka: smoke + battle-smoke PASS po publish |

---

## Poza zakresem (ten batch)

- Oblężenie miasta bez szturmu (C3) — osobny scenariusz Grupa A.
- Faza deployment na polu bitwy — **wyłączona docelowo** (Maciej: pozycje na mapie).
- Pełna nowa gra / kreator.

---

## Routing

| Grupa | Rola |
|-------|------|
| **F** | `startPlaytestWalkaMapy()` w `main.ts`, publish HTML, bramka |
| **A** | kamera start, fog seed (jeśli osobny moduł) |
| **C** | konsultacja roster 15 jednostek (opcjonalnie) |
| **Master** | playtest Macieja po ROBOCZA |
| **Maciej** | tylko gra w podglądzie — zero Node |

Handoff: `dyspozycje/_handoff/MASTER-do-F_playtest-walka-mapa.md`

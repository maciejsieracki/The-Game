# B → INTEGRATOR — bramki surowcowe budynków wg epoki (B-SUROW-BUD)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 (aktualizacja REMOVE-DESKI) |
| **Decyzje** | `docs/decyzje/B-SUROW-BUD-2026-07-23.md` |
| **Kanon** | `dyspozycje/SUROWCE-KANON-2026-07-22.md` § cross-ref B-SUROW-BUD |
| **Warstwa** | 🟡 cross (`building-resource-gate.ts`, `buildings.json`, `resources.json`, `converters.ts`, `units.json`) |
| **Status handoffu** | 🟡 ZAPISANE — **nie wdrażać** bez `działaj` od Macieja |

## Co przesyłam

Maciej (2026-07-23) — paczka bramek **dostępu** surowców per epoka budynku (nie koszt ze stocku) + **B-SUROW-BUD-03 REMOVE-DESKI**:

| ID | Skrót |
|---|---|
| B-SUROW-BUD-01 | Ep. **Żelazo** — wszystkie budynki + **cegła + kamień + drewno** (korekta; ~~deski~~ wycofane) |
| B-SUROW-BUD-02 | Ep. **Klasyczna** (4) — **stal** dla **Wielka Kuźnia + jednostek Klasycznej** |
| **B-SUROW-BUD-03** | **REMOVE-DESKI** — surowiec wylatuje; Stolarnia = **bonus Pracy** only; bramki Brąz/Żelazo bez desek |
| B-SUROW-BUD-04 | Ep. **Kamień** — wszystkie + **drewno** (dostęp) |
| ~~B-SUROW-BUD-05~~ | ~~Audyt deski~~ — **SUPERSEDED** |
| B-SUROW-BUD-06 | **Magazyn** — bez limitu; rola handel/eksport (limity faza 3) |
| B-SUROW-BUD-07 | Pełna tabela budynków — Maciej przypisze Sz/Zd osobno |

### Bramki epok (po B-SUROW-BUD-03)

| Epoka | Dostęp AND (budynki) |
|---|---|
| Kamień (1) | drewno |
| Brąz (2) | drewno + kamień |
| Żelazo (3) | drewno + kamień + cegła |
| Klasyczna (4) | stal (budynki + jednostki) |

## Checklist REMOVE-DESKI (po `działaj`)

### P0 — dane i ekonomia

- [ ] **`gra/data/resources.json`** — usunąć wpis `"Surowiec": "Deski"`
- [ ] **`gra/src/types/resources.ts`** — usunąć `Deski = 'deski'` z enum / map
- [ ] **`gra/src/game/converters.ts`** — **USUNĄĆ** recepturę `{ id: 'tartak', output: 'deski' }`; **NIE** dodawać stolarnia→deski
- [ ] **`gra/src/game/cities.ts`** — wyczyścić komentarz/pole `deski` w `surowce` jeśli występuje
- [ ] **`gra/tools/converters-test.cjs`** — usunąć/zmienić testy tartak→deski
- [ ] **`gra/data/econ-params.json`** — usunąć `budynek_tartak_przepustowosc` (Drewno→Deski) jeśli dotyczy tylko desek

### P0 — koszty / tech

- [ ] **`gra/data/units.json`** — **Galera**: `"Surowiec": "Deski"` ×4 → **`Drewno`** (ilość do balansu; propozycja: 4)
- [ ] **`gra/data/tech.json`** — tech Obróbka drewna: wyczyścić `"deski"` z `"Odblokowuje surowiec."` i `"Dostęp do surowca.": "Deski"`
- [ ] **`gra/data/terrain-improvements.json`** — tartak: `"odblokowuje"` — usunąć wzmiankę o deskach / Stolarnii jako producent

### P1 — bramki budynków

- [ ] **`building-resource-gate.ts`** — ep.2 = drewno+kamień · ep.3 = drewno+kamień+cegła (**bez deski**)
- [ ] **`buildings.json`** — `stolarnia`: potwierdzić bonus **praca**; brak `wymaganySurowiec: deski`

### P1 — UI / save / testy

- [ ] **`cityPanel.ts`** / HUD surowców — ukryć deski
- [ ] **Save/load** — migracja starych save z `surowce.deski` → drop lub konwersja na drewno (decyzja Integratora)
- [ ] **Bundle testów** — przebudować `.logic-bundle.cjs` itd. po zmianie JSON (auto przy build testów)

### P2 — dokumentacja gracza (opcjonalnie batch)

- [ ] **`gra/src/data/wikiBundle.json`** / poradnik — wyczyścić opisy desek
- [ ] **`docs/PORADNIK-GRACZA/`** — Stolarnia = Praca, nie deski

### ❓ Otwarte (bez blokady ECHO)

Maciej w cytacie użył „**jednostki**" — domyślnie dotyczy **budynków**. Jedyna jednostka z kosztem Deski: **Galera**. Czy inne jednostki mają dostać bramki epokowe — **czeka potwierdzenia**.

## Co Odbiorca ma zrobić (plan — po `działaj`)

1. **REMOVE-DESKI** — checklist powyżej (P0 przed bramkami).
2. **`building-resource-gate.ts`** — mapowanie per `epokaWejscia`: drewno (1) · drewno+kamień (2) · drewno+kamień+cegła (3) · stal (4).
3. **`converters.ts`** — `wielka_kuznia` (żelazo→stal); **bez** stolarnia/tartak deski.
4. **`units.json`** — jednostki Klasyczna → koszt **stal** (B-SUROW-BUD-02); Galera → drewno.
5. **Nie** wdrażać kosztów materiałowych ze stocku (Maciej: „na razie tylko dostęp").
6. **Magazyn** — bez capów magazynowych w tej paczce.

## Audyt łańcuchów (2026-07-23, po REMOVE-DESKI)

| Chain | Werdykt | Fix przy `działaj` |
|---|---|---|
| drewno (Kamień) | PASS | — |
| kamień (Kamień) | PASS | — |
| cegła (Brąz) | PASS | — |
| ~~deski~~ | **WYCofane** | usuń z JSON/kodu |
| Stolarnia | bonus Pracy | bez konwertera |

## Pliki z odniesieniami do `deski` (grep 2026-07-23)

**Gameplay (must touch):**

| Plik | Co |
|---|---|
| `gra/data/resources.json` | wpis Deski |
| `gra/data/units.json` | Galera 4× Deski |
| `gra/data/tech.json` | odblokowanie deski |
| `gra/data/terrain-improvements.json` | tartak odblokowuje Deski |
| `gra/data/econ-params.json` | przepustowość Drewno→Deski |
| `gra/src/game/converters.ts` | tartak→deski |
| `gra/src/types/resources.ts` | enum Deski |
| `gra/tools/converters-test.cjs` | testy deski |

**Komentarze / render 3D (NIE surowiec — opcjonalnie):**

`gra/src/render/*.ts` — „deska" = geometry board/plank (tarcza, galera, tartak model) — **nie ruszać** przy REMOVE-DESKI.

**Bundlery testów (regeneracja po JSON):**

`gra/tools/.logic-bundle.cjs`, `.empire-food-b5-bundle.cjs`, `.owner-economy-bundle.cjs`, `.deposit-gate-bundle.cjs`, `.pt-layout-bundle.cjs`, `.diag-playtest-bundle.cjs`, `.dip-*-bundle.cjs` — embedded JSON z Deski.

## DoD

- Brak `deski` w `resources.json`, `converters.ts`, kosztach jednostek (poza migracją save).
- Test bramki budynków per epoka (nowy bundle lub rozszerzenie `logic-test`).
- Galera produkowalna na **drewno** (nie Deski).
- `REJESTR-DECYZJI` → 🔵/🟢 po wdrożeniu.

## Flaga

**CZEKA** — ECHO B-SUROW-BUD-03 2026-07-23; implementacja **nie** w tej sesji.

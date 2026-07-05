# ZLECENIE Design — Infografiki typów jednostek (1E, spójny zestaw)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05`  
**Priorytet:** **P0** — w grze **każde miejsce ma inne ikony** tego samego typu

---

## 0. Problem (dla Designera)

Gracz widzi **tę samą konnicę / piechotę / łucznika** z **różnymi piktogramami** w zależności od ekranu:

| Gdzie gracz to widzi | Co pokazujemy dziś | Ile wariantów |
|----------------------|-------------------|---------------|
| **Panel miasta** (produkcja, kolejka) | SVG brand-book `unit-*` | **~12 osobnych** ikon kategorii |
| **Pre-bitwa** (C-01, skład ATK/OBR) | `PB_SVG` — 4 klasy | **Inne** kształty niż bitwa |
| **Pole bitwy — top bar** (20·60·30·110) | podkowa · skrzyż. miecze · łuk | **Inne** niż pre-bitwa |
| **Pole bitwy — roster** (karta jednostki) | to samo 3-pack co top bar | OK wewnętrznie, **≠** miasto |
| **Popup Strategia** (medalion K/Ł/P) | znowu 3-pack roster | **≠** brand-book |
| **Podsumowanie po bitwie mapie** | znowu `PB_SVG` | **≠** pole bitwy |

**Przykład niespójności:** włócznik w mieście = ikona **włóczni** (`unit-spear`), na polu bitwy = **skrzyżowane miecze** (klasa „piechota”), w pre-bitwie = **inne skrzyżowane miecze**.

Maciej chce **jeden kanon infografik** — Design dostarcza zestaw, lane podmienia wszędzie.

---

## 1. Playtest PRZED (screenshoty)

Otwórz i zrób zrzuty **obok siebie**:

| # | Ekran | Jak wejść |
|---|--------|-----------|
| 1 | Panel miasta — produkcja jednostki | `gra-kanon/START.html` → miasto → zakładka wojsko/produkcja |
| 2 | Pre-bitwa C-01 | Atak na wroga → ekran przed walką |
| 3 | Pole bitwy — top bar | `gra-kanon/Gra-podglad-POLE-BITWY.html` → deploy |
| 4 | Pole bitwy — roster | POLE-BITWY → **R** → lewy panel kart |
| 5 | Strategia popup | POLE-BITWY → **Strategia** (medaliony K/Ł/P) |

**Review HTML:** `docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html`

---

## 2. Reguły 1E (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Format | **SVG** · `stroke="currentColor"` · **zero emoji** |
| Styl | brand-book 1E · linia 1.4–1.6 · zaokrąglone końce |
| Akcent | `#e8d88a` w pliku źródłowym → w grze `currentColor` |
| Rozmiary docelowe | **14 · 16 · 18 · 24 · 32 · 40 px** (jeden viewBox 24×24, skalowany) |
| ZIP | `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05.zip` |
| W ZIP | SVG + `icons-manifest.json` fragment + `unit-icon-map.json` + `DESIGN-do-UI_JEDNOSTKI-INFOGRAFIKI.md` + `MANIFEST.txt` |

---

## 3. Dwa poziomy ikon (MUST)

Design dostarcza **dwa zestawy** — lane mapuje oba:

### Poziom A — **Klasy walki (agregat HUD)** — 3 + 1 ikony

Używane gdy UI pokazuje **liczniki armii**, nie konkretną jednostkę:

| ID | Polska nazwa | Gdzie w grze |
|----|--------------|--------------|
| `class-mounted` | **Konnica** | Top bar POLE-BITWY · filtry rosteru · Strategia priorytet Konnica |
| `class-melee` | **Piechota** | j.w. · Piechota |
| `class-ranged` | **Łucznicy** | j.w. · Łucznicy |
| `class-siege` | **Oblężenie** | Pre-bitwa · machiny · garnizon |

**Wymaganie:** te **4 ikony muszą wyglądać identycznie** na: pre-bitwie, top barze, rosterze (filtr), popup Strategia.

**Dziś w kodzie (do zastąpienia):** `ROSTER_TYPE_SVG` + `PB_SVG.unit*` w `battleHudTheme.ts` — **różne kształty**.

---

### Poziom B — **Kategorie modelu (szczegół)** — pełna lista

Używane gdy UI pokazuje **konkretny typ jednostki** (panel miasta, tooltip, encyklopedia, kolejka produkcji):

| # | Klucz `kategoria` | Nazwa PL (UI) | Obecny plik brand | Uwagi |
|---|-------------------|---------------|-------------------|-------|
| 1 | `lucznik` | Łucznik | `unit-archer` | dystans |
| 2 | `procarz` | Procarz | `unit-sling` | dystans |
| 3 | `oszczepnik` | Oszczepnik | → `unit-spear` dziś | może osobna ikona |
| 4 | `wlocznik` | Włócznik | `unit-spear` | anty-kawaleria |
| 5 | `falanga` | Falanga / hoplita | → `unit-melee` dziś | **powinna ≠ miecznik** |
| 6 | `legionista` | Legionista | → `unit-melee` dziś | **powinna ≠ włócznik** |
| 7 | `miecznik` | Miecznik | `unit-melee` | |
| 8 | `maczuga` | Maczuga | brak → `_default` | **NOWA** |
| 9 | `topor` | Topór | brak → `_default` | **NOWA** |
| 10 | `konnica` | Konnica | `unit-cavalry` | |
| 11 | `rydwan` | Rydwan | `unit-chariot` | |
| 12 | `obleznicza` | Oblężnicza | `unit-siege` | katapulta/taran |
| 13 | `zwiadowca` | Zwiadowca | `unit-scout` | |
| 14 | `osadnik` | Osadnik | `unit-worker` | cywil |
| 15 | `robotnik` | Robotnik | `unit-worker` | cywil |
| 16 | `galera` | Galera / morska | `unit-naval` | |
| 17 | `super` | Super-jednostka | `unit-elite` | elita cywilizacji |
| 18 | `domyslny` | Domyślny | `unit-default` | fallback |

**Źródło prawdy kluczy:** `gra/src/units/setup.ts` → `categoryOf()`.

**Wymaganie:** falanga, legionista, włócznik, miecznik — **4 różne siluety**, nie jedna „piechota”.

---

## 4. Mapa miejsc UI → który poziom ikony

| Miejsce | Plik kodu | Poziom | Rozmiar |
|---------|-----------|--------|---------|
| Produkcja / kolejka miasta | `cityPanel.ts` → `unitIconSvg` | **B** kategoria | 24px |
| Pre-bitwa — wiersz jednostki | `preBattle.ts` | **B** (docelowo) lub A jeśli brak mapowania | 32px medalion |
| Pre-bitwa — licznik klasy | opcjonalnie | **A** | — |
| POLE-BITWY top bar cluster | `battleHudTheme.ts` rosterTypeCountsHtml | **A** | 14–18px |
| POLE-BITWY roster — karta | `battleScene.ts` ROSTER_TYPE_SVG | **B** (docelowo!) lub A dziś | 15px w kółku |
| Filtry rosteru (Konnica/Piechota/Łucznicy) | chipy C09 | **A** + kolor typu | 10px label |
| Popup Strategia — medalion typu | `createBattleClassTypeRow` | **A** | 16px |
| Popup Strategia — dropdown | medalion w select | **A** | 16px |
| Podsumowanie po bitwie (mapa) | `postBattleSummary.ts` | **B** | 32px |
| Encyklopedia / Wikipedia (przyszłość) | — | **B** | 24px |

**Decyzja Design (zaproponuj w mockupie):**
- **Wariant 1 (rekomendacja lane):** karta rosteru = **ikona kategorii B** (włócznik wygląda jak włócznik); top bar = **suma klas A**.
- **Wariant 2:** wszędzie tylko 3 klasy A — prostsze, mniej szczegółu.

Maciej preferuje **Wariant 1** (widać różnicę falanga vs miecznik).

---

## 5. Deliverables (pliki w ZIP)

### 5.1 Arkusz główny (mockup)

`The Game - Jednostki infografiki kanon v1 2026-07-05 (1E).dc.html`

Jedna plansza @1920 z sekcjami:
1. **Klasy A** (4 ikony) — duże + małe
2. **Kategorie B** (18 ikon) — siatka 6×3
3. **Te same ikony w kontekście:** pre-bitwa · top bar · karta rosteru · wiersz miasta (4 miniatury obok siebie)
4. Stopka: `The Game · Jednostki infografiki · 1E`

### 5.2 Pliki SVG (folder `eksport/icons/units/`)

Naming (zgodny z brand-book):

```
class-mounted.svg      class-melee.svg      class-ranged.svg      class-siege.svg
unit-archer.svg        unit-sling.svg       unit-spear.svg
unit-sword.svg         (nowy — miecznik, zamiast generic unit-melee)
unit-phalanx.svg       (nowy — falanga)
unit-legion.svg        (nowy — legionista)
unit-mace.svg          unit-axe.svg
unit-cavalry.svg       unit-chariot.svg     unit-siege.svg
unit-scout.svg         unit-worker.svg      unit-naval.svg
unit-elite.svg         unit-default.svg
```

**Możesz scalić** `unit-melee` → rozbij na sword/phalanx/legion — lane zaktualizuje `unit-icon-map.json`.

### 5.3 Zaktualizowany map JSON (Design wypełnia)

`unit-icon-map.json` — pełne mapowanie klucz `kategoria` → plik SVG (wzór w `gra/src/ui/icons/brand/unit-icon-map.json`).

### 5.4 `battle-class-map.json` (NOWY)

```json
{
  "class-mounted": "class-mounted.svg",
  "class-melee": "class-melee.svg",
  "class-ranged": "class-ranged.svg",
  "class-siege": "class-siege.svg"
}
```

### 5.5 Handoff

`DESIGN-do-UI_JEDNOSTKI-INFOGRAFIKI.md` — tabela: plik SVG → moduł kodu do podmiany.

---

## 6. Wytyczne wizualne per typ (siluetka)

Design **nie kopiuje** obecnych SVG — projektuje **spójny rodzinny styl**. Poniżej **znaczenie** (co gracz ma rozpoznać):

| Typ | Silueta (sugestia) |
|-----|-------------------|
| Konnica | koń / podkowa / lanca jeźdca — **nie** sam jeździec z C-01 jeśli inny niż podkowa |
| Piechota (klasa A) | tarcza + miecz **lub** hełm — **jedna** ikona dla wszystkich piechot |
| Łucznicy (klasa A) | łuk + strzała |
| Włócznik | włócznia / pika skierowana do przodu |
| Falanga | włócznia + tarcza okrągła (hoplita) |
| Legionista | miecz + tarcza scutum (prostokąt) |
| Miecznik | miecz + mała tarcza |
| Łucznik | łuk |
| Procarz | proca |
| Oszczepnik | oszczep / metnal |
| Maczuga | maczuga |
| Topór | topór bojowy |
| Rydwan | rydwan / dwa koła |
| Oblężnicza | katapulta / taran |
| Zwiadowca | oko / lornetka / lekki hełm |
| Osadnik/Robotnik | narzędzie / flaga osady |
| Galera | statek |
| Super | gwiazda / wieniec elity |
| Domyślny | hełm neutralny |

**Klasy A vs B:** ikona `class-melee` może być **uproszczeniem** `unit-sword`, ale **musi być w tym samym stylu co B** (ta sama grubość linii, ten sam kąt).

---

## 7. Czego NIE projektować w tym ZIP

| Element | Dlaczego |
|---------|----------|
| Modele 3D na mapie | `render/units.ts` — osobny tor |
| Portrety dowódców | już w C-01 |
| Ikony budynków | osobny brand-book |
| Emoji / PNG raster | tylko SVG |

---

## 8. DoD (Definition of Done)

- [ ] ZIP `JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05.zip`
- [ ] Mockup `.dc.html` z 4 kontekstami UI (miasto · pre-bitwa · top bar · roster)
- [ ] Min. **22 pliki SVG** (4 klasy A + 18 kategorii B)
- [ ] `unit-icon-map.json` + `battle-class-map.json` wypełnione
- [ ] Falanga ≠ Legionista ≠ Włócznik ≠ Miecznik — **wizualnie rozróżnialne**
- [ ] Te same 4 klasy A identyczne na mockupie pre-bitwa i POLE-BITWY
- [ ] Meldunek: `MELDUNEK-JEDNOSTKI-INFOGRAFIKI.md`
- [ ] Zero emoji

---

## 9. Po Design → lane

1. Maciej akceptacja mockupu  
2. Lane UI: `brandAssets.ts` + `battleHudTheme.ts` + `preBattle.ts` + `postBattleSummary.ts` + `battleScene.ts`  
3. Test wizualny: 5 ekranów z §1  
4. Opus review → kanon  

**Nie blokuje** POLE-BITWY v5 GAP — można robić **równolegle**, ale **klasy A** powinny być **identyczne** z mockupem POLE-BITWY top bar (Design synchronizuje oba ZIP-y).

---

## 10. Referencje w repo

| Plik | Rola |
|------|------|
| `gra/src/units/setup.ts` | `categoryOf()` — lista kluczy |
| `gra/src/ui/icons/brand/unit-icon-map.json` | mapowanie dziś |
| `gra/src/ui/icons/brand/units/*.svg` | SVG dziś (12 plików) |
| `gra/src/battle/battleHudTheme.ts` | `ROSTER_TYPE_SVG`, `PB_SVG` — **do usunięcia po porcie** |
| `docs/ux/export/JEDNOSTKI-INFOGRAFIKI-GAP-DLA-DESIGN.html` | review dla Designera |

---

*Lane UI · The Game · Jednostki infografiki · 2026-07-05*

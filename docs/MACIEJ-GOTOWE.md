# Maciej — co jest gotowe (log agentów)

> **Jedna strona do przejrzenia.** Agenci dopisują **append-only** (najnowsze **na górze**).  
> **Czat:** krótko **`✅ Gotowe:`** / **`⏸️ Czeka:`** · **Ten plik:** pełniejszy zapis tego samego.  
> Szczegóły techniczne → handoff w `dyspozycje/_handoff/` · operacja → `dyspozycje/DZIENNIK-MASTERA.md`

**Ostatnia aktualizacja:** 2026-07-07

---

## [2026-07-07] ✅ Gotowe — obwódki w kolorach frakcji (civ-visual)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07) |
| **Co** | Obwódka heksu miasta = `kolorHex` właściciela · jednostki AI/gracza = ring w kolorze cywilizacji · w wojnie cienki czerwony akcent (miasto zewnętrzny, jednostka skalowany ring) · dyplomacja już miała `kolorHex` (panel, audiencja, nowa gra) |
| **Build** | ROBOCZA md5 `e2c5c711d69065323c2ea3b2be280782` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · porównaj obwódki miast AI (różne kolory frakcji) · jednostki przeciwników — ring w ich kolorze · wojna — civ color + czerwony akcent · gracz — złoty/civ ring |

---

## [2026-07-07] ✅ Gotowe — overlay robotników na mapie świata (E-WORKER-1=A)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07) |
| **Co** | Przycisk 👤 obok minimapy · przeźroczyste ikonki na hexach z pracownikami · wszystkie miasta gracza · auto ON przy trybie budowy ulepszeń |
| **Build** | ROBOCZA md5 `eead06d7c5ea6c974b07eb02da706bf1` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · klik 👤 przy minimapie · wejdź w 🔨 budowę — overlay włącza się sam · wyjdź z trybu — stan zostaje · 2+ miasta — 👤 ze wszystkich |

---

## [2026-07-07] ✅ Gotowe — A3 marsz redesign (planned march)

| | |
|---|---|
| **Kto** | Integrator F (sesja 2026-07-07 wieczór) |
| **Co** | Klik bez Shift → plan celu + trasa z markerami tur · segment po **Zakończ turę** lub **Kontynuuj** · **Zatrzymaj** / nowy cel / Pomiń czyści · save/load `autoMarch` + `plannedMarches` (SAVE v2) |
| **Build** | ROBOCZA md5 `8fd0dbfc9a5f91a40229d1dcae7800bd` · `gra-robocza/START.html` |
| **Testy** | tsc OK · planned-march-test 11/11 |
| **Od Ciebie** | Ctrl+F5 · zaznacz jednostkę → klik cel (stoi) → Kontynuuj lub end-turn → STOP przy przeszce · zapis w marszu → load → cel zostaje |

---

## [2026-07-07] ✅ Gotowe (kod) — dopisek „miasto-państwo” + ⏸️ A3 marsz w toku

| | |
|---|---|
| **Kto** | Sesja 2026-07-07 |
| **Co** | `Sparta · miasto-państwo` — dyplomacja, mapa, tooltip, panel miasta (`display-names.ts`) |
| **Testy** | `display-names-test.cjs` 6/6 |
| **Build** | ⏸️ po domknięciu A3 marsz (merge `main.ts`) — jeden build Integratora |
| **Od Ciebie** | Po buildzie: dyplomacja vs stolica imperium vs miasto-państwo klastra |

---

## [2026-07-07] ✅ Gotowe — kolory cywilizacji (B) + build robocza

| | |
|---|---|
| **Kto** | Sesja 2026-07-07 (civ-visual B + publish) |
| **Co** | `kolorHex` ×15 cywilizacji · resolver · mapa/jednostki/miasta/minimapa/dyplomacja/HUD |
| **Build** | ROBOCZA md5 `ee4355aff6356667a0318763ec6f9d6d` · `gra-robocza/START.html` |
| **Testy** | tsc OK · civ-visual 54/54 · city-names 10/10 · smoke OK |
| **Od Ciebie** | Ctrl+F5 · kolory na mapie i w dyplomacji · odpowiedź **A3-P0-1** (Shift+marsz) |

---

## [2026-07-07] ✅ Gotowe — import Excel nazw miast + B2-Q1 panel handlu

| | |
|---|---|
| **Kto** | Grupa B (sesja follow-up) |
| **Co** | Pipeline `import-city-names-from-xlsx.py` (Excel → JSON + sync civs.json); B2-Q1=B (panel handlu via fix B1) |
| **Excel** | Edytuj `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` → w czacie napisz **„eksportuj nazwy miast"** |
| **Testy** | `city-names-pool-test.cjs` 10/10 |
| **Od Ciebie** | Przejrzyj nazwy w Excelu; w grze sprawdź suwaki Skarb/Nauka/Zamożność w panelu miasta |

---


| | |
|---|---|
| **Kto** | Follow-up sesji 2026-07-07 (domknięcie 3615b014, 3c1794f3, 5d176733, raport 8e4044ed) |
| **Co** | Kreator: koszty budynków/jednostek (×1/×2/×4), tempo badań, **Wzrost ludności** (×1/×2/×4), asymetria trudności kosztów + progu wzrostu; save/load `wzrostLudnosciPace`; raport dnia zapisany |
| **Build** | ROBOCZA md5 `ae03f50d923a698f644302fdf07e1150` · `gra-robocza/START.html` |
| **Testy** | tsc OK · difficulty-cost 22/22 · population-growth-tempo 14/14 |
| **Od Ciebie** | Ctrl+F5 `gra-robocza/START.html` · Nowa gra · checklist §4 w raporcie dnia |
| **Raport** | `dyspozycje/RAPORT-DZIEN-2026-07-07.md` (sekcja 5 zaktualizowana po domknięciu) |

---

## [2026-07-04 ~23:31] ✅ Gotowe — KANON MAPA bufor rzek 2 hex

| | |
|---|---|
| **Kto** | MAPA lane · Integrator F · Master review + kanon |
| **Co** | Rzeki min. 2 hex ciała od morza · ujście ≤2 hex na wybrzeżu |
| **Kanon md5** | `11d23be65ee6eaf8c5dabe5013eef2d8` · `gra-kanon/START.html` |
| **Od Ciebie** | Ctrl+F5 · nowa gra · brzeg + ujścia rzek |
| **Handoff** | `F-do-MASTER_MAPA-river-sea-buffer-2026-07-04.md` |

---

## [2026-07-04 ~22:03] ✅ Gotowe — KANON roster-6 AI (CYW)

| | |
|---|---|
| **Kto** | CYWILIZACJE lane · MASTER review + promocja |
| **Co** | 6 własnych archetypów AI (Harappa, Hetyci, Słowianie, Babilonia, Asyria, Fenicjanie) · Hetyci nauka +2 |
| **Kanon md5** | `dafa21f48be84501ad74145e8d65f9f4` · start: `gra-kanon/START.html` |
| **Od Ciebie** | nic — playtest opcjonalny |
| **Handoff** | `CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md` |

---

## [2026-06-26] ✅ Gotowe — E2 kreator (UI + MAPA + SILNIK)

| | |
|---|---|
| **Kto** | Grupa E (UI) · Grupa A (generator) · Integrator F (`main.ts`) |
| **Co** | Krok 4: **Miasta-państwa** + **Typy cywilizacji** · zaawansowane: 4 suwaki gęstości · `buildParams()` → generator |
| **Pliki** | `gra/src/ui/newGameFlow.ts` · `gra/data/ui-params.json` · `gra/src/map/generator.ts` · `gra/src/main.ts` |
| **Testy** | `world-density-test.cjs` (E2-PARAMS) |
| **Od Ciebie** | nic — efekt w **ROBOCZA** `351d8ad6…`; kanon po review Master |
| **Handoff** | `dyspozycje/_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` |

---

## [2026-06-26] ✅ Gotowe — protokół logu `MACIEJ-GOTOWE.md` (Master)

| | |
|---|---|
| **Kto** | Master |
| **Co** | Agenci **muszą** dopisywać tu co przygotowali (obok czatu **`✅ Gotowe:`**) |
| **Pliki** | `docs/MACIEJ-GOTOWE.md` · reguły w `OBOWIAZ-POWIADOM-MACIEJA.md` · `PLOT-CODE-WORKFLOW.md` |
| **Od Ciebie** | **`plot code`** gdy chcesz kolejną paczkę kodu |

---

## [2026-06-26] ✅ Gotowe — W1-PREP tokeny menu i kreator (UI)

| | |
|---|---|
| **Kto** | Lane UI (sesja autonomiczna) |
| **Co** | Tokeny brand Warstwa 1 (1B/2C/4C) w menu i kreatorze; rejestr ikon Tier 1–2 (placeholder) |
| **Pliki** | `gra/src/ui/brandTokenVars.ts` · `gra/src/ui/icons/iconRegistry.ts` · `gra/src/ui/mainMenu.ts` · `gra/src/ui/newGameFlow.ts` |
| **Testy** | smoke OK |
| **Od Ciebie** | nic (kolejny krok: folder Design `brand-book-1E/eksport/` albo **`plot code`**) |
| **Handoff** | `dyspozycje/_handoff/UI-do-MASTER_warstwa1-w1-prep-2026-06-26.md` |

---

## [2026-07-02] ✅ Gotowe — paczka PILNE A–E + F (ROBOCZA, bez kanonu)

| | |
|---|---|
| **Kto** | Grupy A–E + Integrator F |
| **Co** | VICTORY + F-P1-01 (atak miasta z mapy) + B1-Q3 Panel-B + mapFieldBattle + victoryScreen |
| **Build** | ROBOCZA md5 `351d8ad65ab9c0e560961438cdd56d39` — **promocja kanon pending** |
| **Testy** | map-attack 8/8 · field-battle 15/15 · victory 12+11 · tech-tree 19/19 · smoke OK |
| **Od Ciebie** | nic — Master: review + ewent. playtest po kanonie |
| **Handoffy** | `F-do-MASTER_F-P1-01-2026-07-02.md` · `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` |

---

## Szablon wpisu (dla agentów)

**Sukces** — wklej **pod** linię `---` na górze listy:

```markdown
## [RRRR-MM-DD] ✅ Gotowe — [krótki tytuł] ([lane / grupa])

| | |
|---|---|
| **Kto** | Master / Grupa X / UI / F |
| **Co** | [1–2 zdania] |
| **Pliki** | [ścieżki] |
| **Testy** | [opcjonalnie] |
| **Od Ciebie** | [nic / akcja] |
| **Handoff** | [opcjonalnie] |
```

**Bloker:**

```markdown
## [RRRR-MM-DD] ⏸️ Czeka — [krótki tytuł]

| | |
|---|---|
| **Kto** | … |
| **Co brakuje** | … |
| **Co już jest** | … |
| **Od Ciebie** | [jedna akcja] |
```

Reguła: [`docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md`](obieg/OBOWIAZ-POWIADOM-MACIEJA.md)

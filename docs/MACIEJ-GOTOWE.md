# Maciej — co jest gotowe (log agentów)

> **Jedna strona do przejrzenia.** Agenci dopisują **append-only** (najnowsze **na górze**).  
> **Czat:** krótko **`✅ Gotowe:`** / **`⏸️ Czeka:`** · **Ten plik:** pełniejszy zapis tego samego.  
> Szczegóły techniczne → handoff w `dyspozycje/_handoff/` · operacja → `dyspozycje/DZIENNIK-MASTERA.md`

**Ostatnia aktualizacja:** 2026-07-07 (noc — bundle GitHub)

---

## [2026-07-07] ✅ Gotowe — ROBOCZA zbiorcza przed archiwizacją GitHub

| | |
|---|---|
| **Kto** | Integrator F |
| **Co** | Jeden build łączący całą sesję: plony terenu · panel miasta B14 + Auto budowa · klik w drzewku technologii · zapis ustawień kreatora Nowa gra |
| **Pliki źródłowe** | `terrain-yields.json` · `economy.ts` · `cityPanel.ts` · `cityUxFrame.ts` · `sciencePicker.ts` · `scienceHubHud.ts` · `newGameFlow.ts` |
| **Build** | ROBOCZA md5 `dadfc0604fefacc2d8cfcb0f16b10cb2` · stamp `dadfc060` · `gra-robocza/START.html` |
| **Testy** | tsc OK |
| **Od Ciebie** | Ctrl+F5 · `gra-robocza/START.html` · potem archiwizacja GitHub (commit sam) |

**W bundle:** (1) plony Łąka/Równina/Wzgórza/Góry z Panel-A · (2) panel miasta — Auto budowa 3×2, pasek B14 · (3) Badania — klik zielonego węzła w drzewku · (4) kreator — `civ-new-game-prefs-v1` między sesjami · (5) kopie PLAYTEST zsynchronizowane.

---

## [2026-07-07] ✅ Gotowe — Kreator: zapamiętywanie ustawień generatora

| | |
|---|---|
| **Kto** | Integrator |
| **Co** | Przywrócony persist ustawień kreatora „Nowa gra" (trudność, mapa, tempo, koszty, wzrost ludności, zaawansowane) w `localStorage` |
| **Przyczyna regresji** | Każde otwarcie kreatora zapisywało domyślne wartości przy `render()` — nadpisywało zapisane prefs; wczytywanie miast-państw przed skalowaniem opcji mapy też gubiło indeksy |
| **Plik** | `gra/src/ui/newGameFlow.ts` |
| **Klucz localStorage** | `civ-new-game-prefs-v1` (odczyt migracyjny z legacy `civ-newgame-prefs-v2`) |
| **Build** | ROBOCZA md5 `69ee33777a5e219bdebd559145d1770b` · stamp `69ee3377` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra → ustaw opcje → menu / odśwież → Nowa gra → te same wartości |

---

## [2026-07-07] ✅ Gotowe — Eksport plonów terenu (Panel-A → gra)

| | |
|---|---|
| **Kto** | Integrator / panel |
| **Co** | `Panel-A-Plony-Terenu.xlsx` → `terrain-yields.json` · gra czyta JSON w `economy.ts` (okolica, tooltip, tura) |
| **Zmiany Ż/P/H** | Łąka 4→3 Ż · Równina 1→2 P · Wzgórza 2→3 P · Góry 0→4 P · Rzeka/Las bez zmian |
| **Plik** | `gra/data/terrain-yields.json` · `gra/src/game/economy.ts` (podpięcie JSON zamiast stałych) |
| **Build** | ROBOCZA md5 `8f6eb435e89e1f8174dc71e5653f4546` · stamp `8f6eb435` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · Nowa gra · sprawdź plony na mapie / okolicy miasta (Łąka, Równina, Wzgórza, Góry) |

---

## [2026-07-07] ✅ Gotowe — Badania: klik w drzewku technologii

| | |
|---|---|
| **Kto** | Integrator / UI |
| **Co** | Wybór celu badań **kliknięciem zielonego węzła** w drzewku (nie tylko lista po lewej) · zablokowane = tooltip bez akcji |
| **Plik** | `gra/src/ui/sciencePicker.ts`, `gra/src/ui/scienceHubHud.ts` |
| **Build** | ROBOCZA md5 `d52424e508cfb66d50bce0700e2e6b28` · stamp `d52424e5` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · miasto → Badania → **Pełne drzewko** → klik np. Obróbka drewna → „Aktualnie" u góry się zmienia |

---

## [2026-07-07] ✅ Gotowe — Excel plonów terenu (Żywność / Praca / Handel)

| | |
|---|---|
| **Kto** | Integrator / panel |
| **Co** | `Panel-A-Plony-Terenu.xlsx` — arkusze **Teren-bazowy** (7 typów) + **Bonusy-nakladki** (Rzeka, Las) · tylko 3 surowce do edycji |
| **Plik** | `panele-sterowania/Panel-A-Plony-Terenu.xlsx` · README: `panele-sterowania/README-Panel-A-Plony.md` |
| **Build** | — (dane JSON; build gry po eksporcie) |
| **Od Ciebie** | Edytuj xlsx → w czacie: **eksportuj plony terenu** → potem Ctrl+F5 na roboczej |

---

## [2026-07-07] ✅ Gotowe — Panel miasta: Auto budowa + pasek statystyk (B14)

| | |
|---|---|
| **Kto** | Integrator F |
| **Co** | Panel miasta: sekcja **Auto budowa** — grid 3×2 zamiast poziomego scrolla · górny pasek chipów surowców — `flex-wrap`, bez `overflow-x` · **B14** wyśrodkowanie paska (`fit-content`, bez pustej belki po prawej) |
| **Plik** | `gra/src/ui/cityPanel.ts`, `gra/src/ui/cityUxFrame.ts` |
| **Build** | ROBOCZA md5 `751632d266a607442ad6929a07d35067` · stamp `751632d2` · `gra-robocza/START.html` |
| **Od Ciebie** | Ctrl+F5 · miasto ATENY: pasek wyśrodkowany, kończy się przy „Nauce" · Produkcja → Auto budowa w 2 rzędach |

---

## [2026-07-07] ✅ Gotowe — Handoff plot-code (sesja 06–07.07)

| | |
|---|---|
| **Kto** | Sesja 06–07.07 (zapis dla plot code) |
| **Co** | Pełny handoff: build, wdrożenia, decyzje ZAMKNIĘTE, status bugów B1–B12, priorytety następnego kroku |
| **Plik** | `dyspozycje/HANDOFF-PLOT-CODE-2026-07-06-07.md` |
| **Build** | ROBOCZA md5 `e2c5c711d69065323c2ea3b2be280782` · `gra-robocza/START.html` |
| **Od Ciebie** | **`plot code`** — kontynuacja z repo bez historii czatu |

---

**Ostatnia aktualizacja:** 2026-07-07 (Maciej: gra bootuje, md5 `70b28d10…`)

---

## [2026-07-07] ✅ Potwierdzone — boot naprawiony (Maciej: „działa”)

| | |
|---|---|
| **Build** | md5 `70b28d10abfe641ce08b68e7a3efa430` · stamp `70b28d10` |
| **Fix** | TDZ `anim` w `main.ts` + wcześniejsze cykle nazw miast |
| **Od Ciebie** | Kontynuuj testy z checklisty · `BUG:` gdy coś nie tak |

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

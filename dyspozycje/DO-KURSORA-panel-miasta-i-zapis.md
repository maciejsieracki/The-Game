# DO KURSORA — panel miasta (suwaki) + zapis/wczytanie gry

Data: 2026-07-06. Diagnoza: subagent Opus (INTEGRATOR). Kod: `Civ/gra/gra-robocza/srcKopiaMaster`.
Kontekst: build z klonu GitHub `main`. Bramki: `tsc --noEmit` = 0, `vite build`. Deploy robi INTEGRATOR.

WAŻNE ustalenie: oba objawy panelu były już w migawce `f2df10f` (SPRZED dzisiejszej wymiany UX). To NIE lane UX ani integracja `main.ts` z dziś — to wcześniejszy refaktor panelu miasta na ZAKŁADKI (`paintCityPanelSections`).

---

## ZADANIE 1 — Suwaki podziału handlu widoczne z „Zamożnością" (decyzja projektowa + wykonanie)

Objaw: designerski panel „ZAMOŻNOŚĆ" miał suwaki podziału przychodu z handlu (Skarb / Nauka / Zamożność). Po refaktorze na zakładki suwaki wpadły na osobną zakładkę „Podział handlu" (`handel`) i nie widać ich razem z kartą Zamożność.

Suwaki ISTNIEJĄ w kodzie (NIE usunięte) — `ui/cityPanel.ts`:
- `appendPodzialHandlu` (~@2661), pętla `makeSlider` (~@2692-2716): 3 suwaki `procentPieniadz`=Skarb, `procentNauka`=Nauka, `procentLuksus`=Zamożność (`HANDEL_ZAMOZNOSC_LABEL`). Hook `onPodzialHandluChange` podpięty w `main.ts` (~@5615/@9071) → `editable=true`.
- Panel zakładki: `renderHandelSlidersPanel` (~@6221).
- Zakładka `handel` (`CITY_PANEL_ICONS_RIGHT` ~@6387, tytuł „Podział handlu i zamożność") w `renderRightPanelTab` (~@6533) renderuje `renderHandelSlidersPanel` (suwaki + chip-grid 4 kubełki `handel-chip-grid` @2679) ORAZ `renderWealth` (@2735) pod spodem.
- Martwa ścieżka (prawdopodobnie STARY panel designera bez zakładek): `renderEkonomiaStrip` (~@2645) + `skeleton` (~@5701, id `cs-ekonomia`/`cs-wealth`) — ma suwaki INLINE bez zakładek, ale jest ukryta: `rerender()` (~@6663) natychmiast `return` przez `uxSectionRefresh`.

DECYZJA do podjęcia z Maciejem (design):
- **(A)** wrócić do NIEzakładkowego panelu designera: suwaki + 4 kubełki + Zamożność razem na jednym widoku. Większa robota — złożyć wszystko w JEDNEJ zakładce/sekcji albo przełączyć ramkę z zakładek na skeleton. Sprawdzić martwą ścieżkę `renderEkonomiaStrip`/`skeleton` jako wzorzec.
- **(B)** zostać przy zakładkach, ale upewnić się, że suwaki są czytelne i nieucięte na zakładce „Podział handlu": sprawdzić przycięcie `.civ-w4-tab-card{overflow:hidden}` (~@1001) i wysokość/scroll karty.

Rekomendacja: ustalić z Maciejem docelowy layout (najpewniej A — „jak u designera"), potem wykonać. To zmiana w `ui/cityPanel.ts` (+ ewentualnie `ui/cityUxFrame.ts`).

### DUPLIKAT „SUROWCE W ZASIĘGU" — NIE rozwiązany (aktualizacja po playteście Macieja)

INTEGRATOR usunął wywołanie `appendW4TabFooter(card,city)` @6489 — ale to render MARTWY, więc dubla nie ruszyło (po twardym refreshu Maciej nadal widzi 2 identyczne bloki, oba z „I SZCZEGÓŁY").

Ustalenia (grep całości `srcKopiaMaster`):
- Blok „Surowce w zasięgu" renderuje TYLKO `renderSurowce` (tytuł jedynie `cityPanel.ts:1984`, klasa `civ-w4-surowce-title`). Nie ma drugiej funkcji.
- Jedyne ŻYWE wywołanie: `#cs-surowce-foot` @6658 w `paintCityPanelSections`. Martwe: `appendW4TabFooter`@6473 (usunięte), skeleton-rerender @6710 (`uxSectionRefresh` short-circuit).
- `renderRightPanelTab` (żadna zakładka) NIE woła `renderSurowce`. `showCityUxFrame` dedupuje (`hideCityUxFrame()` @170). `paintCityPanelSections` czyści `mounts.right`.
- MIMO TO dwa bloki → surowce renderuje się 2× w runtime.

PRAWDOPODOBNY WSPÓLNY ROOT-CAUSE duplikatu I braku suwaków — DWA współistniejące systemy panelu:
- (a) STARY „szkielet" designera: `skeleton()` @5701 + `renderEkonomiaStrip` @2645 — ma SUWAKI INLINE + `#cs-surowce` @5736. To pewnie „panel designera", który Maciej pamięta (suwaki widoczne przy Zamożności).
- (b) NOWA ramka zakładkowa: `paintCityPanelSections`/`cityUxFrame` — suwaki na zakładce „handel" + `#cs-surowce-foot`.
Refaktor na (b) nie usunął czysto (a). Jeśli oba renderują → podwójne surowce, a „zniknięte" suwaki designera siedzą w (a).

DO ZROBIENIA (Cursor, z INSPEKCJĄ DOM w przeglądarce — tego nie da się pewnie ustalić na ślepo):
1. Zainspektuj żywy DOM → znajdź dwa węzły `.civ-w4-surowce-foot` / `#cs-surowce*` i ich rodziców; ustal, czy stary `rootEl` (szkielet) jest nadal widoczny obok ramki UX.
2. Decyzja z Maciejem: JEDEN system panelu. Rekom.: skoro cel to „panel designera z suwakami" — przywrócić/uczytelnić (a) i usunąć (b), LUB przenieść inline-suwaki do (b) i zabić (a). **To rozwiązuje OBA objawy naraz** (duplikat + suwaki).
Uwaga: usunięte `appendW4TabFooter` @6489 zostawić (to była martwa duplikacja stopki — czysto).

HIPOTEZA MACIEJA (prawdopodobna): „UX zamontował panel, potem integrator podmontował → dwa mounty." Co do SKUTKU trafna (render 2×). INTEGRATOR wykluczył jednak podwójny mount w KODZIE (nie szukaj tu ponownie):
- `main.ts`: panel otwierany 1× — `openCityPanelForPlayer` → `showCityPanel` @1699 (jedyne wywołanie; `openCityPanelForPlayer` z wielu miejsc, ale zawsze pojedynczo na otwarcie).
- `showCityUxFrame` (cityUxFrame.ts @163) robi `hideCityUxFrame()` @170 na starcie → usuwa istniejącą ramkę (dedup).
- `refreshCityPanelIfOpen` (@5791) i `refresh` → `refreshCityUxFrame` → `paintCityPanelSections` który czyści `mounts.right` (repaint w miejscu, nie dubluje).
- `paintCityPanelSections` wołane TYLKO z cityUxFrame @214/@223; `showCityUxFrame` tylko z `showCityPanel` @6767.
WNIOSEK: w źródle mount jest jeden → drugi render powstaje w RUNTIME. Do potwierdzenia w DevTools: czy istnieją DWA `frameRoot` (`.civ-ux-frame`) w `document.body` (np. `hideCityUxFrame` nie usunął poprzedniego, bo `frameRoot` ref zgubiony przy podwójnym otwarciu), CZY stary `rootEl`/skeleton (`#cs-surowce` @5736) jest widoczny obok ramki. Fix wg tego, co pokaże DOM.

---

## ZADANIE 2 — Zapis/wczytanie gry: PODPIĄĆ istniejący moduł (to nie pisanie od zera)

Moduł ISTNIEJE: `game/save.ts` — `interface SaveGame`, `serializeGame(): string`, `deserializeGame(json): SaveGame` (walidacja wersji), `saveToLocal(slot)`, `loadFromLocal(slot)`. Na górze pliku jest „INTEGRATOR NOTE (what main.ts must gather to fill a SaveGame)" — lista pól stanu do zebrania.

UI ISTNIEJE: `ui/gamePauseMenu.ts` — przyciski `data-act="save"` / `data-act="load"` (Load gated `hasSave`); `ui/mainMenu.ts` — „Wczytaj grę" + „Kontynuuj" (gate `save exists`).

BRAK: podpięcie w `main.ts`:
- Save: zebrać stan gry wg INTEGRATOR NOTE w `save.ts` (mapa/heksy, miasta, jednostki, gracze/cywilizacje, tura, skarbiec, pula nauki, technologie, `explored`, dyplomacja) → `serializeGame()` → `saveToLocal(slot)`. Uwaga na `Set` (INTEGRATOR NOTE: `explored` jako Set → tablica).
- Load: `loadFromLocal(slot)` → `deserializeGame()` → odtworzyć CAŁY stan i przerysować scenę.
- Podpiąć handlery przycisków `save`/`load` z `gamePauseMenu.ts` i „Wczytaj/Kontynuuj" z `mainMenu.ts`.

Test round-trip: zapis → „Nowa gra" → wczytaj → stan identyczny (mapa, miasta, jednostki, tura, skarbiec, technologie). Bramka `tsc=0` + smoke.

Cel Macieja: móc zapisać/wczytać, żeby testować dalsze etapy bez przechodzenia gry od nowa.

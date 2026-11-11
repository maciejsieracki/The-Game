STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1
GOAL: wiersze kart encji (koszt/utrzymanie/wymagania surowców) renderują ikony zamiast nazw; nazwa w title/aria-label; bez surowego HTML; bez zmian mechaniki.
ZMIANY/COMMIT: baza 86ebbba98 (kandydat operatora); poprawki obrony w jednym commicie (SHA w polu `sha` raportu zwrotnego). Pliki: gra/src/ui/entityCards/{resourceRows,types,renderer,buildingAdapter,improvementAdapter}.ts; gra/tools/entity-cards-resource-icons-test.cjs, gra/tools/entity-cards-resource-icons-real-render-test.cjs; dowody/obrona-*.png. Bez mechaniki, bez WERSJE.md, bez wonderAdapter.

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (wiersze „Odblokowuje" z gołymi nazwami) — PRZYJMUJĘ
Poprawka: nowy kontrakt `EntityCardRow.valueParts` (tekst + `{id}`), renderer buduje text node dla tekstu i chip bez liczby dla surowca (`resourceAmountChipHtml`, nazwa w title/aria-label). Tokenizer `resourceTextParts` (resourceRows.ts) rozpoznaje nazwy i odmiany, 2-wyrazowe („ruda żelaza") z pierwszeństwem; nie ikonizuje nazw budynków/epok („Odlewnia brązu/żelaza", „Kopalnia złota", „epoki Żelaza", „budynki brązu") ani fragmentów technicznych (`hex.zloze=sol`, `zloto-access.ts`). Notatka deweloperska w nawiasie (`TYP 1 — bez desek, B-SUROW-BUD-03`) jest usuwana z wiersza (wyciek id dewelopera). Podobnie `(hex.zloze=…)`, `(econ-params.json:…)`, `(src/game/….ts:…)` w „Teren"/„Do czego".
Dowód: test A (26 pass) — tartak „Odblokowuje" = `{drewno}` bez TYP/B-SUROW; stadnina = `{kon} (jednostki konne)`; zrzuty dowody/obrona-karta-improvement-tartak.png, obrona-karta-improvement-stadnina.png (w Chromium oba wiersze „Odblokowuje" mają ikonę).

### Zarzut 2 (wymagania: „Dodatkowe warunki" / „Warunek") — PRZYJMUJĘ
Adaptery: buildingAdapter „Dodatkowe warunki", improvementAdapter „Warunek", a także „Teren" i „Do czego" idą przez `proseRowFields`. Dowód: stolarnia = `{drewno} w magazynie państwa…`; mennica = `Dostęp do {zloto} (własna Kopalnia złota … posiadającą {zloto})` (Kopalnia złota zostaje tekstem); kopalnia żelaza „Warunek" = `{ruda_zelaza} → magazyn (Odlewnia żelaza)`. Zrzut: obrona-karta-building-mennica.png, obrona-karta-building-stolarnia.png. Łącznie 40 wierszy `valueParts` na kartach z danych (wydruk `DUMP_PARTS=1`).

### Zarzut 3 (test A ślepy) — PRZYJMUJĘ
Filtr `RESOURCE_ROW_LABELS`/`isResourceRow` usunięty. Test sprawdza KAŻDY wiersz KAŻDEJ karty (unit 75, building 41, improvement 22, technology 32); `value` bez `valueParts` oraz każda część tekstowa `valueParts` musi nie zawierać gołej nazwy surowca. Wyjątki są jawne i uzasadnione w kodzie testu (`isExempt`): sekcje prose/top3 i Opis/Rys historyczny (narracja), wiersze „Epoka…" (nazwa epoki Kamień/Brąz/Żelazo, nie surowiec), karty cudów (zarzut 4). Test liczy i drukuje wyjątki (1064 wierszy). Weryfikacja wykrywalności: przed poprawką adapterów po poluzowaniu filtra test dał FAIL z listą trafień (m.in. „Epoka wejścia", „Do czego", „Teren"); po poprawce 0. Dodano 6 asercji na konkretne przypadki z zarzutów.

### Zarzut 4 (cuda: „Teren (Rzeka…): +2 Praca, +2 Drewno") — ODRZUCAM (wyłączenie udokumentowane)
Dowód: BONUS_LABEL w wonderAdapter.ts opisuje oś PLONÓW/bonusów hexa („+2 Drewno" = plon pola, nie koszt/utrzymanie/wymaganie surowca z magazynu), a dispatch GOAL wymienia koszt/utrzymanie/wymagania; Evaluator sam określił to jako lukę niższej wagi wymagającą ABC. Dispatch (DODATEK) zabrania zmian poza allowlistą (wonderAdapter poza nią). Rekomendacja do orkiestratora: jeśli właściciel chce ikon także przy plonach cudów — osobny temat/ABC. W teście wyłączenie jest jawne (`kind === 'wonder'`).

## TESTY (surowe wyjścia z tej rundy, worktree na baza+poprawki)
- tsc --noEmit: exit 0
- logic-test: 213/213; tech-tree-test: 20 pass 0 fail; research-test: 33/33; unit-replace-test: 21/21; combat-test: 6/6
- entity-cards-resource-icons-test: 26 pass, 0 fail (było 20)
- entity-cards-resource-icons-real-render-test (Chromium /opt/pw-browsers/chromium-1194): 112 pass, 0 fail (nowe karty: stolarnia, mennica, stadnina; XSS dla valueParts: `<img>`, `<i>`, `<u>` w częściach i kwocie — tylko tekst, skrypt nie wykonany)
- ids-leak-audit: 1648 ok, 0 FAIL; wonder-text-no-raw-ids: 132 ok, 0 FAIL
- resource-icons-everywhere-test: 10 PASS; resource-icons-everywhere-render-test: 13 PASS; resource-amount-chip-icons-real-render-test: 29 PASS (to jest „chip-icons-real-render" z dispatchu; plik o nazwie chip-icons-real-render-test.cjs nie istnieje)
- improvement-adapter-resource-note-test: 77 pass, 0 fail
- building-detail-card-entitycard-migration-test: 54 pass, 1 FAIL — ta sama asercja co na bazie (dług bazowy, „dopełnia sekcję Uwagi"), nie regresja
- Mutacja: wyłączenie gałęzi `valueParts` w rendererze -> real-render-test 78 pass / 1 FAIL (łapie XSS/ścieżkę prozy; uczciwie: asercje wierszowe w Chromium filtrują wiersze po `.bld-res-chip`, więc zniknięcie chipów w prozie wykrywa test A na poziomie adapterów + ta jedna asercja)

## BLOKADY / NOTATKI
- NIE_ZMIERZONO: układ na wąskim ekranie; Civpedia/wiki; karty poza 7 zrzutami.
- Uwaga: wiersz „Warunek" Tartaka nadal zawiera tekst deweloperski „(v0.1 bez ilości)" i Warzelni „hex.zloze=sol" poza nawiasem oraz „(kanon: …)" — dane w terrain-improvements.json, poza zakresem tematu (sugestia: osobny temat czyszczenia danych/R-WEB-UI-RAW-IDS).
- Założenie: nazwa „Cyna"/„cyny" (bez id surowca w magazynie, tylko `ruda_cyny`) zostaje tekstem.
- Epoki („Epoka wejścia: Kamień/Brąz/Żelazo") zostają tekstem — to nazwy epok.

RUNDY: obrona 1 (Evaluator r1 -> obrona r1); limit 5.
NASTĘPNY KROK: ponowny Evaluator (zarzuty 1-3 przyjęte, 4 odrzucony z udokumentowanym wyłączeniem), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

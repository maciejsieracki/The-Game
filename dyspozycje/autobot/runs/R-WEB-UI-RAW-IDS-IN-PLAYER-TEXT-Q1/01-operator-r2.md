# R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1 — Operator, runda 2 (odpowiedź na zarzuty)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1
GOAL: Tekst dla gracza (efekty cudów, karty, tooltipy, listy) pokazuje nazwy wyświetlane, nigdy snake_case; jeden resolver (`gra/src/game/text-names.ts`); audyt przecieków z tabelą; strażnik testowy obejmuje dane, nie tylko listę ręczną.
ZMIANY/COMMIT: baza r1 `95ce7bae6` (kod r1 `60f31fc82`). Kod r2: patrz sekcja „Commit" na końcu. Allowlista r2: `gra/src/game/text-names.ts`, `gra/src/main.ts` (tylko stringi/fallbacki), `gra/src/ui/cityPanel.ts`, `gra/src/ui/diplomacyTradeBasket.ts`, `gra/src/ui/techDiscoveryNotice.ts`, `gra/src/ui/newGameFlow.ts`, `gra/src/ui/entityCards/{wonderAdapter,improvementAdapter,technologyAdapter}.ts`, `gra/tools/wonder-text-no-raw-ids-test.cjs`, `dyspozycje/autobot/runs/R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1/**`. Brak zmian w `gra/data/`, `WERSJE.md`, `gra-robocza/`, liczbach i efektach cudów.
TESTY: patrz sekcja „Testy".
BLOKADY: patrz sekcja „Odpowiedzi na zarzuty" pkt 4 i 5 (decyzje orkiestratora).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control (Sonnet) na commicie r2. Orkiestrator: rozstrzygnąć (a) zakaz Ha'amonga z dispatchu, (b) siedem nazw warunków poza danymi (`wonders.json` poza allowlistą).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny w worktree, bez push).

---

## Odpowiedzi na zarzuty (r1 → r2)

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Brak audytu przecieków (GOAL pkt 2) i tabeli plik:linia | **PRZYJMUJĘ** | Tabela niżej. Audyt wzorcowy (grep po `??`, `\|\|`, `label:`, `${id}`) + miejsca nazwane w zarzucie. |
| 2 | Wycieki poza resolverem: wonderAdapter:109/118, technologyAdapter:195, main.ts:5372/4887, cityPanel:6981/7130/11610, sciencePicker:456 | **PRZYJMUJĘ** wszystkie oprócz sciencePicker:456 | Naprawy w tabeli. sciencePicker:456 **ODRZUCAM** (dowód niżej). |
| 3 | Strażnik pokrywa tylko wonderEffectsText i wonderAdapter; lista KNOWN_IDS ręczna | **PRZYJMUJĘ** | Strażnik rozszerzony: (a) id terenów/warunków wyprowadzone z `wonders.json` (typTerenu, wymagaTerenu, warunek) i z `terrain-improvements.json`; (b) każdy id z danych musi mieć jawną nazwę (`maJawnaNazwe`), nie fallback; (c) skan źródłowy 7 plików UI/tekstu pod kątem gołych `?? id/k/key`, `label: key`, `|| wonder.id`. Modal w `main.ts` nadal weryfikowany przez `wonderEffectsText` (delegat), nie przez DOM — patrz NIE_ZMIERZONO. |
| 4 | Nazwy „Mała rzeka”, „Rzeka w sąsiedztwie”, „Tropiki”, „Sąsiedztwo rzeki”, „Przy mieście”, „Trudny teren”, „Płaski teren” wpisane na sztywno | **PRZYJMUJĘ częściowo** (dowód braku źródła) | `grep` po `gra/data/` nie zawiera tych nazw. Id występują tylko jako klucze warunków w `wonders.json` (`rzeka_mala`, `rzeka_sasiad`, `hex_sasiad_rzeka`, `tropiki`, `przy_miescie`, `trudny_teren`, `plaski_teren`) — brak pola `nazwa`. Tabela w `text-names.ts` jest jedynym źródłem tych etykiet. Dodanie `nazwa` do `wonders.json` wymaga allowlisty spoza dispatchu → **decyzja orkiestratora**. Strażnik pkt 5 wyłapie każdy nowy id warunku bez jawnej nazwy. |
| 5 | Ha'amonga: kryterium „zawiera Łowiska rybackie i Łąka” sprzeczne z decyzją #186/#197 | **ODRZUCAM kryterium** (dowód) | Commit `d0f08d184` (decyzja R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1) usunął te wpisy z `bonusy.teren`; `wonder-haamonga-no-dead-bonuses-test` (exit 0) wymaga pustej listy. Zgodnie z decyzją: tekst Ha'amonga = blok miasta „Miasto +3 kultury, +3 żywności (× każde miasto)”, bez id. Formalne uchylenie kryterium w dopisku dispatchu → orkiestrator. Nazwy „Łowiska rybackie”/„Łąka” nadal poprawnie zwracane przez resolver (test 3). |
| 6 | Testy niezielone (terminology-trade-vs-tax, tech-cards-top5, civpedia-karty-nazwa-przyciskiem, wonder-transfer-on-conquest) | **PRZYJMUJĘ jako dług zastany** | Komunikaty FAIL są identyczne jak w raporcie recenzenta z bazy `7b201afcd`: Łodzie rybackie 6/6/6 vs 2/3/3; Sztuka wojenna Top3 = NIE_USTALONO; karta budynku 0 linków krzyżowych; migawki aneksji/cesji w main.ts. Poza zakresem tematu. Przyjmuję korektę: `civpedia-caly-wiersz-przyciskiem-test` = exit 0 (moja deklaracja r1 była nieprecyzyjna). |

### Dowód dla odrzuconego punktu: sciencePicker.ts:456

`for (const key of splitLabels(node.wymaganeUlepszenie))` → `IMPROVEMENT_NAME_TO_KEY[key]` (mapa `nazwa → klucz`, `ui/techDiscoveryNotice.ts:129-134`, budowana z `nazwa` z `terrain-improvements.json`). Zatem `key` jest już nazwą wyświetlaną, a `label: key` pokazuje nazwę. Fallback `?? key` dotyczy wyłącznie `iconKey` (ikona), nie tekstu. Brak zmiany.

---

## Audyt przecieków — tabela (plik:linia po r2)

Metoda: `grep -rnE` po wzorcach `?? (id|key|k|kind|type|civ|civType|name|…)`, `|| x.id`, `label: key`, `${id|key|typ|kind|…}` w `gra/src` (ok. 86 trafień `??`, ok. 40 `${…}`) + czytanie kontekstu każdego trafienia w strefie tekstu gracza. **Nie jest to pełny audyt każdego szablonu** (patrz NIE_ZMIERZONO).

### Naprawione (tekst dla gracza, w allowliście)

| Plik:linia (r2) | Wzorzec przed | Przykład wycieku | Naprawa |
|---|---|---|---|
| ui/entityCards/wonderAdapter.ts:109, 118 | `BONUS_LABEL[k] ?? k` | klucz `zadowolenie` (teren cudu mundo_perdido) na karcie | `?? humanizeId(k)` |
| ui/entityCards/wonderAdapter.ts:61 | `text(wonder.nazwa) \|\| wonder.id` | id cudu gdy brak nazwy | `humanizeId(wonder.id)` |
| ui/entityCards/improvementAdapter.ts:133 | `BONUS_LABEL[k] ?? k` | nieznany klucz bonusu ulepszenia | `humanizeId(k)` |
| ui/entityCards/technologyAdapter.ts:124, 128 | `` `${key} +N` `` (efekty budynku) | `zywnosc +2` (klucz z przyrostu) | `nazwaWyswietlana(key)` → „Żywność +2” |
| ui/techDiscoveryNotice.ts:152, 156 | j.w. (ta sama funkcja w karcie odkrycia) | j.w. | j.w. |
| ui/entityCards/technologyAdapter.ts:196 | `CIV_NAME_BY_ID[id] ?? id` | id cywilizacji na karcie odkrycia | `?? nazwaCywilizacji(id)` |
| ui/entityCards/technologyAdapter.ts:257, 311, 373, 384, 481 | `b.nazwa ?? b.id`, `w.nazwa ?? w.id` (etykiety i lista „Zbuduj …”) | id budynku/cudu bez nazwy | `humanizeId(b.id)` / `humanizeId(w.id)` |
| ui/cityPanel.ts:6982 | `findBuildingDef(...)?.nazwa ?? id` (wymagania budynku) | id budynku-wymogu | `humanizeId(id)` |
| ui/cityPanel.ts:7131 | j.w. (rodzic ulepszenia) | id budynku-rodzica | `humanizeId(id)` |
| ui/cityPanel.ts:10056 | `IMPROVEMENT_KEY_TO_NAME[key] ?? key` (zasięg okolicy) | klucz ulepszenia | `nazwaWyswietlana(key)` |
| ui/cityPanel.ts:11611 | `def?.nazwa ?? id` (lista budowy) | id budynku | `humanizeId(id)` |
| main.ts:4888 | `labels.get(id) ?? id` (lista rekrutacji imperium) | id miasta | `humanizeId(id)` |
| main.ts:5375 | `panstwa[civType]?.nazwa ?? civType` (`civWonderDisplayName`) | `egipt` w tekście cudu | `?? nazwaCywilizacji(civType)` |
| ui/diplomacyTradeBasket.ts:241 | `item.cityLabel ?? item.id` | id miasta w koszyku | `humanizeId(item.id)` |
| ui/diplomacyTradeBasket.ts:463, 488 | `id.charAt(0).toUpperCase()+id.slice(1)` | `ruda_zelaza` → „Ruda_zelaza” | `nazwaWyswietlana(id)` → „Ruda żelaza” |
| ui/diplomacyTradeBasket.ts:471 | `` id + ' (' + pn + ' PW)' `` | surowy id w etykiecie | `nazwaWyswietlana(id) + …` |
| ui/newGameFlow.ts:1713 | `s?.lbl ?? key` | klucz ustawienia | `humanizeId(key)` |

Uwaga: `humanizeId` daje ASCII-owy fallback bez diakrytyki (np. `zelazo`→„Zelazo”), jeśli id nie ma nazwy w tabeli/danych. Nazwy z `resources.json` (kolumna „Surowiec”, np. „Żywność”, „Ruda żelaza”, „Złoto”) są teraz w resolverze przez slug (`NAZWY_SUROWCOW`), więc surowce mają polskie znaki.

### Odrzucone (nie są tekstem gracza lub są kluczami dopasowania)

| Plik:linia | Powód |
|---|---|
| ui/sciencePicker.ts:456 `label: key` | Nazwa z `wymaganeUlepszenie` (dowód wyżej). |
| ui/entityCards/technologyAdapter.ts:210, 218 `hidden.has(b.nazwa ?? b.id)` | Klucz dopasowania do listy ukrytych, nie wyświetlany. |
| ui/entityCards/techDeadEffects.ts:42 `.map((b) => b.nazwa ?? b.id)` | Lista nazw do dopasowania (martwe efekty), nie wyświetlana. |
| main.ts:4193 `console.log(... label ...)` | Log konsoli, nie UI. |
| main.ts:4507, ui/entityCards/technologyAdapter.ts:295, ui/techDiscoveryNotice.ts:425 `?? key` | Klucze ikon (`ikonaId`, `iconKey`), nie tekst. |
| ui/unitInfoCard.ts:225, ui/entityCards/unitAdapter.ts:78 `${target}: ${bonus}` | Tekst z `counters.json` (`Cel (typ)`, `Bonus`), już polski; nie id. Sprawdzone kontekstowo, nie zmierzono na wszystkich danych. |
| ui/empireDetailPanel.ts:3197 `Typ: ${r.typ}` | `typ` z `resources.json` („surowy”, …), polska etykieta. |
| ui/hexContextTooltip.ts:198, 482, 567 | `improvementDisplayName(key)` — wartość z danych; fallback poza allowlistą (patrz niżej). |

### Poza allowlistą — zgłoszone, NIE zmieniane (decyzja orkiestratora)

| Plik:linia | Wzorzec | Uwaga |
|---|---|---|
| gra/src/game/terrain-improvements.ts:458 | `IMPROVEMENTS[key]?.nazwa ?? key` (`improvementDisplayName`) | Używane przez tooltip `hexContextTooltip.ts:482,567`. Fallback prawdopodobnie nieosiągalny (wszystkie ulepszenia mają `nazwa`) — NIE_ZMIERZONO. |
| gra/src/game/building-stock-cost.ts:171 | `STOCK_RESOURCE_LABEL[key] ?? key` | Etykieta surowca w kosztach; fallback dla kluczy spoza tabeli. |
| gra/src/game/diplomacy-credibility.ts:510, 514 | `CREDIBILITY_*_LABELS_PL[typ] ?? typ` | Tabela kluczowana typem `CredibilityEvent` (pełna?) — NIE_ZMIERZONO pokrycia. |
| gra/src/game/improvement-tech.ts:103 | `nazwa: row.nazwa ?? key` | Wartość trafia do `terrainUnlockLabelsForTech` (karta odkrycia). |
| gra/src/game/era-gate-ui.ts:106 | `getWonderById(id)?.nazwa ?? id` | `id` pochodzi z listy cudów — prawdopodobnie nieosiągalny. |
| gra/src/wonderpreview/main.ts:144, 228 | `WONDER_NAMES[id] ?? id` | Osobny entry `vite.wonderpreview.config.ts` — narzędzie podglądu modeli, nie gra. |

---

## Testy (commit r2, drzewo robocze)

- `npx tsc --noEmit` (gra/): **exit 0**.
- `node gra/tools/wonder-text-no-raw-ids-test.cjs`: **132 ok, 0 FAIL** (r1: 88 ok). Zawiera: wszystkie 19 cudów (tekst + karta), konkretne nazwy (Pustynia, Mała rzeka, Farma, Tropiki, Łowiska rybackie, Łąka, Egipt), pokrycie danych (każdy id warunku z `wonders.json` ma jawną nazwę; każdy id z `terrain-improvements.json` bez „_”), skan źródła 7 plików.
- `logic-test.cjs`: **exit 0**.
- Regresja wąska (wonder-*, terrain-names-equivalence, building-cards-top5, tech-cards-top5, civpedia-*, terminology-trade-vs-tax, wonder-transfer): 22 × exit 0, 4 × exit 1 — **te same cztery co w bazie** (sekcja „Odpowiedzi” pkt 6). `building-cards-top5` i `civpedia-karty-spojnosc-q1-c` = exit 0 przy pełnych zależnościach (playwright obecny).
- Szeroka sweep: **176 testów** importujących zmienione moduły (`techDiscoveryNotice|diplomacyTradeBasket|text-names|cityPanel|newGameFlow|*Adapter`):
  - na drzewie r2: 74 × exit 0, 102 × exit ≠ 0;
  - **wszystkie 102 także exit ≠ 0 na bazie `7b201afcd`** (ten sam `node_modules`); zero testów przechodzi na bazie i pada na r2.
  - Przyczyny po stronie środowiska: brak Chromium (`browserType.launch … /usr/bin/chromium`), brak `playwright` w zależności użytym do sweepu, testy źródłowe na kotwice (np. `citizen-resource-upkeep`), pre-existing błąd esbuild `Multiple exports with the same name "renderBuildList"` w `cityPanel.ts:12361` (także na bazie; `budynek-garnizon-test`).
- Uwaga procesowa: testy `civpedia-*` i `building-*` zapisują dowody PNG do `dyspozycje/autobot/runs/*/dowody/` **w drzewie roboczym**. Zmiany tych plików zostały przywrócone (`git checkout`) przed commitem i **nie są częścią commita**.

## Czego NIE sprawdzono (NIE_ZMIERZONO)

- Przebieg w Chromium (modal „CUD UKOŃCZONY”, karta cudu w grze) — brak przeglądarki w środowisku.
- Pełny audyt każdego szablonu `${…}` w CIVPEDIA, powiadomieniach i wiki (`wikiBundle.json`) — objęte tylko wzorcami z tabeli.
- Osiągalność fallbacków poza allowlistą (sekcja „Poza allowlistą”).
- Pokrycie `CREDIBILITY_*_LABELS_PL` i `STOCK_RESOURCE_LABEL` względem pełnych typów.

## Otwarte decyzje dla orkiestratora

1. Ha'amonga: formalnie uchylić kryterium „zawiera Łowiska rybackie i Łąka” (sprzeczne z #186/#197, `d0f08d184`).
2. Siedem nazw warunków (Mała rzeka, Rzeka w sąsiedztwie, Tropiki, Sąsiedztwo rzeki, Przy mieście, Trudny teren, Płaski teren): czy dodać pole `nazwa` do `wonders.json` (wymaga rozszerzenia allowlisty), czy zostawić tabelę w `text-names.ts`.
3. Rozszerzyć allowlistę o pięć plików `game/` z tabeli „Poza allowlistą” albo zaakceptować jako dług.
4. Terminologia (C do ABC, nie zmieniano): `BONUS_LABEL` w `wonderAdapter` mapuje `pieniadz` → „Pieniądz”, a w `improvementAdapter` → „Podatek”; `handel` → „Podatek” w obu. Sprzeczne z zasadą „pieniądz = po Mennicy, handel = wymiana”.
5. Brak sprawdzenia w przeglądarce — wymagany przebieg Chromium przed deployem (jeśli orkiestrator wymaga dowodu wizualnego).

## Commit

Commit lokalny na gałęzi worktree (SHA w raporcie orkiestratora po `git rev-parse HEAD`). Bez push.

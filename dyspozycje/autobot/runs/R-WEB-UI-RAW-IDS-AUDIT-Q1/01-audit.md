STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-AUDIT-Q1
GOAL: pełny audyt przecieków id snake_case/ASCII do tekstu gracza + naprawa resolverem `text-names.ts` (bez zmiany liczb/efektów)
ZMIANY/COMMIT: patrz tabela; strażnik `gra/tools/ids-leak-audit-test.cjs`
TESTY: `npx tsc --noEmit` OK; `node tools/wonder-text-no-raw-ids-test.cjs` 132 ok/0 FAIL; `node tools/ids-leak-audit-test.cjs` 1609 ok/0 FAIL
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: decyzje właściciela (pytania niżej), potem deploy wg procesu
DEPLOY/PUSH: NIE WYKONANO (deploy); push gałęzi roboczej — patrz commit

## Tabela przecieków (plik:linia → przykład → naprawa)

| Plik:linia (przed) | Przykład wycieku | Naprawa |
|---|---|---|
| ui/entityCards/improvementAdapter.ts:199 | karta ulepszenia, wiersz „Odblokowuje surowiec": `bydlo`, `owce`, `lama`, `kon`, `glina`, `kamien`, `sol`, `zloto`, `ruda_zelaza`, `ruda_cyny` | `nazwyZListyId()` → Trzoda/Owce/Lama/Koń/Glina/Kamień/Sól/Złoto/Ruda żelaza/Ruda cyny |
| ui/entityCards/improvementAdapter.ts:189 | „Ulepszenie bazowe": `droga` | `nazwaWyswietlana()` (link bez zmian) |
| ui/entityCards/improvementAdapter.ts:141 | „Ruch" droga brukowana: notatka dev z `bonus_ruch`, `ROAD_BRUK_MOVE_SPEED_MULT`, ścieżką pliku | notatka `bonus_ruch_uwaga` nie jest renderowana (jak `tech_uwaga`); wartość bez zmian |
| ui/entityCards/technologyAdapter.ts:220/393/426 | „Dostęp do surowca": `krowa/byk, owce, bydlo, lama` (Oswojenie zwierząt) | `nazwyZListyId()` na `Odblokowuje surowiec.` i „wymóg badania" |
| game/terrain-improvements.ts:458 | `improvementDisplayName` → fallback `key` (tooltip hexa, toasty) | fallback `humanizeId` |
| ui/hexContextTooltip.ts:537 | nazwa terenu = surowy `terenBazowy` gdy brak w `TEREN_LABEL` | fallback `nazwaWyswietlana` |
| main.ts:20354 | wymiana tech-za-tech: „(`techOfferId`)" = slug | `techNameFromSlug` / `humanizeId` |
| main.ts:39158/39197 | toast wycinki/budowy: `pick.key` gdy brak `nazwa` | `nazwaWyswietlana(pick.key)` |
| main.ts:8438/8490/8502/23654 | fallback `techSlug`/`slug` jako nazwa odkrycia | `humanizeId` |
| ui/techDiscoveryNotice.ts:387/399/453/457 | nazwa budynku `b.nazwa ?? b.id` | `humanizeId` |
| ui/diplomacyDealDisplay.ts:83, game/diplomacy-display.ts:510 | pozycja umowy typu domyślnego: surowe `id`/`typ` | `nazwaWyswietlana` |
| game/improvement-tech.ts:103, game/era-gate-ui.ts:106, game/building-stock-cost.ts:171, game/diplomacy-credibility.ts:510/514, ui/techTreeView.ts:276/734, ui/sciencePicker.ts:464/1121 | gołe `?? id/key/pid/typ` (dziś nieosiągalne — wszystkie encje mają nazwę — ale to jedyna ścieżka do surowego id przy nowych danych) | `humanizeId` / `nazwaWyswietlana` |
| wikiBundle.json (`full`, 154 hasła) → ui/wikiHubHud.ts:413 | widok „pełny" haseł zaczyna się tabelą metadanych: `poradnik_ref`, `json_ref` (`buildings.json`), `status_v1`, `gra-id` (`kopalnia_miedzi`…), ścieżki `docs/…` | `stripEncyMetadata()` (render) + tytuł hasła |
| wikiBundle.json wikiM: pojecia/handel-surowcami-dyplomacja, zalozanie-miasta, manpower-rekruci, budynki/pretorium, technologie/religia, pojecia/cuda-swiata | `pakiet_wielkosc`, `handel_surowce`, `min_dystans_miast`, `jednostka_koszt_ludnosci = 0`, `prawo_pretorium`, `kamienne_kregi → swiatynia`, „Handel_procent (CUDA-HANDEL-01, Maciej…)", `game/trade-routes.ts` | tekst polski; poprawione w `docs/encyklopedia/**` i w bundlu (podmiana tekstu, bez regeneracji bundla — bundle jest rozjechany z docs poza tym tematem) |
| wikiBundle.json poradnik 10/12/14 | `river_attack_mult`, `sojusz_defensywny / sojusz_pelny`, `ai_agresywnosc`, `ai_priorytet_militarny`, `dip_prog_wojny`, `civ-matrix.json` | tekst polski; docs/PORADNIK-GRACZA + bundle |

Czyste (bez wycieków po audycie): karty budynków, jednostek, cudów, odkryć (runtime po WSZYSTKICH encjach z danych), panel miasta `cityPanel.ts` (brak gołych fallbacków id), komunikaty `main.ts` (reszta trafień to `diagInfo/diagWarn` i logi `[AI …]`, niewidoczne dla gracza).

## Pytania do właściciela (NIE zmieniano)

1. Terminy Danina / Podatek / Handel — bez zmian (zakaz z dispatchu); w tekstach wiki nadal występują obok siebie („Daninę/Podatek miasta").
2. `tech.json` „Dostęp do kamień" / „Dostęp do drewna" jako wartość pola „Surowiec (wymóg badania)" — błąd gramatyczny w DANYCH („Dostęp do kamień" zamiast „kamienia"). Poprawić dane?
3. `bonus_ruch` (ulepszenie „Droga brukowana") to MARTWE POLE (`bonus_ruch_uwaga`), a karta nadal pokazuje wiersz „Ruch: <liczba>". Ukryć wiersz całkiem? (decyzja produktowa)
4. Wiki encyklopedii: ~50 haseł technologii/pojęć odwołuje się w backtickach do nazw plików kodu (`tech-tempo.ts`, `tech.json`, `econ-params.json`, `buildings.json`, `civs.json`, `docs/decyzje/`) — to nie snake_case id, więc poza tym tematem. Usunąć odwołania do plików z tekstu dla gracza (osobny temat R-DOC-WIKI-NO-FILEREFS)?
5. `tech.json` „Odblokowuje surowiec." używa etykiety „krowa/byk" (surowiec o dwóch nazwach) — zostawione bez zmian; ujednolicić nazwę surowca?

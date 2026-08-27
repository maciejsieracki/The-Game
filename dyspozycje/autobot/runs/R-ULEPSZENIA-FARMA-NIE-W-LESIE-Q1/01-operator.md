# 01 — OPERATOR, runda 1 — R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1

DATA: 2026-08-27 · ROLA: Operator (Opus 5, effort high) · RUNDA 1/5
GALAZ: `autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` · WORKTREE: `/home/user/wt-op-farma`

## 1. Inwentaryzacja punktow egzekwowania (kryterium 1) — z wlasnego przeszukania

Przeszukanie: `grep -rn "isFarmBaseTerrain|FLAT_FARM|'farma'|galleryTerrainEligible|
isImprovementBlockedOnForest"` po `gra/src` i `gra/tools`, plus odczyt kazdego trafienia.
Znalezione **11 punktow** (P1-P11); 8 wymagalo zmiany albo asercji, 3 sa jawnie zostawione.

| # | Punkt | Plik:linia (przed zmiana) | Rola | Co zrobione |
|---|---|---|---|---|
| P1 | GRACZ — panel budowy | `map/improvement-build.ts:731` `case 'farma'` -> `isFarmBaseTerrain` | kwalifikacja gracza | regula odwrocona (P-A) |
| P2 | GRACZ — commit | `map/improvement-build.ts:362` `computeImprovementBuildImpact` -> `isImprovementBlockedOnForest` | drugi, niezalezny gate; `applyBuildRequest` w main.ts NIE powtarza `qualifies()` | `farma` przeniesiona z COEXIST do BLOCKED (P-B) |
| P3 | AI GRACZA (automat ulepszen wspierajacy gracza) | `game/auto-improvements.ts:348` `pickAutoImprovements` -> `buildImprovementQualifier` | dziedziczy P1+P2 | plik NIE tkniety; osobna asercja zachowania |
| P4 | AI CYWILIZACJI (komputerowi przeciwnicy) | `game/ai.ts:1949` `planCityImprovements` -> `pickAutoImprovements` | dziedziczy P1+P2 | plik NIE tkniety; OSOBNA asercja na `ownerId=3` |
| P5 | TOOLTIP heksu | `ui/hexContextTooltip.ts:456` + `:471` | lista „Mozliwe ulepszenia (teren)" | dziala przez P1+P2; poprawiony komentarz warunku terenu farmy |
| P6 | Galeria 3D / bramka wstepna tooltipa | `map/improvement-build.ts:893` `galleryTerrainEligible('farma')` | „na jakim terenie w ogole moze stac" | usuniete `\|\| teren === Wzgorza` (P-C) |
| P7 | `TERRAIN_ALLOW.farma = FLAT_FARM` | `map/improvement-build.ts:408` | galaz `default` switcha | **bez zmian** — `farma` ma wlasny `case`, wpis jest dla niej martwy; zbior `FLAT_FARM` i tak sie nie zmienil |
| P8 | DANE | `data/terrain-improvements.json` `farma.teren` / `farma.warunek` | kanon opisowy | przepisane (P-D), historia decyzji zachowana |
| P9 | Podpowiedz UX przy budowie na lesie | `main.ts:11709` -> `isImprovementBlockedOnForest` + `getImprovementForestBlockHint` | komunikat dla gracza | **main.ts NIE tkniety** — obie funkcje zyja w `improvement-build.ts`; farma dostaje poprawny hint automatycznie („najpierw wyrab las") |
| P10 | Wyrab spod farmy / migracja zapisu | `stripImprovementsWhenForestRemoved`, `FOREST_DEPENDENT_IMPROVEMENT_KEYS`, `terrain-improvements.ts:49 migrateImprovementLayers` | los farm JUZ STOJACYCH | **swiadomie bez zmian** (zakres nierozstrzygniety) + 4 asercje-straznicy, zeby nikt tego nie ruszyl „przy okazji" |
| P11 | Tryb pokazowy `?demo=ulepszenia` | `main.ts:12031` `demoKeysForHex` -> `if (n === Las) return ['farma','tartak','oboz_lowiecki','droga']` | zasiew wizualny do oceny ukladu sektorowego | **NIE tkniety** — patrz nota N1 |

## 2. Zmiany w zrodle

- **P-A** `isFarmBaseTerrain` (`map/improvement-build.ts`): `if (nakladka === Las) return false;
  return FLAT_FARM.has(teren);`
- **P-B** `farma` przeniesiona z `FOREST_COEXIST_IMPROVEMENT_KEYS` do `FOREST_BLOCKED_IMPROVEMENT_KEYS`.
- **P-C** `galleryTerrainEligible` `case 'farma'`: usuniete `|| teren === TerenBazowy.Wzgorza`.
- **P-D** `data/terrain-improvements.json`: `farma.teren` = „Łąka, Równina (bez lasu)";
  `farma.warunek` z data i autorem nowej decyzji (2026-08-27), z jawnym zapisem, ze UCHYLA
  poprzedni zapis z 2026-07-21 — poprzednie brzmienie zacytowane, nie wymazane.
- Komentarze w `improvement-build.ts` i `hexContextTooltip.ts` uzgodnione z nowa regula;
  uchylona decyzja z 2026-07-21 zostaje wszedzie zacytowana jako uchylona.

## 3. Pomiar PRZED i PO (kryterium 2)

Mapa 36x28 „kontynenty", **5 ziaren** (42, 1337, 2026, 7, 99). Liczone realnym
`buildImprovementQualifier` (GRACZ) i realnym `computeImprovementBuildImpact` (COMMIT),
per heks, po calej mapie. Terytorium gracza = kazdy heks ladu (zeby mierzyc regule terenu,
nie zasieg miast).

| kategoria | heksow (5 map) | GRACZ PRZED | GRACZ PO | COMMIT PRZED | COMMIT PO |
|---|---|---|---|---|---|
| Laka + Las | 745 | 745 | **0** | 745 | **0** |
| Rownina + Las | 8 | 8 | **0** | 8 | **0** |
| Wzgorza + Las | 37 | 37 | **0** | 37 | **0** |
| Laka bez lasu | 440 | 440 | **440** | 440 | **440** |
| Rownina bez lasu | 58 | 58 | **58** | 58 | **58** |

Per ziarno (GRACZ, PRZED -> PO): 42: 152/2/9 -> 0/0/0, 85/9 -> 85/9 · 1337: 153/1/4 -> 0/0/0,
89/13 -> 89/13 · 2026: 143/2/13 -> 0/0/0, 82/14 -> 82/14 · 7: 148/0/7 -> 0/0/0, 108/8 -> 108/8 ·
99: 149/3/4 -> 0/0/0, 76/14 -> 76/14. **Zgodne z oczekiwaniem dispatchu.**

Reprezentanci kategorii na mapie 42, sciezki nie-licznikowe (PRZED -> PO):

| kategoria | heks | gracz | AI GRACZA / AI CYWILIZACJI (picker) | tooltip | galeria 3D |
|---|---|---|---|---|---|
| Laka+Las | (10,21) | true -> false | true -> false | true -> false | true -> true (Laka nadal terenem farmowym) |
| Rownina+Las | (16,10) | true -> false | true -> false | true -> false | true -> true (jw.) |
| Wzgorza+Las | (11,17) | true -> false | true -> false | true -> false | true -> **false** |
| Laka bez lasu | (10,10) | true -> true | true -> true | true -> true | true -> true |
| Rownina bez lasu | (15,10) | true -> true | true -> true | true -> true | true -> true |

## 4. Bramka tematu

Nowy plik `gra/tools/farma-nie-w-lesie-test.cjs` — **136 asercji, 0 bledow**.
Tryb pomiaru: `MEASURE=1 node tools/farma-nie-w-lesie-test.cjs` (bez asercji, same liczby).

Sekcje: (1a) `isFarmBaseTerrain` jednostkowo · (1) gracz — panel budowy · (2) gracz — commit ·
(3) AI GRACZA — automat ulepszen · (4) AI CYWILIZACJI — osobne wywolanie na `ownerId=3` ·
(5) tooltip (prawdziwy `buildHexContextTooltipHtml`, nie replika pipeline'u) + galeria 3D ·
(6) pulapka „p-LAS-kie" · (7) straznik zakresu (farmy juz stojace) · (8) mapa z `generateMap`,
nie syntetyk · (9) pomiar PO per ziarno · (10) `terrain-improvements.json`.

**Kryterium 3 — pulapka „p-LAS-kie"** (`combat.ts:638-646`): `normTerrain('Plaskie (rownina/laka)')`
doslownie zawiera podciag `las`. Osobne asercje: nazwa rowniny FAKTYCZNIE zawiera „las"
(warunek istotnosci testu); farma na ROWNINIE BEZ LASU jest DOSTEPNA mimo tego podciagu;
rownina Z LASEM jest NIEDOSTEPNA (rozroznienie dziala w obie strony); commit tez odroznia
oba przypadki; `improvement-build.ts`, `hexContextTooltip.ts` i `auto-improvements.ts` nie
kwalifikuja lasu przez `.includes('las')`.

## 5. Dowod nie-tautologiczny (kryterium 4) — trzy celowane mutacje

Mutacja aplikowana do KOPII zrodla (`FARMA_SRC_DIR`), nigdy do commitowanego drzewa.

| # | Mutacja (jedno miejsce) | Wynik bramki tematu | Czerwone asercje |
|---|---|---|---|
| **M1** | `isFarmBaseTerrain` cofniete do reguly 2026-07-21 (`if (FLAT_FARM.has(teren)) return true; return nakladka === Las && teren === Wzgorza;`) | **133 pass / 3 fail** | `isFarmBaseTerrain: Laka+Las -> false`, `Rownina+Las -> false`, `Wzgorza+Las -> false` |
| **M2** | `'farma'` z powrotem do `FOREST_COEXIST_IMPROVEMENT_KEYS`, usunieta z `FOREST_BLOCKED_IMPROVEMENT_KEYS` | **105 pass / 23 fail** | 4x commit na lesie, `farma jest na liscie ZABRONIONYCH`, pulapka-commit, 3x COMMIT na mapie 42, 14x pomiar PO (kategorie lesne, `commit=152/2/9/...`) |
| **M3** | `galleryTerrainEligible` `case 'farma'` z powrotem `\|\| teren === Wzgorza` | **135 pass / 1 fail** | `galeria 3D: Wzgorza NIE sa juz terenem farmowym` |

M1 osobno na kanonie `map-improvement-qualify-test.cjs`: **114 pass / 3 fail**
(`isFarmBaseTerrain laka+las/rownina+las/wzgorza+las -> false`), po przywroceniu 117/0.

**ZNALEZISKO MUTACYJNE — zglaszam wprost, bo jest to slaby punkt tej zmiany.**
W pierwszym podejsciu M1 dala **128 pass / 0 fail** — zero czerwieni. Powod: dwa gate'y
(`isFarmBaseTerrain` w `qualifies()` i `isImprovementBlockedOnForest` w
`computeImprovementBuildImpact`, wolane na koncu `qualifies()`) **maskuja sie wzajemnie** —
cofniecie samej reguly terenu nie zmienia ANI JEDNEGO wyniku gracza/AI/tooltipa, bo blokada
lesna odcina farme wczesniej. Zeby ta polowa zmiany nie byla nieweryfikowalna, dopisalem
sekcje (1a) — asercje WPROST na eksportowanej `isFarmBaseTerrain`. Dopiero one czerwienia sie
pod M1. Uczciwy opis: **zachowanie w rozgrywce niesie dzis P-B (lista blokad); P-A jest
obrona w glab i jest sprawdzana jednostkowo, nie behawioralnie.**

## 6. Bramki

| bramka | PRZED | PO |
|---|---|---|
| `logic-test.cjs` | 213/213 | **213/213** |
| `tech-tree-test.cjs` | 19 pass, 0 fail | **19 pass, 0 fail** |
| `research-test.cjs` | 33/33 | **33/33** |
| `unit-replace-test.cjs` | 13/13 | **13/13** |
| `combat-test.cjs` | 6/6 | **6/6** |
| `map-improvement-qualify-test.cjs` | 112 pass, 0 fail | **117 pass, 0 fail** |
| `auto-improvements-test.cjs` | 45 passed, 0 failed | **45 passed, 0 failed** |
| `oboz-lowiecki-las-test.cjs` | 91 passed, 0 failed | **91 passed, 0 failed** |
| `hex-tooltip-stadnina-kopalnia-cyny-test.cjs` | 29 passed, 0 failed | **29 passed, 0 failed** |
| `hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs` | **73 passed, 1 failed** (juz w `main`) | **73 passed, 1 failed** (bez zmiany) |
| `farma-nie-w-lesie-test.cjs` (nowa) | — | **136 passed, 0 failed** |
| `tsc --noEmit` | — | **0 bledow** |
| `vite build --outDir /tmp/civ-dist-farma-op` | — | **OK, 35.25 s** |

`map-improvement-qualify-test.cjs` 112 -> 117: **zadna asercja nie zostala skasowana**.
5 asercji kodujacych uchylona regule z 2026-07-21 zostalo ODWROCONYCH (poprzednie brzmienie
zacytowane w komentarzu obok, historia decyzji zachowana), i dopisano 5 nowych
(`rownina+las -> false`, `laka bez lasu -> true`, `rownina bez lasu -> true`,
`farma poza lasem nie blokowana`, `impact null: farma on las`).

## 7. Noty (nie naprawiane w tym temacie)

- **N1 — `main.ts:12031 demoKeysForHex`, tryb `?demo=ulepszenia`.** Zasiewa na kazdym
  zalesionym heksie `['farma','tartak','oboz_lowiecki','droga']`, wiec po tej zmianie pokazuje
  farme tam, gdzie gra jej juz nie pozwala postawic. `main.ts` jest w GRANICACH dispatchu
  (rownolegly temat `R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`), wiec **nie tknalem**.
  Uwaga tonujaca: to sciezka **wizualnego zasiewu do oceny ukladu sektorowego**, nie punkt
  kwalifikacji rozgrywki — ta sama funkcja zasiewa tez `farma` na Pustyni (`case Pustynia:
  out.push('farma')`), co nigdy nie bylo legalne w grze. Temat obozu lowieckiego zostawil ja
  w tym samym stanie (`oboz_lowiecki` tez tam jest). Proponowany osobny temat:
  `P-DEMO-ULEPSZENIA-ROZJAZD-Z-REGULA-TERENU-Q1`.
- **N2 — `hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs` jest CZERWONA w `main`** (73/1),
  **przed moja zmiana i niezaleznie od niej** — zweryfikowane przez `git stash` i uruchomienie
  na nietknietym zrodle. Asercja to regex po zrodle szukajacy linii
  `if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;`,
  ktora temat `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` swiadomie zastapil krotsza wersja bez
  czlonu o zlozu. Nieaktualny test, nie regres kodu. Nie naprawiam — to nie moj zakres (§14,
  C-025). Proponowany osobny temat: `P-BRAMKA-HEX-TOOLTIP-ZLOZE-NIEAKTUALNY-REGEX-OBOZU-Q1`.
- **N3 — farma na Wzgorzach jest teraz niemozliwa CALKOWICIE.** Konsekwencja dyspozycji,
  nie wybor wykonawcy. Zgodnie z dispatchem NIE „naprawilem" tego dopisaniem Wzgorz do
  `FLAT_FARM`. Zglaszam jako **note** do decyzji wlasciciela: jesli intencja bylo tylko
  „nie w lesie", a nie „nigdy na wzgorzu", to potrzebne osobne ECHO. Bramka pilnuje dzis
  stanu „niemozliwa" (`isFarmBaseTerrain: Wzgorza bez lasu -> false`).
- **N4 — `TERRAIN_ALLOW.farma`** (`improvement-build.ts:408`) jest martwy dla farmy
  (ma wlasny `case` w switchu). Zostawiony bez zmian; jego zbior `FLAT_FARM` sie nie zmienil.
- **N5 — potwierdzenie skutku ubocznego z dispatchu.** Wyrab jest od teraz **jedyna** droga
  do farmy na zalesionym heksie. Liczby rundy 3 tematu `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
  przestaja opisywac docelowa gre (`P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1`).
  `tools/rzeka-farma-wyrab-krok1-measure.cjs` (pomiar, nie bramka) wypisuje teraz
  „farma na lesie dozwolona: false" — nie tknalem go, bo to narzedzie tamtego tematu.

## 8. BRAK DOWODU (§13a) — jawnie

- **Nie ma dowodu z zywej przegladarki.** Temat jest regulowy (kwalifikacja), nie wizualny;
  nie robilem zrzutu Playwright. Punkt P6 (galeria 3D `improvepreview`) zmienia to, co
  galeria **moze** pokazac na Wzgorzach — sprawdzone wylacznie kontraktowo przez
  `galleryTerrainEligible`, **nie** przez ogladniecie galerii. Jesli Evaluator uzna P6 za
  zmiane wizualna, ten dowod trzeba dolozyc.
- **Nie ma dowodu z pelnej rozgrywki wielotorowej (MP).** Zielone bramki NIE sa dowodem
  zachowania w rozgrywce. Zmierzone: kwalifikacja gracza, commit, picker automatu, picker AI
  cywilizacji, tooltip, galeria, migracja zapisu. Nie zmierzone: przebieg realnej partii
  ani zachowanie po wczytaniu zapisu w zywej grze.
- **`gra/src/game/ai.ts` i `gra/src/game/auto-improvements.ts` NIE byly czytane w calosci** —
  odczytane zostaly wylacznie miejsca kwalifikacji ulepszen (`planCityImprovements`,
  `pickAutoImprovements` i ich docstringi). Twierdzenie „AI dziedziczy regule" opieram na
  POMIARZE ZACHOWANIA (sekcje 3 i 4 bramki), nie na lekturze calego pliku.

## 9. Kontrakt raportu

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1
GOAL: Farma nie kwalifikuje sie do budowy na heksie z nakladka Las — na zadnym terenie
      bazowym, u gracza i u komputera, we wszystkich punktach egzekwowania.
ZMIANY/COMMIT: gra/src/map/improvement-build.ts, gra/src/ui/hexContextTooltip.ts,
      gra/data/terrain-improvements.json, gra/tools/map-improvement-qualify-test.cjs,
      gra/tools/farma-nie-w-lesie-test.cjs (nowy),
      dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/01-operator.md
      — wszystko w allowliscie; main.ts / ai.ts / auto-improvements.ts NIE tkniete.
TESTY: farma-nie-w-lesie-test 136/0 (nowa) · map-improvement-qualify 117/0 (bylo 112/0,
      +5 asercji, 5 odwroconych wraz z uchylona regula, 0 skasowanych) · auto-improvements
      45/0 · oboz-lowiecki-las 91/0 · logic 213/213 · tech-tree 19/0 · research 33/33 ·
      unit-replace 13/13 · combat 6/6 · tsc --noEmit 0 bledow · vite build OK.
      hex-tooltip-mozliwe-ulepszenia-zloze 73/1 — czerwona JUZ W main, potwierdzone na
      nietknietym zrodle (nota N2), nie regres tej zmiany.
      Mutacje: M1 133/3 (jednostkowo), M2 105/23, M3 135/1 — kazda celowana w jedno miejsce.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO (push wylacznie galezi tematu
      autobot/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1; brak pushu do main, brak integracji, brak deployu)
```

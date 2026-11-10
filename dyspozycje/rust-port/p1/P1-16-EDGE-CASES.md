# P1.16 — Edge case'y i znane błędy (web, pin `edb8fb56`)

**Temat:** R-RUSTPORT-P1-16-EDGE-CASES-Q1 · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium), po obronie na zarzuty Evaluatora
**Pin:** `edb8fb56` (`main`). Odczyt wyłącznie przez `git grep` / `git show edb8fb56:<ścieżka>` (bez checkoutu, bez zapisu w `gra/**`).
**Uwaga 1 (HEAD):** HEAD repo roboczego w chwili weryfikacji obrony = `982cf9cf`. Wcześniejsza deklaracja `51e5ff50` była nieaktualna (`51e5ff50` jest przodkiem `982cf9cf`). Wyniki poniżej dotyczą pinu `edb8fb56`, nie HEAD. Diff `edb8fb56..982cf9cf` w `gra/` = 138 plików (ponownie zweryfikowane; poza zakresem tego tematu).
**Uwaga 2:** dokumenty `BLEDY-DO-NAPRAWY-2026-07-05.md` i `BLAD-B0.*` opisują ścieżki `gra-robocza/` i `src/...` (stare nazwy); w pinie odpowiednik to `gra/src/...`. Stan każdego błędu sprawdzono w kodzie pinu, nie w dokumencie.

## 1. Komentarze TODO / FIXME / HACK / XXX w `gra/src/**/*.ts(x)`

Polecenie: `git grep -nIE '\b(TODO|FIXME|HACK|XXX)\b' edb8fb56 -- 'gra/src/*.ts' 'gra/src/**/*.ts' 'gra/src/**/*.tsx'`
**Wynik: 16 trafień** (FIXME: 0, HACK: 0, XXX: 0). Pliki z trafieniami: 9.

| # | Plik:linia (pin) | Cytat (skrót) | Kategoria | System (P1.14) | Dotyczy P6? |
|---|---|---|---|---|---|
| 1 | `gra/src/battle/battleScene.ts:2566` | `// TODO: general rally recovery -- consume this list...` | TODO w kodzie | walka | tak (P6.13) |
| 2 | `gra/src/battle/battleScene.ts:8977` | `// TODO: general rally recovery.` | TODO w kodzie | walka | tak (P6.13) |
| 3 | `gra/src/game/ai.ts:4764` | `// v0.2 TODO: wieloturowe sojusze, handel, wasalizacja.` | TODO w kodzie | AI | tak (P6.11–12) |
| 4 | `gra/src/game/ai.ts:5037` | `* v0.2 TODO: 'zaproponuj_sojusz', 'zaproponuj_handel' (wieloturowe).` | TODO w kodzie | AI | tak |
| 5 | `gra/src/game/diplomacy.ts:1676` | `(TODO: cap akumulacyjny +15/−10 per religia)` | TODO w kodzie | dyplomacja / kultura-religia | tak (P6.14, P6.16) |
| 6 | `gra/src/game/diplomacy.ts:1677` | `(TODO: cap −10 dla odmiennej religii)` | TODO w kodzie | dyplomacja / religia | tak |
| 7 | `gra/src/game/diplomacy.ts:1688` | `* TODO: Akumulatory per-religia (+15/−10 cap) — uproszczenie na przyszłość.` | TODO w kodzie | dyplomacja / religia | tak |
| 8 | `gra/src/game/turn-economy.ts:195` | `// CityYieldResult (brak city-defense yield) — TODO, poza zakresem ekonomii.` | TODO w kodzie | ekonomia tury | tak (P6.6–8) |
| 9 | `gra/src/game/wonders-data.ts:201` | `// — imperium, nie yield miasta) NIE są tu liczone — TODO, patrz raport zadania.` | TODO w kodzie | cuda świata | tak (P6.17) |
| 10 | `gra/src/main.ts:10222` | `// TODO(A1 — audyt #1): spawnTransferredUnit tworzy jednostkę wyłącznie...` | TODO w kodzie | jednostki (transfer) | tak (P6.4–5) |
| 11 | `gra/src/ui/cityPanel.ts:954` | `* TODO(produkt): pełny model korupcji — od czego zależy...` | TODO w kodzie | miasta (korupcja) | tak (P6.6–8) |
| 12 | `gra/src/ui/cityAttackChoice.ts:11` | `... pominiete -- patrz komentarze TODO nizej` | TODO (odsyłacz) | UI walki | UI → P5 |
| 13 | `gra/src/ui/cityAttackChoice.ts:203` | `<!-- TODO (brak danych w kontrakcie MapSiegeContext)...` | TODO w kodzie | UI walki / kontrakt | P5 + P2 |
| 14 | `gra/src/ui/preBattle.ts:720` | `// ... TODO: dodac headcount, jesli silnik zacznie go liczyc.` | TODO w kodzie | UI przed bitwą | P5 |
| 15 | `gra/src/ui/preBattle.ts:887` | `// TODO (brak danych w kontrakcie): pulsujacy ... znacznik hexa bitwy` | TODO w kodzie | UI przed bitwą | P5 |
| 16 | `gra/src/ui/preBattle.ts:892` | `// TODO (brak danych w kontrakcie): PreBattleUnit nie niesie flagi "wykryty wywiadem"` | TODO w kodzie | UI / dane walki | P5 + P2 |

Poza plikami `.ts/.tsx` trafienia dotyczą 14 plików binarnych/danych, odrzuconych jako fałszywe dopasowania: 13 plików `gra/src/audio/**/*.mp3` oraz `gra/src/data/wikiBundle.json`. Nie są to komentarze kodu.

## 2. Udokumentowane błędy (`dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md`, `BLAD-B0.*`) — stan na pinie `edb8fb56`

Sprawdzone wprost w kodzie pinu (5+ wymaganych przez kryterium):

| ID | Opis w dokumencie | Stan na pinie | Dowód (pin) |
|---|---|---|---|
| B0.1 | Rzeki kończą się w polu: woda kasowana PO `generateRivers()` | **NAPRAWIONY w kodzie** (strukturalnie) | `gra/src/map/generator.ts:422–423` purge przed `generateRivers` (`:495`); komentarz `generator.ts:550` „B0.1: purge wody→ląd tylko PRZED generateRivers". Brak testu wykonanego w tej rundzie. |
| B0.2 | Generacja wolna (flood-fill per próba rzeki, O(n²) w sanitize) | **NAPRAWIONY w kodzie, wydajność NIEZMIERZONA** | `gra/src/map/gen-helpers.ts:3975` `sanitizeCoastHexes` = BFS (komentarz „zamiast O(n²)"); `:5797` `pathEndsAtSea(..., oceanConnected?)` przyjmuje zbiór; wywołania przekazują `oceanConnected`/`ocean` (np. `:6271`, `:6810`, `:8012`, `:8465`). Czas nie mierzony (poza zakresem P1). |
| B0.3 | Literówka `TerenBazowy.Morse` (`isCoastalMorseHex` zawsze `false`) | **NAPRAWIONY** | `grep 'TerenBazowy\.Morse\b'` na pinie: 0 trafień. `gen-helpers.ts:3319` `isCoastalMorseHex` liczy już po `isWaterTerrainLocal`. |
| B0.8 | Rzeki bez ujścia / osierocone ścieżki | **NIEROZSTRZYGNIĘTY** — obecny mechanizm (prune), skuteczność niezweryfikowana | `gen-helpers.ts:8505` `pruneOrphanRiverPaths`, `generator.ts:514–520` `pruneRiversNotReachingRealSea`. Obecność kodu potwierdzona; skuteczności na seedach nie weryfikowano w tej rundzie. Status binarny (nadal istnieje / naprawiony) nieustalony. |
| B0.9 (pkt 1) | Brak plonów na polach w widoku miasta | **NAPRAWIONY** | `gra/src/main.ts:5761` `showYields: true`. |
| B0.9 (pkt 2) | Tryby auto (Żyw./Prod./Podat./Zrówn.) nie działają | **Komentarz obecny, treść fixa NIEZWERYFIKOWANA** | `main.ts:5488`, `:5498` — komentarze o `onOkolicaFocusChange` (tylko gracz, ownerId===0). Logika nie czytana wprost w tej rundzie. |
| BLEDY #4 | `ai.ts:720`: w dokumencie błędne pole `def.health` (małe litery), poprawne pole to `Health` | **NAPRAWIONY** | Na pinie nie ma żadnego odczytu `def.health`/`def?.health` (`git grep -nE 'def\??\.health\b' edb8fb56 -- gra/src`: 0 trafień). `gra/src/game/ai.ts:3084–3088` `_unitMaxHealth`: `const h = def?.Health ?? null`, fallback 30. Uwaga: komentarz `ai.ts:3083` mówi „TW health, fallback Health", a kod czyta wyłącznie `def?.Health` — niezgodność komentarza z kodem, nie wpływa na werdykt. |

Nie sprawdzone w tej rundzie (oznaczone jako otwarte do weryfikacji): B0.4 (woda na pustyni, „do obejrzenia"), B0.5 (dopływy a render połączenia), B0.6 (`BLAD-B0.6-ZALANE-WYBRZEZE`), B0.7 (`pruneOrphanRiverPaths` — tylko obecność, nie skuteczność), oraz pozostałe pozycje z `BLEDY-DO-NAPRAWY` (sekcja P2 logika, oznaczona w dokumencie jako BLOCKED ABC) — nieprzeliczone w tej rundzie. Stan tych pozycji wymaga osobnego tematu.

## 3. Obsłużone edge case'y z jawnym uzasadnieniem w kodzie (wybór reprezentatywny)

| Plik:linia | Edge case | Dotyczy P6? |
|---|---|---|
| `gra/src/game/ai.ts:3083–3088` | Brak `Health` w definicji → fallback 30 (wartość `_unitMaxHealth`) | tak |
| `gra/src/map/generator.ts:550` | Purge wody→ląd tylko przed rzekami (B0.1) | tak (P3/P4 świat) |
| `gra/src/map/gen-helpers.ts:3975–3982` | Sanityzacja wybrzeża jako BFS, wynik identyczny z domknięciem przechodnim | tak (P4) |
| `gra/src/game/diplomacy.ts:1681` | Urazy historyczne nie schodzą poniżej 0 (`urazyHistoryczne_zaufanie_perTura`, zanik co 20 tur) | tak (P6.14) |
| `gra/src/main.ts:5488–5498` | Tryby okolicy dostępne tylko dla gracza (AI bez ścieżki powrotu do auto) | tak (P6.6–8, hot-seat) |

## 4. Podsumowanie: systemy z P1.14 z najwyższą liczbą otwartych edge case'ów

Liczenie: TODO z §1 (otwarte z definicji) + pozycje „NIEZWERYFIKOWANE/otwarte" z §2 przypisane do systemu.

1. **Dyplomacja / religia** — 3 TODO (`diplomacy.ts:1676, 1677, 1688`: cap akumulacyjny per religia, brak capu −10). Najwięcej w jednym pliku gameplayu.
2. **Walka** — 2 TODO gameplayowe (`battleScene.ts:2566, 8977`: rally recovery) + 3 TODO UI przed bitwą (`preBattle.ts:720, 887, 892`) → łącznie 5, z czego 2 gameplayowe, 3 UI/kontraktu.
3. **AI** — 2 TODO (`ai.ts:4764, 5037`: wieloturowe sojusze/handel/wasalizacja, v0.2) — funkcjonalnie brakujące, nie tylko uwagi.
4. **Miasta / ekonomia / cuda** — po 1 TODO każdy (`cityPanel.ts:954` korupcja; `turn-economy.ts:195` city-defense yield; `wonders-data.ts:201` yields imperium).
5. **Jednostki** — 1 TODO (`main.ts:10222` transfer jednostki) + otwarte B0.4/B0.5 w obszarze świata (nieweryfikowane).

Najwięcej udokumentowanych błędów w `BLEDY-*`/`BLAD-*` dotyczy **generatora mapy** (`gra/src/map/**`, pozycje B0.x); na pinie większość sprawdzonych pozycji B0.x jest naprawiona w kodzie, ale bez testów wykonanych w tej rundzie. B0.8 pozostaje nierozstrzygnięty (patrz §2).

## 5. Zastrzeżenia

- Nie uruchomiono `cargo`/`npm` ani testów mapy (zakaz benchmarków w P1.16). Status „NAPRAWIONY" = weryfikacja kodu pinu, nie wykonanie testu.
- Sprawdzenie znaczników w `gra/src/**` ograniczone do plików tekstowych (`git grep -I`). Poza `.ts/.tsx` jedyne trafienia to 13 plików binarnych `.mp3` i `wikiBundle.json` (fałszywe dopasowania, §1). FIXME/HACK/XXX w `.ts/.tsx` = 0.
- Dokumenty źródłowe nie są datowane jednolicie: `BLEDY-DO-NAPRAWY-2026-07-05.md` i `BLAD-B0.*` mają daty w nazwach 2026-07-05 (B0.6/B0.8/B0.9/BLEDY) — to dokumenty badane w tym temacie. W `dyspozycje/` istnieją też późniejsze `AUDYT-*` (m.in. `AUDYT-KODU-2026-07-21.md`, `AUDYT-PARYTET-AI-2026-07-24.md`, `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md`, `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`), których nie przeglądano pod kątem edge case'ów w tej rundzie. Stan każdego błędu sprawdzono na pinie, nie przyjęto z dokumentu.

---

## 6. Uzupełnienie R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1 (runda 1/5, Operator Haiku 5.5 medium)

**Pin:** `edb8fb56` (`main`, potwierdzony `git cat-file`). Dowody: wyłącznie `git grep`/`git show edb8fb56:…` wykonane w tej rundzie. Numery linii pochodzą z tych poleceń, nie z treści audytów (audyty mają nieaktualne linie, np. `AUDYT-PARYTET-AI` podaje `main.ts:14863-14893` dla ścieżki AI wyrębu lasu, a pod tą linią na pinie jest kod oblężenia — referencje w audytach są przestarzałe).
**Zakres:** 9 plików `dyspozycje/AUDYT-*.md` z `git ls-tree edb8fb56` (żaden nie był ujęty w pierwotnym P1.16, którego §2 cytuje wyłącznie `BLEDY-*`/`BLAD-B0.*`): 8 w tabeli 6.1 + `AUDYT-OBIEG-DOKUMENTOW-2026-07-05.md` wykluczony jako proces. Dodatkowo jeden dokument spoza wzorca: `KULTURA-RELIGIA-AUDYT-2026-07-22.md`. `AUDYT-KODU-2026-07-21.md` pasuje do wzorca i jest liczony w tabeli 6.1.
**Kryterium binarne z dispatchu (każde znalezisko ze statusem NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY z dowodem z tej rundy): NIE SPEŁNIONE.** Pozostają nieprzeliczone: 69 znalezisk AUDYT-KODU (po odjęciu #1, #2, #19, #22), PARYTET #1–#6 i #8, oraz pozycje z `AUDYT-OPISY-*` i `AUDYT-STOLICE-*` wymagające weryfikacji treści (§6.3). Ta runda nie może być oceniona jako PASS.

### 6.1 Pliki i status

| Plik (pin) | Czego dotyczy | Systemy P1.14 | Status błędów gameplayu |
|---|---|---|---|
| `AUDYT-KODU-2026-07-21.md` | Audyt kodu 73 znalezisk (2 KRYTYCZNE) | różne | #1, #2, #19, #22 rozstrzygnięte w 6.2; pozostałe 69 NIEROZSTRZYGNIĘTE (poza zakresem tej rundy) |
| `AUDYT-NAPRAWY-LOG.md` | Log wykonania 20 POTWIERDZONE | — | log, nie błąd; commit `6adfb79` jest przodkiem pinu |
| `AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md` | Martwe pola `przyrost*`/`utrzymanie`/`odblokowuje` w `buildings.json` | ekonomia miast, budynki | patrz 6.2 |
| `AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` | Fałszywe opisy budynków w Civpedii/Poradniku/`uwagi` | budynki, UI | patrz 6.2 |
| `AUDYT-PARYTET-AI-2026-07-24.md` | Parytet gracz vs AI (ekonomia, koszty, handel) | AI, ekonomia | patrz 6.2 |
| `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` | Werdykt: bliskie etykiety = design klastra, nie błąd bramki stolic | mapa/generator | NIEROZSTRZYGNIĘTY (werdykt design; stała sep 14 nie zweryfikowana wprost w tej rundzie) |
| `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` | Przegląd treści opisowych (136 haseł, 22 rozdziały) i paneli „ściąga" | teksty/UI | NIEROZSTRZYGNIĘTY (treść, nie gameplay; nie weryfikowano każdego hasła) |
| `AUDYT-WERYFIKACJA-53-WERDYKTY.md` | Werdykty sceptyków dla 53 znalezisk (1 ODRZUCONE: #22) | różne | #22 — NAPRAWIONY wcześniej (`b1a7a61` jest przodkiem pinu); reszta jak w `AUDYT-KODU` |
| `KULTURA-RELIGIA-AUDYT-2026-07-22.md` | Teza „kultura i religia nie wpływają na nic" | kultura/religia | patrz 6.2 (teza nieaktualna w części) |

Wykluczony z zakresu jako proces: `AUDYT-OBIEG-DOKUMENTOW-2026-07-05.md` (obieg dokumentów, nie gameplay).

### 6.2 Zweryfikowane błędy (pin `edb8fb56`)

| ID | Opis w audycie | Stan na pinie | Dowód (pin) |
|---|---|---|---|
| KOD #2 [KRYTYCZNA] | Auto-szturm zeruje armię obu stron (`survivors: []`) | **NAPRAWIONY** | `git grep 'survivors: \[\]'` = 0 trafień; `main.ts:30068` i `:30229` komentarze „survivors: undefined (nie []!)"; `main.ts:28343` `manualSurvivors: survivors !== undefined` |
| KOD #1 [KRYTYCZNA] | Koszyk PN: oddanie „jednostki" nic nie kosztuje dawcy | **NAPRAWIONY** (ścieżka zamknięta defensywnie; TODO A1 zostaje, transfer dawcy nie zaimplementowany) | `main.ts:10221–10228`: etykieta `case 'jednostka': {` w linii 10221, TODO `A1 — audyt #1` w 10222–10225, `break;` w 10227 (odrzucenie w silniku) |
| KOD #22 | Rozjazd kierunku Respektu | **NAPRAWIONY** (ścieżka oceny propozycji) | `main.ts:20515` `const proposerRespekt = computeRespekt(potProposer, potResponder);` i `:20519` `respekt: proposerRespekt` (kontekst oceny gracza, zweryfikowane w tej rundzie na pinie). `b1a7a61` jest przodkiem pinu (`git merge-base --is-ancestor`). Strona pętli AI (`main.ts:12163–12166`) nie była przeliczona w tej rundzie |
| KOD #19 [WYSOKA] | Odwrócona bramka wasalizacji (sprawdza respekt respondenta) | **NAPRAWIONY** (bramka) | `diplomacy-proposals.ts:1684–1689` `case 'wasal'`: `if (ctx.proposerRespekt < wasalRespektThreshold)` (próg = `progWasalizacjaRespekt` minus słodzik); kierunek płatności `payerOwnerId: responderOwnerId` (l. 1699) nie zmieniony. Wariant AI (`:2084`) nie ma tej bramki |
| MARTWE: `przyrost*` | Pola `przyrost` martwe, UI pokazuje „+X/poziom" | **NAPRAWIONY** (ożywione) | `production.ts:244–249` `buildingEffectAtLevel = baza + przyrost·(n−1)`; konsumenci `economy.ts:504`, `economy-upkeep.ts:650`, `cityPanel.ts:6485` |
| MARTWE: `utrzymanie` | Per-budynek utrzymanie nadpisane płaskim `budynekUtrzymanieFlat` | **NADAL ISTNIEJE** | `economy-upkeep.ts:585` (`budynekUtrzymanieFlat: 1`), `:606` odczyt z `econ-params`, `:1144` `totalBuildingUpkeep(buildings, p.budynekUtrzymanieFlat)` |
| MARTWE: `odblokowuje` | Pole martwe, nieczytane przez silnik | **NADAL ISTNIEJE** (dane) | `gra/data/buildings.json:992, 1040, 1474, 1523, 1572` (5 wystąpień) |
| MARTWE: Targowisko | `baza.mnoznik = 0`, `przyrost.mnoznik = 0` → zero efektu | **NADAL ISTNIEJE** | `buildings.json` blok `targowisko` (id linia 303): `"mnoznik": 0` (×2); `uwagi` odnotowuje decyzję „PYTANIE 20=A" |
| MARTWE: `koszt_surowce` w jednostkach | Jednostki nie konsumują surowca z puli (decyzja A niewdrożona) | **NADAL ISTNIEJE** | `git show edb8fb56:gra/data/units.json \| grep -c koszt_surowce` = 0 |
| PARYTET #9 | Jednostki nie konsumują surowca (ta sama luka) | **NADAL ISTNIEJE** | jak wyżej; `buildingStockCost` wołane tylko dla budynków (audyt, nie przeliczone linia po linii) |
| MARTWE: Kuźnia/Koszary (mnożnik wojskowy) | Mnożnik kategorii Wojsko pomijany w Pracy | **NADAL ISTNIEJE** (opis Civpedii obiecuje efekt, którego kod nie daje) | `economy.ts:21–22` komentarz „Combat/military mnoznik values … we skip those here" (wywołanie nie przeliczone w tej rundzie) |
| MARTWE: Mury / Fort (Civpedia „+5/+15 obrony") | Opis obrony miasta; dane zerowe | **NADAL ISTNIEJE** (zero efektu w danych); tekst Civpedia nieprzeliczony | `buildings.json:998` (`mury`) i `:1439` (`fort`): `baza` i `przyrost` z `"obrona": 0`, `"mnoznik": 0`; `siege.ts:306` notatka o zerowaniu `mury.obrona` |
| MARTWE: Pretorium („+2 obrony"; „% do podatków") | Opis nieprawdziwy; mnożnik zerowy | **NADAL ISTNIEJE** (obietnica bez efektu) | `buildings.json:1829–1862`: `baza` i `przyrost` `"mnoznik": 0`, `"obrona": 0`. Twierdzenie audytu „działa → dolicza do Pracy" nie znajduje podstawy w danych (brak niezerowego mnożnika); routing w kodzie nieprzeliczony |
| Akademia (mnożnik → Praca zamiast nauki) | Audyt MARTWE-PARAMETRY | **NIEROZSTRZYGNIĘTY** | `buildings.json:1586`: kategoria `Nauka`, `baza.mnoznik` 10, `przyrost.mnoznik` 3. Konsument (Praca vs nauka) nie przeliczony w tej rundzie |
| Warsztat oblężniczy / Kuźnia żelaza (kategoria Wojsko/Produkcja+Wojsko) | Audyt MARTWE-PARAMETRY | **NIEROZSTRZYGNIĘTY** | `buildings.json:1537` (`warsztat_oblezniczy`, Wojsko, mnoznik 10), `:1339` (`kuznia_zelaza`, „Produkcja+Wojsko", mnoznik 15). Wykluczenie z sumy nie przeliczone wywołaniem |
| Wielka Kuźnia — martwy konwerter stali | `converters.ts:62` wg audytu | **NIEROZSTRZYGNIĘTY** | linia 62 w pinie to komentarz nagłówka receptur („Wielka Kuźnia bez produkcji stali"); martwość konwertera nie przeliczona |
| „NOWE ZNALEZISKA" nr 4 w `AUDYT-MARTWE-PARAMETRY` | wikiBundle.json | **NIEROZSTRZYGNIĘTY** | nie sprawdzone w tej rundzie |
| MARTWE: Lazaret | Audyt twierdzi „CZYSTO, zero wystąpień" | **NADAL ISTNIEJE** (w tekście; audyt „czysto" nieprawdziwy) | `gra/src/data/wikiBundle.json`: „Odblokowuje budynki: Łaźnia publiczna, Lazaret"; `gra/data/tech.json:430`: „Lazaret = NOWY budynek"; w `buildings.json` brak wpisu (martwa obietnica) |
| MARTWE: Karawanseraj | Decyzja 15B: usunąć | **NAPRAWIONY w danych/silniku** | `buildings.json` 0 trafień `"karawanseraj"`; `trade-routes.ts`: 0 trafień małych liter, ale 1 trafienie bez rozróżniania wielkości liter w linii 904 (komentarz „Karawanseraj usunięty z gry (decyzja właściciela 2026-07-25, „15b")" — nie kod). Opisy w `tech.json`/`wikiBundle.json` nie sprawdzone |
| MARTWE: Wielka Kuźnia | `epokaWejscia: 4` przy 3 epokach | **NADAL ISTNIEJE** (nieosiągalna) | `buildings.json:1394` (`epokaWejscia: 4`), `:1389–1391` (`id`, `nazwa`); liczba epok nie przeliczona w tej rundzie |
| PARYTET #7 (AI, `aliveUnitTypeNames`) i #AI-zakup | Brak zakupu jednostki za złoto dla AI | **NIEROZSTRZYGNIĘTY** | `ai.ts:95–101` nie sprawdzone wprost w tej rundzie |
| PARYTET (wyrąb lasu AI vs gracz) | AI commituje wyrąb natychmiast | **NIEROZSTRZYGNIĘTY** | `hexClearingStates` istnieje w `main.ts:13124` (kontekst pętli tury); linie z audytu (`14863–14893`) to kod oblężenia — referencja nieaktualna |
| KULTURA-RELIGIA: „nie wpływa na nic" | Teza audytu | **NIEROZSTRZYGNIĘTY** (teza częściowo nieaktualna: konsumenci istnieją) | `culture-religion.ts` (1479 linii) ma konsumentów: `turn-economy.ts:177–204` (`kulturaMult`, `bonus.kultura`), `okolica.ts`, `society-breakdown.ts`, `conquest-stability.ts`; siła wpływu nie zbadana |
| KULTURA/DYP: cap akumulacyjny religii | TODO +15/−10 | **NADAL ISTNIEJE** | `diplomacy.ts:1676, 1677, 1688` (zgodnie z tabelą §1 wyżej) |

### 6.3 Ograniczenia tej rundy
- Nie przeliczono 69 pozostałych znalezisk `AUDYT-KODU` (#3–#18, #20–#21, #23–#73 bez #19 i #22) — są w planach `ZLECENIA-AUDYT-53` / `PLAN-NAPRAWCZY-AUDYT-53-POZOSTALE`; wymagają osobnego tematu. Bez nich kryterium binarne nie jest spełnione.
- Nie przeliczono treści Civpedia/Poradnik (`wikiBundle.json`, `docs/PORADNIK-GRACZA/*`) dla pozycji MARTWE-OBIETNICE (np. `07-miasto-budowa-rekrutacja.md:193`, 25 haseł „+1 ¤/poziom") — tylko dane `buildings.json` i kod. Brak tej weryfikacji nie pozwala na status „NAPRAWIONY" dla opisów.
- Pozycje PARYTET #1–#6, #8 oznaczono w audycie jako ✅; nie przeliczono ich linia po linii (zakres rundy).
- Nie uruchomiono testów ani gry (zakaz benchmarków/testów w tym temacie).
- Dane `buildings.json` przeliczano przez `git show` + `grep`; obiekty JSON nie były parsowane.

---

## 7. Runda 2/5 — R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`)

**Dowody:** wyłącznie `git grep` / `git show edb8fb56:<ścieżka>` / `awk` na pinie, wykonane w tej rundzie. Numery linii z tych poleceń. Linie z audytów (`AUDYT-KODU`) traktowane jako nieaktualne i przeliczane po symbolach. Zapis tylko przez dopisanie tej sekcji na końcu pliku.

**Korekty do §6 (runda 1):** `converters.ts:62` jest błędnym odniesieniem: na pinie `gra/src/game/converters.ts:62` to ` */`, a tekst „Wielka Kuźnia bez produkcji stali" jest w linii **61**. Receptury `wielka_kuznia` w `converters.ts` nie ma (0 trafień), więc „martwy konwerter stali" to nieaktualny komentarz, nie kod (NADAL ISTNIEJE jako komentarz). Akademia wojskowa ma id `akademia_wojskowa` w `gra/data/buildings.json:2023`; wpis `akademia` w linii 1586 to budynek kategorii „Nauka" (nie wojskowy).

**Wynik:** kryterium binarne NIE jest spełnione. Z 73 znalezisk `AUDYT-KODU`: **34 NAPRAWIONY**, **6 NADAL ISTNIEJE**, **33 NIEROZSTRZYGNIĘTY** (nieprzeliczone w tej rundzie, bez dowodu rozstrzygającego). Runda 1 (§6.2) obejmuje #1, #2, #19, #22.

### 7.1 AUDYT-KODU — status per znalezisko

| # | Status | Dowód (pin `edb8fb56`) |
|---|---|---|
| 1, 2, 19, 22 | (wg §6.2) | patrz §6.2 |
| 3 | NAPRAWIONY | `manpower.ts:787-795` `tryDeductUnitSpawnCosts`: `popCost>0 && pop<=popCost` → `ok:false, brak_ludnosci`; brak clampu `max(1,…)`. `refundUnitSpawnToCity` (`manpower.ts:808`) nie ma wywołań poza definicją; `disbandPlayerUnit` (`main.ts:6396-6412`) nie zwraca ludności. |
| 4 | NIEROZSTRZYGNIĘTY | Wzór `zywnoscDoRozwoju` nieobecny. Przepływ idzie przez `computeCityFoodBalanceV85` (`turn-economy.ts:1680-1689`); mnożenie ujemnej żywności przez suwak nieprzeliczone. |
| 5 | NAPRAWIONY | `if (!eraAdvance)` 0 trafień. Pętla badań AI: `main.ts:28608-28646` (`aiBadanaByOwner`, ponowny wybór gdy badana nieważna, `researchStep`). Dynamika nie testowana. |
| 6 | NADAL ISTNIEJE | `victory.ts:150-156` `isNaukaVictory`: `if (!NAUKA_WYMAGA_RAKIETY) return true; return rakietaWystrzelona;`; `e-start-params.json:127` `nauka_wymaga_rakiety: true`; `rakietaWystrzelona` tylko `false` (`main.ts:28641`), odczyt `main.ts:35753`. **Korekta:** stała NIE jest martwa (`victory.ts:155`). |
| 7 | NAPRAWIONY | `gen-helpers.ts:2041` `pickReliefForceHex` odrzuca `isWaterTerrainLocal` (`:152-154`: Morze/PlytkieMorze); Wybrzeże = `PlytkieMorze` (`units/setup.ts:426`). |
| 8 | NAPRAWIONY | `filePlayer.ts:285-288` i `:422-425`: `.catch` ustawia `playing = false`. |
| 9 | NAPRAWIONY | `muzyka-antyczna.ts:1678-1685`: przejście plik→synteza tworzy `ctx` gdy `null`, przed `spawnEngine` (`:1687`). |
| 10 | NAPRAWIONY | `combat.ts:216-218` `unitRowStat(def,'armor','Pancerz',0)` (fallback PL, komentarz `:212-215`). |
| 11 | NAPRAWIONY | `production.ts:950-953`: limit 1 żywej sztuki dla `Super-jednostka=TAK`; `production.ts:277-281`: koszt 0 zostaje 0. **Korekta:** takich jednostek jest 9 (nie 7). |
| 12 | NAPRAWIONY | `advanceSeat` (`main.ts:36047-36061`): strażnik obejmuje `aiTurnAwaitingBattle/aiCmdResume`; klawisz N wywołuje `advanceSeat` (`:36223-36230`). |
| 13 | NAPRAWIONY | `lootedVillageHexKeys` zapisywane (`main.ts:30635`) i odtwarzane (`:38757-38761`). |
| 14 | NAPRAWIONY | `battlePowerPtsByOwner.clear()` w `doStartGame` (start `:37067`, clear `:37262`). |
| 15, 26 | NAPRAWIONY | Zapis: `main.ts:30654-30658` (simplified, foreignType, typCityCopy, clusterCapital, clusterPlacement). Odczyt: `:38570-38602`. |
| 16 | NAPRAWIONY | `main.ts:20704-20711`: `applyPnTrustForPair` tylko gdy `dealCovered` (`basketItemsAffordable` obu stron). |
| 17 | NAPRAWIONY | `cityPanel.ts:1196-1205` ctx z flagami budynków i walutą; `:1212` scala `getCityBuildingFlags` bez utraty bazy. |
| 18 | NAPRAWIONY | `main.ts:21672` `hp: u.hp ?? hpMax` w kartach stosu. |
| 20 | NIEROZSTRZYGNIĘTY | Kurs Rel/100 istnieje (`diplomacy-acceptance-points.ts:304` → `diplomacyFairGivePn`); guard ¤↔¤ nie sprawdzony. |
| 21 | NADAL ISTNIEJE | `diplomacy-proposals.ts:1144-1152` `case 'trybut_zadanie'`: brak górnego limitu kwoty; `pairHasKind` nie jest wołane w tym case (wołane w `:1073`, `:1136`). |
| 23 | NIEROZSTRZYGNIĘTY | Atrycja garnizonu `main.ts:31802-31837` nieprzeliczona. |
| 24 | NIEROZSTRZYGNIĘTY | Posiłki `ai.ts:4676-4713` nieprzeliczone pod kątem filtra sojuszu. |
| 25 | NIEROZSTRZYGNIĘTY | `main.ts:29115` komentarz „#25: frakcja rebeliancka (-99)…" sugeruje naprawę; ścieżka nieprzeczytana. |
| 27 | NAPRAWIONY | Cache `cityFogVisible` (`main.ts:2556`, `:2587-2588`). Koszt nieprzeliczony. |
| 28 | NIEROZSTRZYGNIĘTY | `units/setup.ts:884` sygnatura `computePath` odczytana; limit promienia w ciele nieprzeczytany. |
| 29 | NIEROZSTRZYGNIĘTY | Funkcja przemianowana (`ai.ts:4435`: „Dawniej findSettlerTarget"); nowa wersja nieprzeliczona. |
| 30 | NIEROZSTRZYGNIĘTY | `main.ts:26230-26236` handler mousemove odczytany do gałęzi weterana; gałąź `currentVisible` nieprzeczytana. |
| 31 | NIEROZSTRZYGNIĘTY | `case 'build'` 0 trafień; ścieżka komend nieprzeliczona. |
| 32 | NAPRAWIONY | `production.ts:921-925` (komentarz „fix #32"; bramka `isBuildingSupersededByUpgrade`). |
| 33 | NIEROZSTRZYGNIĘTY | `main.ts:2293` nieprzeliczone. |
| 34 | NIEROZSTRZYGNIĘTY | `empire-food.ts:106-118` `em = raw.ekonomia_miasta ?? raw` (fallback na top-level obecny); zawartość JSON nie sprawdzona. |
| 35 | NADAL ISTNIEJE | `economy.ts:1189` `healthModifier = Math.max(0, 1 + zdrowie*…)` (0 przy zdrowie ≤ -20); wpływ na ujemną żywność nieprzeliczony. |
| 36 | NAPRAWIONY | `turn-economy.ts:2918-2926` lista budynków wypełniana przed `upkeepBalance` (`:2931`). |
| 37 | NIEROZSTRZYGNIĘTY | `ai.ts:667` `scoreTech` nieprzeczytany pod kątem Zasad. |
| 38 | NAPRAWIONY | `wonder-placement.ts:34` `!isWaterTerrain(t) && t !== Gory`; `units/setup.ts:678` = Morze/PlytkieMorze. |
| 39 | NAPRAWIONY | `muzyka-antyczna.ts:2037-2044` `stopAmbience` zatrzymuje `ambActiveSources`. |
| 40 | NAPRAWIONY | `main.ts:22154-22159` (`stopAmbience`, `setMood('mapa')`). |
| 41 | NADAL ISTNIEJE | Wielka Kuźnia `buildings.json:1394` `epokaWejscia: 4` (gra ma 3 epoki). Lazaret → patrz 7.2. |
| 42 | NAPRAWIONY | Zapis `main.ts:30659-30661` („Audyt #42"); odczyt `:38772-38773`. |
| 43 | NAPRAWIONY | Zapis `main.ts:30666-30669`; reset `:37290-37293`; odczyt `:38802-38808`. |
| 44 | NADAL ISTNIEJE | `aiSkarbiecByOwner` zapisywane (`main.ts:30581`), odczyt przy load nie znaleziony (grep 38500-38900). Do potwierdzenia. |
| 45 | NIEROZSTRZYGNIĘTY | `diplomacyTradeBasket.ts:63` etykieta; kod silnika/`cityOptions` nieprzeliczony. |
| 46 | NIEROZSTRZYGNIĘTY | `diplomacy-proposals.ts:557-558` etykieta; bramka przemarszu nieprzeczytana. |
| 47 | NAPRAWIONY | `main.ts:10150-10155` (Praca dawcy odejmowana, odbiorca → pula Pracy). |
| 48 | NIEROZSTRZYGNIĘTY | `computeObjectivePower` nieprzeczytany. |
| 49 | NIEROZSTRZYGNIĘTY | `main.ts:11178` nieprzeliczone. |
| 50 | NIEROZSTRZYGNIĘTY | `main.ts:10084-10094` wrapper tech-trade; kolejność machin nieprzeliczona. |
| 51 | NIEROZSTRZYGNIĘTY | `siegePower` wołane (`main.ts:27723`) — nie jest martwe; wkład machin do M nieprzeliczony. |
| 52 | NIEROZSTRZYGNIĘTY | `runtimeUnitToSiegeUnit` (`main.ts:15062`) nieprzeczytany. |
| 53 | NIEROZSTRZYGNIĘTY | `mapFieldBattle.ts:215-224` nieprzeczytany pod kątem fallbacku Milicji. |
| 54 | NADAL ISTNIEJE | `combat.ts:539-542`: `aLow.includes(cAtk) \|\| cAtk.includes(aLow)` (dopasowanie po podciągu). |
| 55 | NAPRAWIONY | `post-battle-map.ts:554` `if (city.rebelState) city.rebelState = false;`. |
| 56 | NIEROZSTRZYGNIĘTY | `ai.ts:4529` `findNearestVillage`: alokacja `Object.keys` nieprzeliczona. |
| 57 | NIEROZSTRZYGNIĘTY | `main.ts:2985` `syncVillageMeshes`: ciało nieprzeczytane. |
| 58 | NAPRAWIONY | Brak odczytu pola `Super` (0 trafień; `unitInfographic.ts:93` to tylko etykieta). |
| 59 | NIEROZSTRZYGNIĘTY | `economy.ts:664-697` nieprzeliczone. |
| 60 | NIEROZSTRZYGNIĘTY | `main.ts:8098-8106` sprzątanie przy wyjściu; ścieżka nagrody wioski nieprzeliczona. |
| 61 | NAPRAWIONY | `playerState.ts:72` `BRAK_PREREQ` = `'', '-', '—', '–', 'brak', 'none'`. |
| 62 | NIEROZSTRZYGNIĘTY | `generator.ts:286` gałęzie pangea nieprzeczytane do jezior. |
| 63 | NIEROZSTRZYGNIĘTY | `startScoring.ts:80-84` pętla dist 0..4 odczytana; warunek punktowania gór nieprzeczytany. |
| 64 | NAPRAWIONY | `map-gen-params.json`: 0 trafień `owce`/`bydlo`/`lama`/`luksus`. |
| 65 | NIEROZSTRZYGNIĘTY | `filePlayer.ts:260-272` `onError` nieprzeczytany pod kątem crossfade. |
| 66 | NIEROZSTRZYGNIĘTY | `main.ts` (kamień milowy z handlu) nieprzeliczony. |
| 67 | NAPRAWIONY | `units.json` „Procarz (Huaracoc)": Typ = `Slinger` (python na pinie). |
| 68 | NAPRAWIONY | `main.ts:37030-37031`, `:37144-37145`: `camCtrl.dispose()` przed nowym `new CameraController`. |
| 69 | NIEROZSTRZYGNIĘTY | `gamePauseMenu.ts:104-112` widoczny tylko CSS; logika „Wczytaj" nieprzeczytana. |
| 70 | NIEROZSTRZYGNIĘTY | `main.ts:2661` nieprzeliczone. |
| 71 | NIEROZSTRZYGNIĘTY | `civ-roster.ts:98-104` (`fillIn`) odczytane częściowo. |
| 72 | NIEROZSTRZYGNIĘTY | Śmierć z głodu: `main.ts:6411` `units.splice`; ścieżka audytu (~10897) nieprzeliczona. |
| 73 | NIEROZSTRZYGNIĘTY | Linia 585 w `render/cities.ts` to komentarz `setZoomLod`; `dispose` cache (`cities.ts:756`) nieprzeliczony. |

### 7.2 Pozostałe pozycje z rundy 2 (wskazane przez Evaluatora)

- **Civpedia / Poradnik `07-miasto-budowa-rekrutacja.md:193`** (`docs/PORADNIK-GRACZA/`): obietnica „Kuźnie +15% Pancerza; Koszary/Akademia wojskowa/Warsztat +20/+20/+10% parametrów miękkich" jest **zgodna z kodem**: `unit-building-bonuses.ts:67` (`ARMOR_BUILDING_IDS`) i `:70` (`SOFT_STAT_BUILDING_IDS` = koszary, akademia_wojskowa, warsztat_oblezniczy). Status NAPRAWIONY dla tej obietnicy. Pozostałe 25 haseł i treść `cityPanel.ts:5013` NIEROZSTRZYGNIĘTE.
- **Mury / Fort / Pretorium** (`buildings.json:998, 1439, 1829`): dane zerowe (`"mnoznik": 0`, `"obrona": 0`), status z §6.2 — NADAL ISTNIEJE.
- **Akademia (nauka, id `akademia`, `buildings.json:1586`)**: mnożnik 10 i konsument „Praca zamiast nauki" nieprzeliczony — NIEROZSTRZYGNIĘTY.
- **Akademia wojskowa (`akademia_wojskowa`, `buildings.json:2023`)**: obecna w `SOFT_STAT_BUILDING_IDS` — NAPRAWIONY dla obietnicy Civpedia; mnożnik wojskowy nieprzeliczony.
- **Warsztat oblężniczy (`buildings.json:1537`)** i **Kuźnia żelaza (`:1339`, kategoria „Produkcja+Wojsko")**: obie w listach ścieżek wojskowych; wykluczenie z sumy Pracy nieprzeliczone — NIEROZSTRZYGNIĘTY.
- **Lazaret** (`wikiBundle.json`, `tech.json:430`): obietnica „Odblokowuje budynki: … Lazaret" występuje w danych opisowych, brak wpisu w `buildings.json` — NADAL ISTNIEJE (opis). Część NOWE nr 4 (`wikiBundle.json`) potwierdzona w tym zakresie.

### 7.3 Ograniczenia tej rundy

- 33 pozycje NIEROZSTRZYGNIĘTY (tabela 7.1) wymagają kolejnej rundy; kryterium binarne nie jest spełnione.
- Statusy NAPRAWIONY na podstawie komentarza `Audyt #NN` oraz widocznej bramki (np. #27, #36, #42, #43) nie były dynamicznie testowane.
- Nie uruchomiono `cargo`/`npm`/gry. Zakres zapisu: tylko ten plik. `gra/**` nietknięte.

---

## 8. Runda 3/5 — R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`)

**Dowody:** wyłącznie `git show edb8fb56:…`, `git grep edb8fb56`, `sed`/`awk`/`grep` na pinie, wykonane w tej rundzie. Ta sekcja **nadpisuje statusy z §6.2 i §7.1** dla wszystkich pozycji wymienionych niżej. Sekcje 1–5 nietknięte. Wiersze §7.1 44, 64, 72 przywrócono do treści r2 (zarzut 1); ich korekty są w tej sekcji. Klucz ścieżek (zarzut 6): `main.ts` = `gra/src/main.ts`; `ai.ts`, `manpower.ts`, `cities.ts`, `economy-upkeep.ts`, `diplomacy-value-catalog.ts`, `unit-building-bonuses.ts`, `city-defense.ts` = `gra/src/game/…`; `cities.ts:750–759` (#73) = `gra/src/render/cities.ts`; `buildings.json`, `map-gen-params.json` = `gra/data/…`; `Poradnik` = `docs/PORADNIK-GRACZA/…`.

### 8.0 Odpowiedzi na zarzuty rundy 2

1. **Status z dowodem dla każdej pozycji.** AUDYT-KODU: §8.1 (73/73). PARYTET #1–#8: §8.2 (8/8). Pozostałe pliki: §8.3. Pozycje `NIEROZSTRZYGNIĘTY` mają zapisane, co sprawdzono i czego nie.
2. **Wiersze per plik.** §8.3 ma jeden wiersz na każdy plik z zakresu, także dla plików wskazanych jako „patrz 6.2" i „poza zakresem".
3. **Pliki `_handoff/`.** Dwa pliki (`AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md`, `AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`) oceniono w §8.3. Propozycja: wykluczyć z powodu poza globem `dyspozycje/AUDYT-*.md`, daty poza oknem 2026-07-21…2026-08-13 i treści procesowo-designowej. Decyzja należy do Evaluatora/Final Control.
4. **Wiersz 44 (§7.1)** zmieniony na NAPRAWIONY. Zapis `main.ts:30579-30581`, odczyt `main.ts:39097-39104`.
5. **Kotwica #72 (§7.1)** poprawiona. `disbandPlayerUnit` (`main.ts:6411`) to tylko punkt porównania. Właściwa ścieżka głodu: `main.ts:31612-31631` (`allDestroyedIds`, komentarz `#72` w l. 31613, sprzątanie oblężenia/garnizonu, `units.splice` w l. 31628-31630) oraz `main.ts:31819-31834` (atrycja realnego garnizonu oblężonego miasta, `units.splice` w l. 31831, `syncGarnizonForCity` w l. 31834). `allDestroyedIds` (l. 31590, 31607) sprawdzone. Status: **NAPRAWIONY**.
6. **Poradnik i mnożniki.** Właściwe linie `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md`: **194** (Kuźnie +15% Pancerza), **195** (Koszary / Akademia wojskowa / Warsztat +20/+20/+10%, max +50%), **197** (Mury +200%, Cytadela, Baszta). Porównanie identyfikatorów (nie samych nazw):
   - Ścieżka A (`ARMOR_BUILDING_IDS`, `gra/src/game/unit-building-bonuses.ts:67`): `kuznia` 15, `kuznia_zelaza` 15, `wielka_kuznia` 15 (`buildings.json`, `baza.mnoznik`). Suma 45 = `ARMOR_PATH_MAX_PP = 45` (l. 295).
   - Ścieżka B (`SOFT_STAT_BUILDING_IDS`, `:70`): `koszary` 20, `akademia_wojskowa` 20, `warsztat_oblezniczy` 10. Suma 50 = `SOFT_PATH_MAX_PP = 50` (l. 297). Limit „max +50%" potwierdzony w `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:195` (zarzut 4: l. 178 to nagłówek `### 45.4`).
   - Status obietnicy Poradnika (194–195): **NAPRAWIONY**. Pozostałe 25 haseł: NIEROZSTRZYGNIĘTY.
   - Mury (`gra/data/buildings.json:998`): pola `baza`/`przyrost` zerowe, ale efekt +200% jest w kodzie: `gra/src/game/city-defense.ts:55–61` (`cityWallDefenseBonusPercent`: `hasMury`/`hasFort` → `params.mur`, `params.cytadela`; opis l. 12–15). Fort/Cytadela (`buildings.json:1439`): ten sam kod (`hasFort`). Status: **NAPRAWIONY** (samokorekta: r2/r3 oceniały tylko pola danych).
7. **#64 na dokładnych kluczach.** `git show edb8fb56:gra/data/map-gen-params.json | grep -n -E 'owce|bydlo|lama|luksus'` daje **0 trafień**. Trafienia `surowce` (`surowce_mult` l. 14; `_opis` przy miedz/glina/cyna) to podciąg i nie są regułami. `gra/src/map/gen-helpers.ts` (`BASE_DEPOSIT_RULES` od l. 11971): **0 trafień** klucza `owce`/`bydlo`/`lama`/`luksus`. L. 11942–11943 dokumentują owce i bydło jako ulepszenie, nie złoże. Status: **NAPRAWIONY**.

### 8.1 AUDYT-KODU-2026-07-21.md — status per znalezisko (r3)

Liczniki: **NAPRAWIONY 56 · NADAL ISTNIEJE 7 · NIEROZSTRZYGNIĘTY 10** (razem 73; korekta r3-obrona: #2 → NIEROZSTRZYGNIĘTY).

| # | Status | Dowód (pin `edb8fb56`) |
|---|---|---|
| 1 | NAPRAWIONY | `main.ts:10221–10228` (etykieta `case 'jednostka'`, odrzucenie w silniku; TODO A1 zostaje) |
| 2 | NIEROZSTRZYGNIĘTY | `gra/src/main.ts:30068`, `:30229` (komentarze „nie []”; w wywołaniu brak pola `survivors`), `:28343`. Zachowanie `applyAutoLosses` nieprzeczytane (zarzut 7) |
| 3 | NAPRAWIONY | `manpower.ts:787–795` (`brak_ludnosci` przy `pop<=popCost`) |
| 4 | NIEROZSTRZYGNIĘTY | `turn-economy.ts:1689`, `:2199` (`zywnoscNetto = foodBal.bilansLokalny`). Mnożenie ujemnej żywności przez `pctRozwoj` nie zlokalizowane (`zywnoscDoRozwoju` nieobecne) |
| 5 | NAPRAWIONY | brak `if (!eraAdvance)`; pętla badań AI `main.ts:28608–28646` (r2) |
| 6 | NADAL ISTNIEJE | `victory.ts:150–156` (`isNaukaVictory`), `e-start-params.json:127` `nauka_wymaga_rakiety: true`; `rakietaWystrzelona` ustawiane tylko na `false` (r2) |
| 7 | NAPRAWIONY | `gen-helpers.ts:2041` odrzuca `isWaterTerrainLocal` (r2) |
| 8 | NAPRAWIONY | `filePlayer.ts:285–288`, `:422–425` (`.catch` → `playing=false`) |
| 9 | NAPRAWIONY | `muzyka-antyczna.ts:1678–1685` (r2) |
| 10 | NAPRAWIONY | `combat.ts:216–218` (fallback `'Pancerz'`) |
| 11 | NAPRAWIONY | `production.ts:950–953` (limit 1 żywej), `:277–281` (r2) |
| 12 | NAPRAWIONY | `advanceSeat` `main.ts:36047–36061`, `:36223–36230` (r2) |
| 13 | NAPRAWIONY | `main.ts:30635`, `:38757–38761` (r2) |
| 14 | NAPRAWIONY | `main.ts:37067`, `:37262` (r2) |
| 15, 26 | NAPRAWIONY | zapis `main.ts:30654–30658`, odczyt `:38570–38602` (r2) |
| 16 | NAPRAWIONY | `main.ts:20704–20711` (r2) |
| 17 | NAPRAWIONY | `cityPanel.ts:1196–1212` (r2) |
| 18 | NAPRAWIONY | `main.ts:21672` (r2) |
| 19 | NAPRAWIONY | `diplomacy-proposals.ts:1688` `ctx.proposerRespekt` (§6.2) |
| 20 | NIEROZSTRZYGNIĘTY | `gra/src/game/diplomacy-value-catalog.ts:527` (komentarz `100/Rel`) i `:530` (`diplomacyDealFairAtRel`); l. 298–304 to komentarz R-DYPLO-CENNIK (zarzut 3); guard ¤↔¤ i limit transakcji nie sprawdzone |
| 21 | NADAL ISTNIEJE | `diplomacy-proposals.ts:1144–1152` `case 'trybut_zadanie'` bez górnego limitu; `pairHasKind` nie wołane w case (r2) |
| 22 | NAPRAWIONY | `main.ts:20515`, `:20519` (§6.2) |
| 23 | NAPRAWIONY | atrycja realnego garnizonu zdejmuje HP i usuwa jednostki: `main.ts:31819–31834`, log `:31837`. Licznik synchronizowany po usunięciu |
| 24 | NAPRAWIONY | `gra/src/game/ai.ts:3192`, `:4061` (`filter(aiCanEngageOwner)`); bramka `ai.ts:520–522`; wiring `gra/src/main.ts:33669–33672` (cel: wojna lub barbarzyńca). Zarzut 7 w tej części odrzucony z dowodem |
| 25 | NAPRAWIONY | `main.ts:29119` `if (oldOwner === REBEL_FACTION_OWNER_ID)` w `runCapitalCapturePlunder` (l. 29111) |
| 27 | NAPRAWIONY | cache `main.ts:2556`, `:2587–2588` (r2) |
| 28 | NAPRAWIONY | `units/setup.ts:903` `maxSearchRadius = hexDistance·2 + PATH_SEARCH_RADIUS_BUFFER` (limit promienia istnieje) |
| 29 | NADAL ISTNIEJE | Funkcja przemianowana na `findCityFoundingHex` (`ai.ts:4437`), nadal `for (const key of Object.keys(map.hexes))` (`ai.ts:4469`). Pełny skan per wywołanie |
| 30 | NAPRAWIONY | `main.ts:26303` `if (k === hoverKey) return;` przed `currentVisible()` (`:26310`). `currentVisible()` nadal przy zmianie heksa |
| 31 | NIEROZSTRZYGNIĘTY | Komentarz `main.ts:35042` deklaruje klasyfikację po id; mapowanie nazwa→id w `ai.ts` nie zweryfikowane |
| 32 | NAPRAWIONY | `production.ts:921–925` (r2) |
| 33 | NAPRAWIONY | `braz-access.ts:25` (`empireHasKopalniaMiedzi(ownImprovements)`) wołane z `main.ts:4887` z listą per właściciel; `main.ts:3146` `placedImprovementsForOwner` |
| 34 | NAPRAWIONY | `empire-food.ts:118` `em = raw.ekonomia_miasta ?? raw`; klucze `glod_wojska_*` czytane z `em` (`:129–131`) |
| 35 | NADAL ISTNIEJE | `economy.ts:1189–1191` `healthModifier = max(0, 1 + zdrowie·…)` mnoży `zywnoscNetto` (0 przy zdrowie ≤ −20) |
| 36 | NAPRAWIONY | `turn-economy.ts:2918–2926` (r2) |
| 37 | NAPRAWIONY | `ai.ts:681–684` `epochGateMet`, `epochTierGateMet`, `researchGatesMet` w `scoreTech` |
| 38 | NAPRAWIONY | `wonder-placement.ts:34` (r2) |
| 39 | NAPRAWIONY | `muzyka-antyczna.ts:2037–2044` (r2) |
| 40 | NAPRAWIONY | `main.ts:22154–22159` (r2) |
| 41 | NADAL ISTNIEJE | `buildings.json` `wielka_kuznia` `epokaWejscia` 4 (wyciąg z pinu, r3); gra ma 3 epoki (r2) |
| 42 | NAPRAWIONY | `main.ts:30659–30661`, `:38772–38773` (r2) |
| 43 | NAPRAWIONY | `main.ts:30666–30669`, `:37290–37293`, `:38802–38808` (r2) |
| 44 | NAPRAWIONY | zapis `main.ts:30579–30581`; odczyt `main.ts:39097–39104` |
| 45 | NAPRAWIONY | `main.ts:21562` `cityOptions: cities.filter(isMe…)` (komentarz `#45`) |
| 46 | NAPRAWIONY | `diplomacy-proposals.ts:1641–1642` `ctx.proposerRespekt < progGraniceWojskoweRespekt` |
| 47 | NAPRAWIONY | `main.ts:10150–10155` (r2) |
| 48 | NIEROZSTRZYGNIĘTY | `computeObjectivePower` i zdobycze przy eliminacji nieprzeczytane |
| 49 | NIEROZSTRZYGNIĘTY | `gra/src/main.ts:~11178`: cytat nieprzeliczony, bez potwierdzonego wiersza (zarzut 3); rozstrzygnięcie w osobnym temacie |
| 50 | NAPRAWIONY | `main.ts:15125–15127` `consume ? consumeReadyMachines : peekReadyMachines`; komentarz: zużycie dopiero po potwierdzonym szturmie |
| 51 | NADAL ISTNIEJE | `auto-battle-power.ts:39–40` `isFieldBattleUnit` zwraca `false` dla `isSiegeUnit`; `unit-power.ts:86` `'Oblężnicza'`. Machiny dają 0 do mAtk auto-szturmu |
| 52 | NAPRAWIONY | `main.ts:15079` `Health: u.hp ?? effectiveRuntimeUnitMaxHp(...)` |
| 53 | NIEROZSTRZYGNIĘTY | `mapFieldBattle.ts` `unitDefFor(u)` nadal w ścieżce szans; kolejność `registerMilitiaDef` względem preBattle nie domknięta |
| 54 | NADAL ISTNIEJE | `combat.ts:539–542` dopasowanie po podciągu (r2, nieponowione w r3) |
| 55 | NAPRAWIONY | `post-battle-map.ts:554` (r2) |
| 56 | NAPRAWIONY | `ai.ts:4529–4544` `findNearestVillage` iteruje `for (const v of villages)`, bez `Object.keys(map.hexes)` |
| 57 | NAPRAWIONY | `main.ts:2964–2992` cache `villageHexKeysCached()` |
| 58 | NAPRAWIONY | brak odczytu pola `Super` (r2) |
| 59 | NIEROZSTRZYGNIĘTY | `economy.ts:664–697` nieprzeliczone |
| 60 | NIEROZSTRZYGNIĘTY | `main.ts:8098–8106` nieprzeliczone |
| 61 | NAPRAWIONY | `playerState.ts:72` (r2) |
| 62 | NIEROZSTRZYGNIĘTY | Martwy if/else z l. 283–287 usunięty. Purge `purgeInlandWaterForMultiLandTyp` wołany warunkowo (`generator.ts:335`, `:347`, `:353` gated `typ !== 'pangea'`), ale bezwarunkowo w `:369`. Czy pangea traci jeziora przez `:369`, nie domknięte |
| 63 | NAPRAWIONY | `startScoring.ts:80–87` pętla `dq,dr ∈ [-4,4]`, `dist ≤ 4` osiągalne; gałąź `dist 2..4` działa |
| 64 | NAPRAWIONY | patrz §8.0 pkt 7 |
| 65 | NAPRAWIONY | `filePlayer.ts:310–311` `isIncomingCrossfade` obsługiwany w `onError` |
| 66 | NAPRAWIONY | `gra/src/main.ts:10053–10066` case `tech` dla `toOwnerId===0` wywołuje `reconcilePlayerEraFromResearch` (komentarz `#66`; wywołanie kodowe l. 10065) |
| 67 | NAPRAWIONY | `units.json` Typ = `Slinger` (r2) |
| 68 | NAPRAWIONY | `main.ts:37030–37031`, `:37144–37145` (r2) |
| 69 | NAPRAWIONY | `gamePauseMenu.ts:268–271` ponowne sprawdzenie `hasSave` przy kliknięciu; `:294` odświeżanie |
| 70 | NAPRAWIONY | `main.ts:7351` `religionHappiness(…, builtIds.includes('swiatynia'))` |
| 71 | NAPRAWIONY | `civ-roster.ts:174` round-robin `shuffledAi[idx % len]` (komentarz `Audyt #71`); fallback l. 171 tylko gdy pula pusta |
| 72 | NAPRAWIONY | patrz §8.0 pkt 5 |
| 73 | NAPRAWIONY | `gra/src/render/cities.ts:750–759` `_removeStatChip` nie dispose'uje współdzielonej tekstury (komentarz l. 754–756) |

### 8.2 AUDYT-PARYTET-AI-2026-07-24.md — PARYTET #1–#8 (r3)

Audyt oznacza punkty ✅. Tu sprawdzono, czy cytowane symbole istnieją na pinie. Zachowanie nie przeliczone linia po linii.

| # | Status | Dowód (pin) |
|---|---|---|
| 1 | NIEROZSTRZYGNIĘTY | `ownerResourceStockAll` / `deductBuildingStockCostAcrossCities` obecne (27 / 28 trafień), `game/building-stock-cost.ts` istnieje. Cap 100+100/Magazyn nieprzeliczony |
| 2 | NIEROZSTRZYGNIĘTY | `tryAutoEnqueueBuild` obecne (11 trafień). `cityPanel.ts:4291–4308` nieprzeliczone |
| 3 | NIEROZSTRZYGNIĘTY | `computePracaUpkeepByOwner` obecne (9 trafień). Wartości nieprzeliczone |
| 4 | NIEROZSTRZYGNIĘTY | `HandelSurowiecCyklicznyItem` obecne (9 trafień). `diplomacy-treaties.ts` istnieje |
| 5 | NIEROZSTRZYGNIĘTY | `applyWonderCityYields` obecne (5 trafień) |
| 6 | NIEROZSTRZYGNIĘTY | `stolarniaCountByOwner` obecne (8 trafień) |
| 7 | NADAL ISTNIEJE (luka AI-zakup) | `AICmdPurchase*` = 0 trafień w `gra/src`. AI nie ma komendy zakupu za złoto; gracz ma `purchaseRecruitmentUnit` (`main.ts:3972`). Część „max 1 żywa" nieprzeliczona |
| 8 | NIEROZSTRZYGNIĘTY | `aiDiffLevelForOwner` obecne (10 trafień); linia z audytu (`main.ts:4007`) nieaktualna |
| L2 | NIEROZSTRZYGNIĘTY | „Wyrąb lasu AI" cytuje `main.ts:14863–14893`, a to kod oblężenia (§6.2). Odniesienie nieaktualne, mechanika nieprzeliczona |

### 8.3 Pliki AUDYT — wiersz per plik (r3)

| Plik | Wynik r3 | Dowód / uwaga |
|---|---|---|
| `dyspozycje/AUDYT-KODU-2026-07-21.md` | NAPRAWIONY 56 · NADAL 7 · NIEROZSTRZYGNIĘTY 10 (korekta r4: ujednolicone z §8.1 i §8.6; wcześniej 57/7/9 — błąd przepisania) | §8.1, §9.1 |
| `dyspozycje/AUDYT-NAPRAWY-LOG.md` | Log, nie błąd gameplayu | `git merge-base --is-ancestor 6adfb79 edb8fb56`: tak |
| `dyspozycje/AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md` | Mieszany: patrz rozbicie | `przyrost*` NAPRAWIONY (`production.ts:244–249`, r2). `utrzymanie` NIEROZSTRZYGNIĘTY (cytat `economy-upkeep.ts:585` błędny: to `budynekUtrzymanieFlat: 1`; literał w `gra/src/game/economy-upkeep.ts` l. 3, 25–29, 555–561, 595; nieponowione w r3). `odblokowuje` NADAL (`buildings.json:992,1040,1474,1523,1572`, r2, nieponowione). Targowisko NIEROZSTRZYGNIĘTY (`gra/data/buildings.json:303`: `baza.pieniadz` 5, `przyrost.pieniadz` 3, zgodne z Poradnik l. 196 (+5/+8/+11 ¤); zerowe tylko `praca`; czy silnik czyta te pola: nieprzeliczone). Pretorium NIEROZSTRZYGNIĘTY (`gra/data/buildings.json:1829`: `baza` praca 2, pieniądz 3, kultura 5; `przyrost` praca 1, pieniądz 2; zerowe tylko `obrona` i `mnoznik`; zarzut „dolicza do Pracy” ma podstawę w `baza.praca`). Mury/Fort NAPRAWIONY (efekt procentowy: `gra/src/game/city-defense.ts:55–61`; pola `buildings.json:998, :1439` zerowe). Wielka Kuźnia NADAL (`:1394`, r3). Akademia `:1586` NIEROZSTRZYGNIĘTY (mnożnik Pracy/nauka nieprzeliczony). Kuźnie/Koszary: obietnica Poradnika NAPRAWIONY (`unit-building-bonuses.ts:67,70`); mnożnik Pracy `economy.ts:21–22` NIEROZSTRZYGNIĘTY (korekta §6.2). Warsztat `:1537` i Kuźnia żelaza `:1339` NIEROZSTRZYGNIĘTY (wykluczenie z Pracy). `converters.ts` NIEROZSTRZYGNIĘTY (l. 61 to komentarz). „NOWE nr 4" `wikiBundle.json` NIEROZSTRZYGNIĘTY |
| `dyspozycje/AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` | Mieszany | Mury/Fort NAPRAWIONY (`city-defense.ts:55–61`); Pretorium NIEROZSTRZYGNIĘTY (dane niezerowe, §8.3). Lazaret NADAL (`tech.json:430` opis bez wpisu w `buildings.json`, r2). Kuźnie/Koszary/Akademia wojskowa/Warsztat NAPRAWIONY (Poradnik 194–195). Pozostałe 25 haseł NIEROZSTRZYGNIĘTY |
| `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` | §8.2 | PARYTET #1–#6, #8 NIEROZSTRZYGNIĘTY; #7 (zakup AI) NADAL ISTNIEJE; wyrąb L2 NIEROZSTRZYGNIĘTY |
| `dyspozycje/AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` | Werdykt design | NIEROZSTRZYGNIĘTY. Stała sep 14 nie sprawdzona w r3 |
| `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` | Treść opisowa | NIEROZSTRZYGNIĘTY. Sprawdzono tylko Poradnik 194–197 |
| `dyspozycje/AUDYT-WERYFIKACJA-53-WERDYKTY.md` | Werdykty sceptyków | #22 NAPRAWIONY (`b1a7a61` przodek pinu, r2). Pozostałe werdykty NIEROZSTRZYGNIĘTY: nieprzeliczone, §8.1 ich nie obejmuje (zarzut 9) |
| `dyspozycje/KULTURA-RELIGIA-AUDYT-2026-07-22.md` | Nazwa poza wzorcem `AUDYT-*`; liczony | Teza częściowo nieaktualna: konsumenci istnieją (`culture-religion.ts` obecny; `turn-economy.ts:177–204`). Siła wpływu NIEROZSTRZYGNIĘTY |
| `dyspozycje/AUDYT-OBIEG-DOKUMENTOW-2026-07-05.md` | WYKLUCZONY (proces) | Obieg dokumentów, nie gameplay |
| `dyspozycje/_handoff/AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md` | Propozycja: WYKLUCZYĆ | Poza globem `dyspozycje/AUDYT-*.md` (podkatalog `_handoff/`); data 2026-08-18 poza oknem 07-21…08-13; treść: zgodność dokumentów z `WERSJE.md` i zamknięciem fal (proces). Dowód: `git show edb8fb56:dyspozycje/_handoff/AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md`, l. 1–25 |
| `dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md` | Propozycja: WYKLUCZYĆ | Poza globem; data 2026-07-03 przed oknem; treść: synchronizacja mockupów Design z kodem miasta (MD5, playtest), bez twierdzeń o błędach gameplayu w sekcji 1. Dowód: `git show edb8fb56:dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md`, l. 1–25 |

### 8.4 Korekty do §6 i §7

- §6.2 wiersz „Kuźnia/Koszary" i §7.2 wiersz „Civpedia 193" są zastąpione przez §8.0 pkt 6 i §8.3. Wiersze Mury/Fort/Pretorium w §6.2 (l. 118) i §7 (l. 225) również.
- Liczniki „34 NAPRAWIONY / 6 NADAL / 33 NIEROZSTRZYGNIĘTY" z §7.1 są zastąpione przez §8.1 (56 / 7 / 10).

### 8.5 Ograniczenia rundy 3

- **NIEROZSTRZYGNIĘTY (formalnie dopuszczalne, merytorycznie otwarte):** AUDYT-KODU #2, 4, 20, 31, 48, 49, 53, 59, 60, 62; PARYTET #1–#6, #8 i L2; `AUDYT-STOLICE`; treść `AUDYT-OPISY` (25 haseł); siła wpływu `KULTURA-RELIGIA`.
- Pozycje **NADAL ISTNIEJE** z r2 i nieponowione w r3: #54, `odblokowuje` (`buildings.json`) (`utrzymanie` przeniesione do NIEROZSTRZYGNIĘTY, zob. §8.3).
- Nie uruchomiono testów, `cargo` ani gry (zakaz w temacie). Commit: §8 i zmiany §7.1 są już w `cea1c383` (nie z tej rundy); obrona r3 zmienia plik w worktree, bez commita. `gra/**` nietknięte.
- **Kryterium binarne (zarzut 9): NIESPEŁNIONE** dla AUDYT-OPISY (79 wierszy, 1 status), AUDYT-STOLICE (1 status), AUDYT-WERYFIKACJA-53 (werdykty nieprzeliczone), AUDYT-CIVPEDIA (25 haseł, 1 status). Wymagany osobny temat z pozycjami.

### 8.6 Odpowiedzi na zarzuty Evaluatora (obrona r3)

| Zarzut | Decyzja | Dowód / zmiana |
|---|---|---|
| 1 (§7.1 rows 44/64/72) | PRZYJMUJE | Wiersze przywrócone do treści `9311ea21`; korekty tylko w §8. |
| 2 (pin/izolacja) | CZĘŚCIOWO | ODRZUCONE: `main` istnieje lokalnie (`refs/heads/main` = `edb8fb56`) i jako `origin/main`. PRZYJĘTE: `edb8fb56` nie jest przodkiem HEAD `4f8ef9c6`; praca w worktree, nie w świeżym checkoutcie. Dowody tylko `git show/grep edb8fb56`. Premisa pliku wynikowego: decyzja Final Control. |
| 3 (`~301`, `~11178`) | PRZYJMUJE | `gra/src/game/diplomacy-value-catalog.ts:527, :530`. `main.ts:~11178` bez potwierdzonego wiersza → rozstrzygnięcie w osobnym temacie. |
| 4 (`:178`) | PRZYJMUJE | Poprawiono na `:195`. |
| 5 (Targowisko, Pretorium) | PRZYJMUJE | Przepisano wg pól `buildings.json`. Mury/Fort: samokorekta na NAPRAWIONY. |
| 6 (ścieżki) | CZĘŚCIOWO | Dodano klucz ścieżek (nagłówek §8) i pełne ścieżki w pkt 6 oraz w poprawionych wierszach. Pozostałe wiersze czytać przez klucz. |
| 7 (NAPRAWIONY bez dowodu) | CZĘŚCIOWO | #24 ODRZUCONE (wiring `main.ts:33669–33672`). #2 PRZYJĘTE → NIEROZSTRZYGNIĘTY. #66 ODRZUCONE (wywołanie l. 10065). #73 ODRZUCONE co do treści (kod `render/cities.ts:750–759`), PRZYJĘTA tylko zmiana ścieżki. |
| 8 (`utrzymanie`) | PRZYJMUJE | Status NIEROZSTRZYGNIĘTY (cytat błędny). |
| 9 (kryterium binarne) | PRZYJMUJE | Niespełnione dla AUDYT-OPISY, STOLICE, WERYFIKACJA-53, CIVPEDIA. Osobny temat. |

---

## 9. Runda 4/5 — R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`)

**Dowody:** wyłącznie `git show edb8fb56:…`, `git grep edb8fb56`, `git ls-tree edb8fb56` oraz odczyt JSON z pinu (`python3 -I`) wykonane w tej rundzie. Numery linii z tych poleceń. Zakres: zarzut 9 r3 (cztery pliki) oraz ujednolicenie licznika (§9.1). §1–§8 nietknięte, poza jedną komórką §8.3 (licznik AUDYT-KODU).
**Legenda:** NAPRAWIONY = warunek błędu nie występuje na pinie; NADAL ISTNIEJE = warunek występuje; NIEROZSTRZYGNIĘTY = nie przeliczono w tej rundzie (wpis mówi, czego brakuje). Dla twierdzeń-faktów (wartość podana przez audyt jako stan faktyczny) NAPRAWIONY oznacza wyłącznie, że twierdzenie przestało być prawdziwe na pinie (zmiana faktu, dopisek „zmiana faktu”), a nie że audytowany błąd został naprawiony.
**Uwaga:** „wiersz" poniżej = pozycja z pliku źródłowego. Pliki z pełnym pokryciem: §9.2 (53/53), §9.3 (wszystkie pozycje CivPedii z dispatchu). Pliki z pokryciem częściowym: §9.4 (STOLICE — wszystkie twierdzenia wypisane, kilka nieprzeliczonych), §9.5 (OPISY — tylko wybrane pozycje, patrz zastrzeżenie).

### 9.1 Licznik AUDYT-KODU (ujednolicenie)

Przeliczone z tabeli §8.1 (73 pozycje; wiersz „15, 26" = 2 pozycje):
- NAPRAWIONY **56** (1, 3, 5, 7–19, 22–28, 30, 32–34, 36–40, 42–47, 50, 52, 55–58, 61, 63–73; w tym 15 i 26),
- NADAL ISTNIEJE **7** (6, 21, 29, 35, 41, 51, 54),
- NIEROZSTRZYGNIĘTY **10** (2, 4, 20, 31, 48, 49, 53, 59, 60, 62).

Razem 73. §8.3 skorygowano z 57/7/9 na 56/7/10 (zob. wiersz `AUDYT-KODU` w §8.3). Ta liczba obowiązuje w §8.1, §8.3, §8.5 i §8.6.

### 9.2 AUDYT-WERYFIKACJA-53-WERDYKTY.md — 53 znaleziska, status per pozycja

Źródło: nagłówki `## #N` w pliku (`git show edb8fb56:dyspozycje/AUDYT-WERYFIKACJA-53-WERDYKTY.md`). Numeracja zgodna z AUDYT-KODU. Podsumowanie: **NAPRAWIONY 42 · NADAL ISTNIEJE 5 · NIEROZSTRZYGNIĘTY 6** (razem 53).

| # | Status | Dowód (pin `edb8fb56`, r4) |
|---|---|---|
| 1 | NAPRAWIONY | `gra/src/main.ts:10221–10228`: `case 'jednostka'` → `break` (odrzucenie w silniku); TODO A1 w 10222–10225 zostaje |
| 2 | NIEROZSTRZYGNIĘTY | `main.ts:30068`, `:30229` (komentarze „nie []”); `git grep 'survivors: \[\]'` = 0 trafień; `main.ts:28343` `manualSurvivors: survivors !== undefined`. Zachowanie `applyAutoLosses` (straty proporcjonalne) nieprzeczytane |
| 10 | NAPRAWIONY | `gra/src/game/combat.ts:216–218` `unitRowStat(def,'armor','Pancerz',0)` (fallback PL). Dane: `gra/data/units.json` 25 z 75 wierszy bez pól EN `armor/piercing/chargeBonus` (fallback aktywny, dane nie uzupełnione) |
| 11 | NAPRAWIONY | `gra/src/game/production.ts:277–281` (koszt 0 zostaje 0 dla `Super-jednostka=TAK`); limit 1 żywej sztuki egzekwowany w `:953` (`if (u['Super-jednostka'] === 'TAK' && ctx.aliveUnitTypeNames?.has(u.Jednostka)) continue;`); `:438` to komentarz (r4) |
| 12 | NAPRAWIONY | `main.ts:36047` `advanceSeat()` z jednym strażnikiem (komentarz R-HOTSEAT); klawisz N (`KeyN`) wywołuje `advanceSeat()` (`:36223–36231`) |
| 13 | NAPRAWIONY | `main.ts:30635` zapis `lootedVillageHexKeys`; odczyt `:38757–38761` |
| 14 | NAPRAWIONY | `main.ts:37262` `battlePowerPtsByOwner.clear()` w starcie gry; `:38603` clear przy load + odtworzenie `:38604–38606` |
| 15 | NAPRAWIONY | zapis `main.ts:30654–30658` (`typCityCopyOwners`, `clusterPlacement` i pokrewne); odczyt `:38602` (`clusterPlacement`) i pokrewne (r2 `:38570–38602`) |
| 16 | NAPRAWIONY | `main.ts:20704–20711`: `applyPnTrustForPair` tylko gdy `dealCovered` (`basketItemsAffordable` obu stron) |
| 17 | NAPRAWIONY | `gra/src/ui/cityPanel.ts:1196` (flagi budynków w ctx), `:1212` `getCityBuildingFlags` scalone do ctx |
| 18 | NAPRAWIONY | `main.ts:21672` `hp: u.hp ?? hpMax` (r4 re-odczyt: linia 21672 potwierdzona) |
| 19 | NAPRAWIONY | `gra/src/game/diplomacy-proposals.ts:1688`: `if (ctx.proposerRespekt < wasalRespektThreshold)` |
| 20 | NIEROZSTRZYGNIĘTY | `gra/src/game/diplomacy-value-catalog.ts:527–530` (kurs `100/Rel`, `diplomacyDealFairAtRel`) istnieje; guard ¤↔¤ i limit kursu nieprzeliczone |
| 21 | NADAL ISTNIEJE | `diplomacy-proposals.ts:1144–1152` `case 'trybut_zadanie'`: sprawdzany tylko dolny próg `progTrybutMinGoldPerTurn`; brak górnego limitu kwoty; w tym `case` nie ma `pairHasKind` |
| 22 | NAPRAWIONY | `main.ts:20515` `computeRespekt(potProposer, potResponder)` i `:20516` `computeRespekt(potResponder, potProposer)` (r4 re-odczyt); `git merge-base --is-ancestor b1a7a61 edb8fb56`: tak. Strona pętli AI: `main.ts:33898` `computeRespekt(potAI, potPlr)` (r4; kolejność argumentów zgodna z `diplomacy.ts:1594`, wynik nie porównany z audytem). Cytat r2 `main.ts:12163–12166` usunięty — to komentarz o zwrocie ruchu, nie pętla AI |
| 23 | NAPRAWIONY | `main.ts:31819–31834`: atrycja garnizonu zdejmuje realne HP, `units.splice` (`:31831`), `syncGarnizonForCity` (`:31834`) |
| 24 | NAPRAWIONY | `gra/src/game/ai.ts:3192–3193` `filter(aiCanEngageOwner)`; bramka `:520` |
| 25 | NAPRAWIONY | `main.ts:29119` `if (oldOwner === REBEL_FACTION_OWNER_ID)` w ścieżce zdobyczy stolicy |
| 26 | NAPRAWIONY | jak #15 (`main.ts:30654–30658`) |
| 27 | NAPRAWIONY | cache `cityFogVisible` (`main.ts:2556`, komentarz `:2587–2588`); koszt nieprzeliczony |
| 28 | NAPRAWIONY | `gra/src/units/setup.ts:903` `maxSearchRadius = hexDistance·2 + PATH_SEARCH_RADIUS_BUFFER`; użycie `:981` |
| 29 | NADAL ISTNIEJE | `gra/src/game/ai.ts:4437` `findCityFoundingHex` (dawniej findSettlerTarget); `:4469` `for (const key of Object.keys(map.hexes))` — pełny skan per wywołanie |
| 30 | NAPRAWIONY | `main.ts:26303` `if (k === hoverKey) return;` przed `currentVisible()` (`:26310`) |
| 31 | NIEROZSTRZYGNIĘTY | komentarz `main.ts:35042` deklaruje klasyfikację po id; mapowanie nazwa→id w `ai.ts` nieprzeliczone |
| 32 | NAPRAWIONY | `gra/src/game/production.ts:655` definicja `isBuildingSupersededByUpgrade`, `:827` wywołanie w pętli budowy; bramka `:921–925` (r2) |
| 33 | NAPRAWIONY | `gra/src/game/braz-access.ts:25` `empireHasKopalniaMiedzi(ownImprovements)` (lista per imperium, nie per AI) |
| 40 | NAPRAWIONY | `main.ts:22156–22159` `setMood('mapa')` w ścieżce startu gry (komentarz #40). Dynamika (odtworzenie muzyki po zapisie) nieprzetestowana |
| 41 | NADAL ISTNIEJE | `gra/data/buildings.json` `wielka_kuznia` `epokaWejscia: 4` (r4, python na pinie). Mapowanie epok na pinie: `gra/src/game/civ-entry-epoch.ts:10` `GAME_EPOCH_ORDER = ['kamien','braz','zelazo']` (3 epoki); `gra/src/game/building-stock-cost.ts:70–73` (komentarz „Stone x1, Bronze x2, Iron and every later era x4”), `:78` `era >= 3` → x4. Wartość 4 jest poza 3 epokami. Lazaret: 0 wpisów w `buildings.json` (część „Lazaret” NAPRAWIONA w danych; tekst — §9.3) |
| 42 | NAPRAWIONY | zapis `main.ts:30659–30661` (`barbCamps: barbCamps.slice()`); odczyt `:38769–38773` (brak pola = pusta tablica) |
| 43 | NAPRAWIONY | zapis `main.ts:30666–30669` (`cityRelig: Array.from(...)`, r4); reset `:37290–37293` i odczyt `:38802–38808` (r4 re-odczyt) |
| 44 | NAPRAWIONY | zapis `main.ts:30579–30581` (`aiSkarbiecByOwner`); odczyt `main.ts:39097–39104` (r4: odtworzenie pętlą `set`) |
| 45 | NAPRAWIONY | `main.ts:21562–21564` `cityOptions: cities.filter(c => isMe(c.ownerId)).map(...)` |
| 46 | NAPRAWIONY | `diplomacy-proposals.ts:1641–1642` `ctx.proposerRespekt < p.progGraniceWojskoweRespekt` |
| 47 | NAPRAWIONY | `main.ts:10150–10155` (komentarz „Audyt #47”: dawca traci Pracę, odbiorca dostaje ją do własnej puli) |
| 48 | NIEROZSTRZYGNIĘTY | `computeObjectivePower` i zdobycze przy eliminacji nieprzeczytane |
| 49 | NIEROZSTRZYGNIĘTY | `main.ts:~11178` — cytat bez potwierdzonego wiersza (zarzut 3 r3) |
| 50 | NAPRAWIONY | `main.ts:15124–15127` `consume ? consumeReadyMachines(city) : peekReadyMachines(city)` |
| 51 | NADAL ISTNIEJE | `gra/src/game/auto-battle-power.ts:40` `if (isSiegeUnit(def)) return false;`; `unit-power.ts:85–86` (`Rola (linia) === 'Oblężnicza'`), `:163` `if (isSiegeUnit(u)) return 0;` — machiny dają 0 do mAtk auto-szturmu |
| 52 | NAPRAWIONY | `main.ts:15079` `Health: u.hp ?? effectiveRuntimeUnitMaxHp(u, def)` |
| 53 | NIEROZSTRZYGNIĘTY | `mapFieldBattle.ts:215–224` nieprzeliczone; kolejność `registerMilitiaDef` względem preBattle nieustalona |
| 54 | NADAL ISTNIEJE | `gra/src/game/combat.ts:542` `aLow.includes(cAtk) \|\| cAtk.includes(aLow)` (dopasowanie po podciągu) |
| 55 | NAPRAWIONY | `gra/src/game/post-battle-map.ts:554` `if (city.rebelState) city.rebelState = false;` |
| 56 | NAPRAWIONY | `gra/src/game/ai.ts:4529` `findNearestVillage(unit, …)` iteruje listę wiosek (r3: `:4529–4544`, bez `Object.keys(map.hexes)`) |
| 57 | NAPRAWIONY | `main.ts:2964` cache `villageHexKeysCached()` (komentarz „Audyt #57”) |
| 58 | NAPRAWIONY | `git grep` na `.Super` w `main.ts`/`production.ts`: 0 odczytów pola `Super` (tylko `Super-jednostka`) |
| 66 | NAPRAWIONY | `main.ts:10065` `reconcilePlayerEraFromResearch();` w gałęzi `case 'tech'` (`:10053–10066`) |
| 67 | NAPRAWIONY | `gra/data/units.json`: `Procarz (Huaracoc)` ma `Typ = Slinger` (python na pinie, r4) |
| 68 | NAPRAWIONY | `main.ts:37030` `try { camCtrl.dispose(); }` przed `new CameraController(...)` (także `:37144–37145`, r2) |
| 69 | NAPRAWIONY | `gra/src/ui/gamePauseMenu.ts:268` ponowne sprawdzenie `hasSave` przy kliknięciu (komentarz „Nie polegamy na stałej hasSave”) |
| 70 | NAPRAWIONY | `main.ts:7351` `religionHappiness(…, builtIds.includes('swiatynia'))` |
| 71 | NAPRAWIONY | `gra/src/game/civ-roster.ts:174` round-robin `shuffledAi[idx % shuffledAi.length]` (komentarz „Audyt #71”) |
| 72 | NAPRAWIONY | `main.ts:31612–31631` (komentarz `#72`, sprzątanie oblężenia/garnizonu), `units.splice` `:31628–31630` |
| 73 | NAPRAWIONY | `gra/src/render/cities.ts:750` definicja `_removeStatChip` (r4); wywołania `:505`, `:549`, `:858` (r4) |

### 9.3 AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md — pozycje 1–9, 25 haseł, Lazaret, Karawanseraj

Źródło tekstu: `gra/src/data/wikiBundle.json` (pole `encyklopedia`, 26 wpisów w kategorii „Budynki” — audyt liczy 25; wpis `wielka_kuznia` jest dodatkowy). Odczyt JSON przez `python3 -I`.

| Pozycja | Status | Dowód (pin, r4) |
|---|---|---|
| 1 Mury „+5 obrony”, Fort „+15 obrony” | NAPRAWIONY | `wikiBundle` `mury`: „To **nie** jest płaski bonus „+5 obrony” ani 10 poziomów flat… **Maks. 2 poziomy**”; `fort`: „To **nie** są płaskie „+15 obrony”” (negacja, 2 trafienia, r4). Efekt % w kodzie: `gra/src/game/city-defense.ts:55–61` (r3) |
| 2 `cityPanel.ts:5013` renderuje `uwagi` | NAPRAWIONY | cytat nieaktualny: `cityPanel.ts:5011–5017` to `appendDetailAlgo(...)`. `git grep uwagi` w `cityPanel.ts`: 1 trafienie (komentarz `:7173`), brak renderu pola `uwagi` w karcie budynku |
| 3 Wielka Kuźnia „epoka Średniowiecze” | NAPRAWIONY (tekst) / NADAL ISTNIEJE (dane) | wiki `full`: „usunięto fałszywą epokę Średniowiecze”; `buildings.json` `wielka_kuznia` `epokaWejscia: 4` (= WERYF #41) |
| 4a Kuźnia, Kuźnia żelaza, Koszary, Warsztat oblężniczy, Akademia wojskowa — „Mnożnik % dotyczy…” | NAPRAWIONY | 0 trafień frazy w `wikiBundle` (sprawdzone 5 haseł) |
| 5 Targowisko „+0 % mnożnika handlu” | NAPRAWIONY | wiki: „Daje Pieniądz na turę — nie mnożnik handlu ani Daniny”; „Brak mnożnika %” |
| 6a Akademia „mnożnik globalnej puli nauki” | NAPRAWIONY (tekst) / NIEROZSTRZYGNIĘTY (silnik) | wiki: „nie mnożnik globalnej puli nauki”. Konsument „Praca zamiast nauki” nieprzeliczony (r3, `buildings.json:1586`) |
| 6b Pretorium „mnożnik % do przychodu podatkowego” | NAPRAWIONY | wiki: „dawny mnożnik podatkowy i +2 obrony były martwe”. Dane `buildings.json:1829` (`baza` praca 2, pieniądz 3, kultura 5) — r3 |
| 6c Karawanseraj „handel lądowy” | NAPRAWIONY (wiki i tech) | 0 trafień `karawanseraj`/`Karawanseraj` w `wikiBundle` i w `gra/data/tech.json` (r4: `git show edb8fb56:gra/data/tech.json \| grep -i karawanser` = 0). Cytat r3 „tech.json:255 (Karawanseraj; Magazyn)” był FAŁSZYWY: l. 255 to `"Dostęp do surowca.": null`; wpis zamknięty |
| 7 Pretorium „+2 obrony” | NAPRAWIONY | wiki: „bez bonusu obrony”; `buildings.json` pole `obrona` = 0 (r2/r3) |
| 8 „Utrzymanie X ¤/turę (+1 ¤/poziom)” — 25 haseł | rozbite poniżej | — |
| 8a frazę „(+1 ¤/poziom)” zawierają: biblioteka, laznia_publiczna, palac, port, sad, swiatynia, teatr (7) | NADAL ISTNIEJE | `wikiBundle` `encyklopedia[*].wikiS/wikiM` — fraza obecna (14 wystąpień, r4); `economy-upkeep.ts:585` `budynekUtrzymanieFlat: 1` (r4) |
| 8b frazę wariantową „+1 ¤ na poz. 2 / na wyższych poziomach”: koszary, mury, targowisko (3) | NIEROZSTRZYGNIĘTY | fraza różna od audytu; zgodność z silnikiem zależy od PYTANIA 19 (nieprzeliczone) |
| 8c pozostałe 16 wpisów bez frazy (akademia, akademia_wojskowa, baszta, fort, garnizon, kuznia, kuznia_zelaza, magazyn, pretorium, spichlerz, stela, stolarnia, studnia, kamieniarski, warsztat_oblezniczy, wielka_kuznia) | NAPRAWIONY (tekst) | fraza „+1/poziom” nieobecna; stawka wg PYTANIA 19 nieprzeliczona |
| 9 `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:193` „mnożnik % (kuźnia…, karawanseraj…)” | NAPRAWIONY | pin, l. 193: „Budynki dają stały przyrost… albo efekty wojskowe po wizycie” — fraza mnożnika usunięta |
| Lazaret „zero wystąpień — czysto” | NADAL ISTNIEJE | `wikiBundle` (6 trafień, r4): „Odblokowuje budynki: Łaźnia publiczna, Lazaret” (wiki S/M); `gra/data/tech.json:430` „Lazaret = NOWY budynek” (r4). `buildings.json`: 0 wpisów (część danych — NAPRAWIONA) |
| Karawanseraj — lista miejsc usunięcia (decyzja 15B) | NIEROZSTRZYGNIĘTY | część wiki i `docs/encyklopedia` usunięta (0 trafień w `wikiBundle`); `trade-routes.ts`, `tech.json`, `cityPanel.ts:7316/7395`, `building-icon-map.json`, `docs/PORADNIK-GRACZA/*` nieprzeliczone w r4 |
| Generator `tools/generate-encyklopedia.cjs:97–99` `\|\| 10` / `\|\| 1` | NADAL ISTNIEJE | pin, l. 97–99: `u['Pieniądz (koszt)'] \|\| 10`, `u['Utrzymanie (Pieniądz/turę)'] \|\| 1`, `u['żywność/turę'] \|\| 1` (zob. OPISY 2d) |

### 9.4 AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md — twierdzenia i ich status

Plik ma werdykt „design klastra, nie bug”. Statusy opisują, czy twierdzenie nadal obowiązuje na pinie.

| Twierdzenie | Status | Dowód (pin, r4) |
|---|---|---|
| Sep stolic Standard (`duza`) = **14** hex | NAPRAWIONY (zmiana faktu) | `gra/src/map/clusters.ts:1470–1479` `capitalMinSeparation`, `duza: 15` (`:1474`); komentarz „Standard +1 hex 2026-08-02 wieczór: 14→15” w `:1467` (r4). Nie jest to naprawa błędu, lecz zmiana wartości (zob. legenda). Tabela na pinie: mała/srednia 12, duza 15, ogromna 16, super 19 (audyt podawał 12/16/19 dla innych rozmiarów) |
| MP w klastrze min/max = 5 / 5 | NADAL ISTNIEJE | `clusters.ts:42` `CLUSTER_CITY_STATE_MIN_HEX = 5`; `:47` `CLUSTER_CITY_STATE_MAX_HEX = 5` |
| Obcy typ od stolicy gracza min 12 (`MIN_DIST_FOREIGN_FROM_PLAYER`) | NADAL ISTNIEJE | `clusters.ts:54` `= 12` |
| Bramki stolic: `passesMinCapitalSeparationGate`, `enforceHardCapitalSeparationOnKlastry`, HARD drop w `cluster-spawn.ts` | NADAL ISTNIEJE | `clusters.ts:1631` (definicja), użycia `:2219`, `:3759`, `:3947`; `:2660` definicja, `:4110` wywołanie; `cluster-spawn.ts:318`, `:346`, `:353` (komunikat „Pominięto typ… minSep”) |
| Fail-open tylko dla `short < 80` (bez bramki) | NADAL ISTNIEJE | komentarz `clusters.ts:1483` („short<80 (harness): bez bramki”) |
| Pakowanie MP: `ringDist=5`, `minSep=5`, luzowanie do 3 hex | NIEROZSTRZYGNIĘTY (3 hex) | `clusters.ts:1911` `packCityStatesHubChain`; `:2088`, `:2098` (`[CLUSTER_CITY_STATE_MAX_HEX]` = 5). Luzowanie do 3 nieprzeliczone |
| Menu Standard: MP min 4 / default 5 / max 7 (`MIASTA_PANSTWA_MENU_BY_TIER`) | NIEROZSTRZYGNIĘTY | nazwa stałej nie została potwierdzona w r4 (grep zwrócił pliki zbiorcze: `e-start-params-loader.ts`, `civ-roster.ts`, `playtestMapaSwiata.ts`) — nieprzeliczone |
| Test: `node tools/capital-sep-unit-test.cjs` → 36 PASS | NIEROZSTRZYGNIĘTY | pliki `gra/tools/capital-sep-unit-test.cjs` i `capital-sep-pangea-test.cjs` istnieją na pinie (`git ls-tree`); test nie uruchomiony (zakaz testów w temacie) |
| Chip mapy: nazwa WIELKIMI, dopisek „· miasto-państwo” (`formatCityMapLabel`) | NIEROZSTRZYGNIĘTY | nieprzeliczone w r4 |
| Opcja ABC „MAP-UX-CLUSTER-LABEL” (decyzja właściciela) | NIEROZSTRZYGNIĘTY | decyzja otwarta; `PYTANIA-OTWARTE.md` nieczytany w r4 |

### 9.5 AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md — pozycje wybrane, zastrzeżenie

Plik ma 79 wierszy wg dispatchu (22 rozdziały Poradnika, 27 paneli UI, 136 haseł CivPedii, sekcje systemowe §2). W tej rundzie przeliczono **31 wierszy** tabeli poniżej (część wierszy jest grupowa, np. §2c „pozostałe 10 haseł”, §3 „27 paneli”). Pozostałe wiersze audytu są **NIEROZSTRZYGNIĘTE z braku przeliczenia** — kryterium binarne dla tego pliku **nie jest spełnione**.

| Pozycja (§) | Status | Dowód (pin, r4) |
|---|---|---|
| §2a boilerplate „Przykład liczbowy / Strategia / Typowe błędy” w 22 rozdziałach | NIEROZSTRZYGNIĘTY | nie przeliczono liczebności wystąpień |
| §2b Cuda: „×3 plony w mieście wzniesienia” (19 kart) | NIEROZSTRZYGNIĘTY | nie przeliczono wiki `cuda-*` |
| §2b Jednostki: identyczny „Countery i taktyka” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §2b Cywilizacje: identyczna „Strategia dla gracza” 9/9 | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §2c Rozjazd ×5 — Akademia (wiki 8× drewno / 14× cegła vs dane) | NADAL ISTNIEJE | wiki: „Koszt **70** pracy + **8× drewno, 14× cegła**”; `buildings.json` `akademia`: `koszt_surowce: {drewno: 40, cegla: 70}` |
| §2c Rozjazd ×5 — pozostałe 10 haseł „Budynki” | NIEROZSTRZYGNIĘTY | przeliczono tylko Akademię |
| §2c Rozjazd ×5 w `units.json` / `terrain-improvements.json` | NIEROZSTRZYGNIĘTY | nie sprawdzono (wprost zalecone w audycie) |
| §2d Generator `\|\|` → fabrykowane 10¤ | NADAL ISTNIEJE | `tools/generate-encyklopedia.cjs:97–99` (pin) |
| §2e cityPanel: literały „normal” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §3 Okolica: wagi `{3,0.5,0.5}` | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §3 Porządek: Bunt 10% / 2 tury (hard) | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §3 Podział danina: „batony 1/2/3” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| §3 27 paneli: 17 bez recenzji | NIEROZSTRZYGNIĘTY | zakres audytu (nie błąd kodu) |
| Poradnik rozdz. 06: mechanika wzrostu „bufora / suwaka 70/30” (martwa) | NADAL ISTNIEJE | `populationGrowth` (`gra/src/game/economy.ts:1181`) — jedyne trafienia w `gra/src` to definicja i komentarze (`economy-upkeep.ts:173,190,209`, `turn-economy.ts:1310,1314,2740`); brak wywołania |
| Poradnik rozdz. 03: suwak „domyślnie 30% wojsko / 70% rozwój” (realnie 100/0) | NADAL ISTNIEJE | `gra/src/game/cities.ts:570` `DEFAULT_PROCENT_ROZWOJ = 100`; wiki zawiera frazę „70/30” w 19 miejscach |
| Poradnik rozdz. 06: tabela §35.3 pomylone kolumny trudności; SzMax 12/18/24 | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 11: „mur 5+3/poziom” | NIEROZSTRZYGNIĘTY | `git grep '5+3'` na pinie w `docs/`, `gra/src`, `gra/data`: 0 trafień; wiki `mury` („Maks. 2 poziomy”) nie dowodzi stanu rozdz. 11; rozdz. 11 (`docs/PORADNIK-GRACZA/11-oblezanie.md`) nieprzeliczony wprost (r4) |
| Poradnik rozdz. 13: Rzymianie „+35% odnowy” / kary Chińczyków | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 12: próg Handlu „Relacja ≥ 40” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 17: boks „Skrót Spacja=Wykonaj” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 28: „Kopalnia” (usunięta mechanika), „Bydło” | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 45: Świątynia — epoka/technologia | NADAL ISTNIEJE | wiki `swiatynia`: „epoka Kamień”; `buildings.json` `swiatynia` `epokaWejscia: 2`. Mapowanie numeryczne (r4): 1=Kamień, 2=Brąz (`building-stock-cost.ts:70–73`, `civ-entry-epoch.ts:10`), więc dane dają Brąz, a wiki Kamień |
| Poradnik rozdz. 45: Wielka Kuźnia niedostępna (epoka 4 vs 3 epoki) | NADAL ISTNIEJE | `buildings.json` `wielka_kuznia` `epokaWejscia: 4` (r4); `building-stock-cost.ts:78` (`era >= 3` → x4, „every later era”) — wartość 4 poza 3 epokami z `civ-entry-epoch.ts:10` |
| Poradnik rozdz. 57: 47/47 „Moc w polu” w prozie | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 91: „Piramidy kosztują 20 pracy” (boks) | NADAL ISTNIEJE | `gra/data/wonders.json` `piramidy` `kosztBudowy: 160`; wiki: 1 trafienie frazy „Koszt 20 pracy” |
| Poradnik rozdz. 91: Posąg Peruna (epoka) | NIEROZSTRZYGNIĘTY | nie przeliczono |
| Poradnik rozdz. 07 l. 193 (mnożnik % kuźni/karawanseraju) | NAPRAWIONY | pin, l. 193: „stały przyrost… albo efekty wojskowe po wizycie” |
| CivPedia „Budynki” — 13/25 „maksymalnie 10 poziomów” | NIEROZSTRZYGNIĘTY | frazy „maksymalnie 10 poziomów” w 1 wpisie (`mury`, jako negacja); pozostałe nieprzeliczone |
| CivPedia „Lazaret” (wpis w wiki) | NADAL ISTNIEJE | `wikiBundle`: „Odblokowuje budynki: Łaźnia publiczna, Lazaret” (6 trafień) |
| CivPedia „Karawanseraj” (wpis w wiki) | NAPRAWIONY | 0 trafień w `wikiBundle` |
| CivPedia „Targowisko” („+0 %”) | NAPRAWIONY | wiki: „nie mnożnik handlu” (zob. §9.3) |

**Zastrzeżenie (OPISY):** nie przeliczono m.in. rozdziałów 00, 01, 02, 04, 05, 08, 09, 10, 14, 15, 16 Poradnika (poza zgrupowanymi wierszami §2), 17 paneli UI z listy „skatalogowane” (§3) oraz większości haseł CivPedii poza wymienionymi. Kryterium binarne z dispatchu nie jest spełnione. Potrzebny osobny temat z pozycjami (np. ZLECENIA per rozdział/kategoria), zgodnie z §8.5 r3.

### 9.6 Podsumowanie r4 i ograniczenia

- AUDYT-KODU: licznik ujednolicony (§9.1; §8.3 skorygowano). Zakres §8.1 bez zmian — nadal 10 NIEROZSTRZYGNIĘTYCH.
- AUDYT-WERYFIKACJA-53: każde z 53 znalezisk ma status i dowód pinowy (§9.2). 6 NIEROZSTRZYGNIONYCH (#2, #20, #31, #48, #49, #53).
- AUDYT-CIVPEDIA: każda z pozycji 1–9, 25 haseł (rozbite) i Lazaret/Karawanseraj ma status (§9.3). Otwarte: Karawanseraj w UI/`trade-routes.ts`/`cityPanel.ts` (lista miejsc usunięcia; `tech.json` zamknięty, 0 trafień) oraz 3 hasła z wariantową frazą (8b).
- AUDYT-STOLICE: wszystkie twierdzenia wypisane (§9.4); 5 NIEROZSTRZYGNIĘTYCH (luzowanie 3 hex, menu 4/5/7, testy, chip, decyzja ABC). Jedna pozycja ma status NAPRAWIONY z powodu zmienionego faktu (14→15).
- AUDYT-OPISY: **kryterium NIESPEŁNIONE** — przeliczono 31 wierszy tabeli §9.5 (licznik „34” z r3 był błędny); reszta z 79 wierszy audytu NIEROZSTRZYGNIĘTA z braku przeliczenia.
- AUDYT-PARYTET-AI (§8.2): NIE objęty §9 w r4 (6 NIEROZSTRZYGNIONYCH z §8.2 pozostaje).
- Kryterium binarne: NIESPEŁNIONE dla OPISY, WERYFIKACJA-53 (6 NIEROZSTRZYGNIONYCH), STOLICE (5), CIVPEDIA (otwarte pozycje wyżej), AUDYT-KODU (10) i PARYTET (6). Wymagane osobne tematy z pozycjami, nie kolejna runda tego samego zakresu.
- Nie uruchomiono testów, `cargo` ani gry. `gra/**` nietknięte. Zapis: tylko ten plik. Brak commita w tej rundzie.

---

## 10. Runda 5/5 — R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`) — LIMIT-5-EXCEEDED

**Wejście:** zarzut Final Control z rundy 4: kryterium binarne nadal niespełnione (OPISY 31/79, WERYFIKACJA-53 6 NIEROZSTRZYGNIĘTYCH, STOLICE 5, CIVPEDIA otwarte pozycje, AUDYT-KODU 10, PARYTET 6). Ostatnia runda musi albo domknąć pozycje, albo zakończyć się LIMIT-5-EXCEEDED z podziałem na osobne tematy.

**Decyzja tej rundy:** domknięcie kryterium w jednej rundzie nie jest wykonalne. Pozostaje ok. 90 pozycji nierozstrzygniętych w sześciu plikach, a każda wymaga osobnego odczytu kodu i treści na pinie `edb8fb56`. Próba „domknięcia” przez deklarację bez dowodu byłaby dokładnie tym błędem, który wytknęła runda 4. Dlatego ta runda nie dopisuje nowych statusów i nie zmienia statusów z rund 1–4. Wynik: **LIMIT-5-EXCEEDED**.

### 10.1 Stan kryterium na koniec rundy 5 (korekta r5 po obronie: wiersze AUDYT-KODU, PARYTET-AI i OPISY poprawione, zob. §10.4)

| Plik | Pozycje NIEROZSTRZYGNIĘTE | Gdzie są opisane |
|---|---:|---|
| `AUDYT-KODU-2026-07-21.md` | 10 (#2, #4, #20, #31, #48, #49, #53, #59, #60, #62 — wg §8.1/§9.1; poprzednia lista r5 była błędna, zob. §10.4 pkt 1) | §8.1 |
| `AUDYT-WERYFIKACJA-53-WERDYKTY.md` | 6 (#2, #20, #31, #48, #49, #53) | §9.2, §9.6 |
| `AUDYT-PARYTET-AI-2026-07-24.md` | 8 (§8.2: #1–#6, #8 oraz L2; #7 i #9 mają status NADAL ISTNIEJE, zob. §10.4 pkt 3–4) | §8.2, §10.4 |
| `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` | 5 (luzowanie 3 hex, menu 4/5/7, test 36 PASS, chip „· miasto-państwo”, decyzja ABC) | §9.4 |
| `AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` | 3 hasła z wariantową frazą (8b) + lista miejsc usunięcia Karawanseraju (UI, `trade-routes.ts`, `cityPanel.ts`) | §9.3 |
| `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` | Mianownik: 69 wierszy danych (5 tabel). Liczby „79” i „48” wycofane (zob. §10.4 pkt 5). §9.5 pokrywa 31 wierszy tabeli (zgrupowane); reszta nieprzeliczona | §9.5, §10.4 |

Liczba „ok. 90” z pierwotnej wersji tej sekcji była błędna. Suma wierszy tabeli wynosi 78, a nie 90 (zob. §10.4 pkt 2). Suma nie jest mianownikiem kryterium, bo mianownik pozycji OPISY nie jest ustalony, a 6 pozycji WERYFIKACJA-53 powtarza AUDYT-KODU.

### 10.2 Podział na osobne tematy (propozycja do decyzji orkiestratora)

Każdy temat dostaje własny dispatch, własną allowlistę (tylko dopisanie sekcji do pliku wynikowego lub osobnego pliku w `runs/<ID>/`), własny licznik rund 1/5 i kryterium binarne na swoim zakresie:

1. **P1.16c-KODU-A** — `AUDYT-KODU` #2, #4, #20, #31, #48, #49, #53, #59, #60, #62 (10 pozycji NIEROZSTRZYGNIĘTYCH wg §8.1/§9.1; #2, #20, #31, #48, #49, #53 są też w WERYFIKACJA-53 i rozstrzygnięcie trzeba wpisać w obu miejscach; pierwszy krok: `applyAutoLosses` przy `main.ts:30068` i `:30229`).
2. **P1.16c-WERYFIKACJA-53** — #2, #20, #31, #48, #49, #53 z `AUDYT-WERYFIKACJA-53-WERDYKTY.md`. Część pokrywa się z tematem 1 (#2, #31); rozstrzygnięcie jednego musi być wpisane w obu miejscach.
3. **P1.16c-PARYTET-AI** — §8.2: 8 pozycji NIEROZSTRZYGNIĘTYCH (#1–#6, #8, L2) oraz #7 i #9 ze statusem NADAL ISTNIEJE (§10.4 pkt 4); w tym `aliveUnitTypeNames` (`ai.ts:95–101`) i zakup jednostki za złoto dla AI.
4. **P1.16c-STOLICE** — 5 pozycji z §9.4. Decyzja ABC „MAP-UX-CLUSTER-LABEL” wymaga odpowiedzi właściciela przed Operatorem (pytanie ABC, nie runda Operatora).
5. **P1.16c-CIVPEDIA-KARAWANSERAJ** — 3 hasła z frazą wariantową (§9.3, 8b) oraz pełna lista miejsc usunięcia Karawanseraju. Najpierw `PYTANIA-OTWARTE` w sprawie „+1 ¤ na poz. 2” (PYTANIE 19).
6. **P1.16c-OPISY** — nieprzeliczone wiersze `AUDYT-OPISY-*` (mianownik: 69 wierszy danych, nie 79; §10.4 pkt 5). Duży zakres: podzielić na podtematy wg rozdziałów/kategorii (§2a–§2e, §3, rozdziały Poradnika, panele UI). Każdy podtemat osobnym dispatchem.

Tematy 1–3 nie dotykają tych samych plików co temat `R-RUSTPORT-P1-16B` (`P1-16-EDGE-CASES.md` jest wspólnym plikiem wynikowym): przed ich dispatchem trzeba sekwencjonować zapisy do tego pliku.

### 10.3 Zastrzeżenia rundy 5

- Nie uruchomiono `cargo`, `npm`, gry ani testów (zakaz w temacie).
- `gra/**` nietknięte. Zapis: sekcje rund 4–5 dopisane na końcu `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`. Zmiana in place w rundzie 4 (§8.3, wiersz AUDYT-KODU) jest opisana w §10.4 pkt 6. Poza tą linią, według `git diff` względem HEAD (211 insertions, 1 deletion), nie usunięto żadnej treści z §1–§9.
- Plik ma niezacommitowane zmiany z rund 1–4 (`git status`: ` M`). Commit i integracja należą do orkiestratora.
- Brak commita, brak push, brak deployu.

### 10.4 Obrona rundy 5 — odpowiedzi na zarzuty Evaluatora (pin `edb8fb56`)

**Dowody:** wyłącznie `git show edb8fb56:…`, `git grep edb8fb56`, `git diff` względem HEAD, `awk`/`grep` na pliku wynikowym, wykonane w tej rundzie.

| Zarzut | Decyzja | Dowód / zmiana |
|---|---|---|
| 1 (lista NIEROZSTRZYGNIĘTYCH AUDYT-KODU w §10.1 i §10.2 pkt 1) | PRZYJMUJE | Lista r5 (#23, #24, #25, #28, #29, #33) była błędna. Wg §8.1 #23, #24, #25, #28, #33 mają NAPRAWIONY, a #29 NADAL ISTNIEJE. Poprawna lista (zgodna z §8.1 i §9.1): #2, #4, #20, #31, #48, #49, #53, #59, #60, #62. Zdanie „bez zmian względem r4” było nieprawdziwe; §10.1 i §10.2 poprawione. |
| 2 (arytmetyka „ok. 90”) | PRZYJMUJE | Suma wierszy §10.1: 10 + 6 + 6 + 5 + 3 + 48 = **78**, nie ok. 90. Dodatkowo 6 pozycji WERYFIKACJA-53 powtarza AUDYT-KODU, więc unikalnie jest o 6 mniej. Liczba 48 jest wycofana (pkt 5), więc suma nie ma wartości mianownika. |
| 3 (licznik PARYTET-AI: 6) | PRZYJMUJE | §8.2 ma NIEROZSTRZYGNIĘTY dla #1, #2, #3, #4, #5, #6, #8 (7 pozycji) oraz L2 (razem **8**). #7 = NADAL ISTNIEJE. Wartość „6” z §9.6 i §10.1 była błędna; §10.1 poprawione na 8. |
| 4 (brak pokrycia #9 PARYTET) | PRZYJMUJE w części, ODRZUCAM „brak statusu” | Pozycja #9 w `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` (linia 24 pinu): „❌ (potwierdzone, jak zgłoszono)”, „Produkcja jednostek NIE konsumuje surowca z puli”. Status NADAL ISTNIEJE był już w §6.2 (runda 1). Ponowny dowód r5: `git show edb8fb56:gra/data/units.json \| grep -c koszt_surowce` = **0**. `git grep 'buildingStockCost('` na pinie: wywołania w wielu plikach, nie zweryfikowano typu argumentu każdego z nich, więc twierdzenie audytu „tylko dla budynków” nie jest potwierdzone w r5. Przyjęte: §8.2 i §9 nie mają wiersza #9 (brak pokrycia); ten pkt uzupełnia pokrycie: **#9 = NADAL ISTNIEJE** (dowód: `koszt_surowce` = 0 w danych jednostek). Wiersz #9 nie został dopisany do §8.2 (treść r3 nietknięta), a jego status jest tutaj. |
| 5 (mianownik OPISY „79”) | PRZYJMUJE | Liczba 79 nie pochodzi z `00-dispatch.md` (grep `79`: 0 trafień). Plik źródłowy: 74 linie zaczynające się od „| ” = 5 nagłówków tabel (l. 35, 94, 109, 138, 167) + **69 wierszy danych** (bloki l. 37–50, 96–105, 111–127, 140–161, 169–174). Liczba 48 (= 79 − 31) jest wycofana. §9.5 ma 31 wierszy tabeli, zgrupowanych, bez mapowania 1:1 na linie źródła, więc liczba nieprzeliczonych wierszy NIE jest ustalona. Kryterium dla OPISY: **NIESPEŁNIONE** (bez zmiany wniosku). |
| 6 (zmiana in place w §8.3, l. 356) | PRZYJMUJE | `git diff` względem HEAD ma 1 usuniętą linię. To HEAD wiersz `\| dyspozycje/AUDYT-KODU-2026-07-21.md \| NAPRAWIONY 57 · NADAL 7 · NIEROZSTRZYGNIĘTY 9 \| §8.1 \|`, zastąpiony w r4 wartością 56/7/10 zgodną z §8.1 i §9.1. To była zmiana in place, nie dopisanie. Etykieta nagłówka „Wynik r3” została bez zmiany i dla tego wiersza jest myląca. Wiersz NIE jest cofany, bo HEAD-owa wartość 57/7/9 jest sprzeczna z §8.1. Jawny opis tej korekty: **wartość r3 = 57/7/9 (HEAD), wartość po korekcie r4 = 56/7/10**. Wcześniejsze zapisy „Istniejące sekcje 1–9 nie zmienione” były nieścisłe i zostały poprawione w §10.3. |
| 7a (ścieżka `mapFieldBattle.ts:215–224`) | PRZYJMUJE | `gra/src/game/mapFieldBattle.ts` NIE istnieje na pinie (`git cat-file`: brak). Poprawna ścieżka: **`gra/src/battle/mapFieldBattle.ts`**. Linie 215–224 to `veteranScaledDef` (skalowanie weterana, wywołanie `unitDefFor(u)` w `:218`), a nie kolejność rejestracji. Dla #53 właściwe miejsca: `unitDefFor` w `:158`, `:218`, `:275`; `registerMilitiaDef` — typ `:139`, warunkowe wywołanie `:328–330`. Status #53 bez zmian: NIEROZSTRZYGNIĘTY. |
| 7b (`short<80` vs `short&lt;80`) | PRZYJMUJE | W `gra/src/map/clusters.ts` komentarz w l. 1483 (i 1391) zawiera dosłownie `short&lt;80`. Treść ta sama, zapis cytatu w §9.4 był uproszczony. |
| 7c (etykieta „NAPRAWIONY” dla sep stolic 14→15) | PRZYJMUJE | Zmiana wartości nie jest naprawą błędu. Etykieta zmieniona w tej sekcji na **NIEAKTUALNE (zmiana wartości 14→15)**. Nie liczyć jako NAPRAWIONY. W §9.4 pozostaje błędny zapis do czasu tego rozstrzygnięcia, a obowiązuje ten wiersz. Status STOLICE: 5 NIEROZSTRZYGNIONYCH bez zmian. |
| 8 (pozytyw: weryfikacja anty-halucynacyjna) | przyjęte do wiadomości | Bez zmian. |

**Wynik obrony r5:** zarzuty 1, 2, 3, 5, 6, 7a, 7b, 7c PRZYJĘTE i poprawione; zarzut 4 PRZYJĘTY w części (pokrycie #9) i ODRZUCONY w części (brak statusu). **Kryterium binarne: NIESPEŁNIONE.** Runda 5/5, `LIMIT-5-EXCEEDED` utrzymany. Podział na tematy z §10.2 pozostaje, po poprawkach z §10.1 i §10.2.

**DEPLOY/PUSH: NIE WYKONANO.** Brak commita.

---

## 11. Runda 1/5 — R-RUSTPORT-P1-16C-KODU-A-Q1 (Operator, obrona 1, pin `edb8fb56`)

**Dowody:** wyłącznie `git show edb8fb56:…` / `git grep edb8fb56` (linie z tych poleceń). §1–§10 nietknięte. Ta wersja §11 zastępuje wersję sprzed obrony.

### 11.1 Status per pozycja (`*` = część nierozstrzygnięta; [=KODU] = też WERYFIKACJA-53)

| # | Status | Dowód (plik:linia, pin) | Brakuje |
|---|---|---|---|
| #2 [=KODU] | NAPRAWIONY | `main.ts:30068–30070`, `:30229` (`survivors` = undefined); `main.ts:28343–28344`; `git grep 'survivors: \[\]'` = 0 | — |
| #4 | NIEROZSTRZYGNIONY | Racja 0% = koszt 0: `WYZYWIENIE_MIN=0` (`population-growth-v85.ts:27`), `computeCityRationCost` (`:205–213`), `bilansLokalny = brutto − koszt` (`turn-economy.ts:1656`), deficyt z bilansu (`empire-food.ts:233–234`, `:252`). Przeciwwaga: `WYZYWIENIE_GROWTH_PCT[0] = -10` (`population-growth-v85.ts:53–54`, użycie `:255`). | Czy −10%/turę to dostateczna kara: decyzja balansowa, nie rozstrzygnięta w kodzie. |
| #20 [=KODU] | NAPRAWIONY | `diplomacy-acceptance-points.ts:303–304` (`relClamped = min(100,…)`), `diplomacy-value-catalog.ts:617–620`, `diplomacy-pn-engine.ts:197`. | Guard ¤↔¤ nieczytany; przy kursie ≤1:1 brak zysku (nie oceniane jako błąd). |
| #31 [=KODU] | NIEROZSTRZYGNIONY\* | Budynki: kandydaci `'mury'` `ai.ts:1746`, `:1786` → komendy `ai.ts:3238`, `:4077` (`buildingId`); id `mury` w `buildings.json`. `ai.ts:717–724` = scoring badań, nie emisja. | `buildAllowed` dla `targowisko` (`ai.ts:724` tylko scoring); ścieżka jednostek (`main.ts:35120–35123`) nieczytana. |
| #48 [=KODU] | NIEROZSTRZYGNIONY\* | Dominacja: `eliminateOwner` `main.ts:28902–28912`; `disbandOwnerUnits` `capital-capture.ts:258–260`. | Ranking HUD: `allPowerOwnerIds` `main.ts:15888–15893`, `filterOwnersForPowerRanking` `power-ranking.ts:22` nieczytane. |
| #49 [=KODU] | NAPRAWIONY | Dowód negatywny z r1 był błędny: `buildingLevelForEpoch(` ma 4 wywołania w `main.ts`: `:7166` (`era = empireEpochForOwner(ownerId)`), `:15269` i `:15347` (`epoch = ctx.epoch`, ustawiane `empireEpochForOwner(city.ownerId)` w `:15231`), `:32369` (`:32371`). Ocena porządku: `main.ts:32401`, `:32412`. | Pętla `:32223–32410` nieczytana linia po linii. |
| #53 [=KODU] | NIEROZSTRZYGNIONY\* | Rejestracja przed prognozą: `battle/mapFieldBattle.ts:326–331` przed `:339`. Klucz `'militia-'+city.id` (`game/siegeDefenders.ts:131`): jeden na miasto, nadpisywany przy każdej rejestracji (`mapFieldBattle.ts:326–331`, `main.ts:28531`). | Podpunkt „wpis nigdy nie usuwany" (`main.ts:37161` tylko nowa gra): wpływ na wynik niewykazany; odczyty `unitDefFor` (`main.ts:27020`) nie zostały w pełni sprawdzone. |
| #59 | NIEROZSTRZYGNIONY | Realny tick: `turn-economy.ts:2664` (`cityYieldPerTurn`), `:2667` (kara `applyOrderYieldMults`), `:2717–2721` (`pieniadzZPracy` przeliczony po karze). Lokalizacja audytu `economy.ts:921`: `pieniadzZPracy` z praca przed karą (`:1005–1006`). | Punkt (b) floor/round nieadresowany; czy Mennica/korupcja (krok 7, `economy.ts`) obejmują poprawioną wartość: nieczytane (`turn-economy.ts:2719–2721` ich nie powtarza). |
| #60 | NAPRAWIONY | `checkVillageRewardAt` (`main.ts:25797`; nagroda `kind === 'tech'` w `:25859`) → `researchStep` `:25873` → `reconcilePlayerEraFromResearch` → `setEra` `:25876–25886`. | — |
| #62 | NADAL ISTNIEJE | Pangea: `generator.ts:283–292` → `removeInlandSeaPools` (`gen-helpers.ts:4320–4326`) = `removeInlandWaterPools` (`:4137–4150`), bez progu; `maxInlandPoolSize` dopiero `:4800–4801`. | Kontynenty (`removeSmallInlandWaterPools(…,8)`) nieprzeliczone; nie zmienia werdyktu pangea. |

### 11.2 Liczniki

- AUDYT-KODU (10): **NAPRAWIONY 4** (#2, #20, #49, #60) · **NADAL ISTNIEJE 1** (#62) · **NIEROZSTRZYGNIONY 5** (#4, #31\*, #48\*, #53\*, #59).
- WERYFIKACJA-53 [=KODU] (6): **NAPRAWIONY 3** (#2, #20, #49) · **NIEROZSTRZYGNIONY 3** (#31\*, #48\*, #53\*).
- Każda pozycja ma status z dowodem (kryterium „zero bez statusu”: spełnione). Temat **nie jest domknięty**: 6 z 10 pozycji AUDYT-KODU ma status bez pełnego dowodu lub z częścią nierozstrzygniętą.

### 11.3 Ograniczenia

- Bez cargo/npm/gry/testów. Zapis: ten plik (§11) i `runs/R-RUSTPORT-P1-16C-KODU-A-Q1/`. Brak commita; `gra/**` nietknięte.
- Linie audytu nieaktualne; statusy po symbolach i liniach pinu.

---

## 12. Runda 1/5 — R-RUSTPORT-P1-16C-PARYTET-AI-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`; obrona 1 po zarzutach Evaluatora — §12.5)

**Dowody:** wyłącznie `git show edb8fb56:…` i `git grep edb8fb56` (numery linii z tych poleceń). §1–§11 nietknięte. Pozycje audytu `AUDYT-PARYTET-AI-2026-07-24.md` (✅ / ❌) oceniono przez to, czy na pinie istnieje asymetria gracz↔AI.
**Legenda (dla tego tematu):** NAPRAWIONY = asymetria/luka nie występuje na pinie (dla pozycji ✅ oznacza potwierdzony parytet); NADAL ISTNIEJE = asymetria/luka występuje; NIEROZSTRZYGNIONY = nieprzeczytane.
**Uwaga o liniach audytu:** większość odwołań `plik:linia` z audytu jest nieaktualna na pinie (np. `turn-economy.ts:149–160` → `:196`; `main.ts:14269–14283` nie istnieje w tej formie; `main.ts:14863–14893` = kod oblężenia). Statusy poniżej po symbolach i liniach pinu.

### 12.1 Status per pozycja PARYTET-AI

| # | Status | Dowód (plik:linia, pin) | Zmiana względem audytu / uwagi |
|---|---|---|---|
| 1 | NAPRAWIONY | `game/building-stock-cost.ts` `ownerResourceStockAll`, `deductBuildingStockCostAcrossCities` (bez gałęzi po `ownerId`); `game/economy-upkeep.ts:448–455` `ownerResourceCapacityPerType` = `(bazaSurowcePanstwo + bonusSurowceNaBudynek·N_Magazyn) × magazynEraMultiplier(era)`; `game/turn-economy.ts:2454–2463` `ownerResourceCapFor` (ten sam cap dla każdego ownera); `main.ts` wiring `empireEpochForOwner` przy `advanceCityEconomy` (`:31359`) | Literalne „100+100” nie zweryfikowane (wartości w parametrach, nieczytane); formuła jest owner-agnostic |
| 2 | NAPRAWIONY | Gracz: `ui/cityPanel.ts:6275–6276` (`canAffordBuildingStock` + `deductBuildingStockCostAcrossCities(…, city.ownerId, cost)`). AI auto-enqueue: `main.ts:8244–8247` `deductOwnerStockCost` → ta sama deducja; `main.ts:8250` `tryAutoEnqueueBuild`. AI cmd `build`: `main.ts:35160–35220` (`canAfford` z `ownerSurowcePoolFor(ownerId)` + `deductOwnerStockCost(ownerId, cost)`) | Audytowe linie `cityPanel.ts:4291–4308` / `main.ts:4183–4227` / `14822–14841` nieaktualne; parytet potwierdzony na aktualnych liniach |
| 3 | NAPRAWIONY | `game/turn-economy.ts:965–990` `computePracaUpkeepByOwner` (Map dla WSZYSTKICH ownerów, ta sama funkcja); wywołanie `turn-economy.ts:2365`; pobór `main.ts:32868–32887`: gracz `econ.pracaUpkeepByOwner.get(0)` → `playerPracaPool = Math.max(0, …)`; AI pętla `for (const [oid, up] of econ.pracaUpkeepByOwner)` → `aiPracaPoolByOwner.set(oid, Math.max(0, cur − up))` | Audytowe `main.ts:14269–14283` nieaktualne; symetria potwierdzona na `:32868–32887` |
| 4 | NAPRAWIONY | (a) Silnik/cykl: `main.ts:20235` `tickCyclicResourceTradeDeals` (bez gałęzi po ownerze; `sellerOkOf` symetryczne względem `sellerOwnerId`/`buyerOwnerId`). (b) AI↔AI: `main.ts:19743` `formAiAiTradeAgreementsIfEligible`; wybór oferty `main.ts:19775–19800` przez `pickResourceDeficitForOwnerPair` / `pickResourceSurplusForOwnerPair` (ten sam silnik co gracz↔AI). Gałąź `eitherIsCityState` (`main.ts:19755`, `:19835` `if (eitherIsCityState && !bestOffer) continue;`) zawęża TYLKO tworzenie umów AI↔AI z miastem-państwem; nie tworzy asymetrii gracz↔AI. (c) AI→gracz: generowanie `game/ai.ts:5454–5520` w `decideAIDiplomacy` (`:5270`) — blok `resOffer` z `resourceTradeOffer` (`:5457`), komenda `zaproponuj_handel_surowiec` `:5514`, bramka `canAiProposeResourceTrade` `:5503`; oferta liczona w `main.ts:33945–33962` przez `pickResourceTradeRelOffer(ownerId, ME(), …)` (`main.ts:19506`, ta sama para pick-funkcji co AI↔AI); kolejka do stołu negocjacyjnego `main.ts:16820–16870` (`enqueueNegotiationFromAiCmd`) z clampem `clampAiResourceTradeCommand` (`game/diplomacy-ai-balance.ts:203`, kontekst `main.ts:9985–10000` — pula gracza `ownerSurowcePoolFor(0)`, ten sam kod co dla AI). Tekst propozycji dla gracza: `game/diplomacy-proposals.ts:1811–1815`. | Audyt `game/ai.ts:2449–2477` NIEPRAWDZIWY jako lokalizacja (to `boostCandidatesForResourceDeficits` / `collectMilitaryRecruitStockDeficits`, wsparcie deficytów budowy). Właściwa ścieżka AI→gracz przeczytana w obronie 1 (zarzut Evaluatora nr 1). |
| 5 | NAPRAWIONY | `game/turn-economy.ts:196` `applyWonderCityYields`; wywołania `turn-economy.ts:2096` i `:2674` z `wonderCityYieldsByOwner.get(city.ownerId)`; mapa `main.ts:31367` `buildWonderCityYieldsByOwnerMap(cities.map(c => c.ownerId))` | Audytowe `turn-economy.ts:149–160` nieaktualne (funkcja na `:196`) |
| 6 | NAPRAWIONY | `game/turn-economy.ts:1497–1512` liczniki `stolarniaCountByOwner` / `kamieniarskiCountByOwner` (pętla po wszystkich miastach, klucz `city.ownerId`); użycie per owner `:1534–1543` i `:1737–1761` | Audytowe `:1313–1325` / `:1629–1630` nieaktualne |
| 7 | NAPRAWIONY (fakt zmieniony) | AI MA ścieżkę zakupu za złoto: `main.ts:35208–35221` — `shouldAIPurchaseUnit({treasury, goldCost, hasManpower})` → `purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)`; `main.ts:3972–3978` `purchaseRecruitmentUnit(…, ownerId = 0)` sprawdza `city.ownerId !== ownerId` (NIE `!== 0`). Komenda: `AICommand` (`game/ai.ts:156–162`) nie ma osobnego typu zakupu — zakup idzie przez `build` (jak w audycie: `AICmdPurchase*` = 0 trafień, ale to nie dowodzi braku ścieżki) | Audyt („na stałe `ownerId !== 0`”, „AI nie ma odpowiednika”) NIEPRAWDZIWY na pinie |
| 8 | NAPRAWIONY | `main.ts:7919–7936` `aiDiffLevelForOwner` (miasta-państwa z `_menuCityStateDifficulty`, reszta z `_menuDifficulty`); `main.ts:7931–7935` `difficultyCombatMultForOwner` → `qualifiesForMajorAiDifficultyBonus` (`game/ai-difficulty-bonus.ts:18–23`: `ownerId > 0 && !isBarbarian && !isCityState`) → dla miast-państw mnożnik = 1; `game/combat.ts:410` (deklaracja pola opcjonalnego, JSDoc) i konsumpcja: `game/combat.ts:901` (`atkDiffMult = opts.attackerDifficultyCombatMult ?? 1`), `battle/battleScene.ts:8224, 8228`; wiring `main.ts:27207–27209` (`difficultyBattleOpts`). | Audytowe twierdzenie „`bonusWalka` jest martwe” NIEPRAWDZIWE (konsumowane w `combat.ts:901`, `battleScene.ts:8224/8228` i `main.ts:7935`). Cytat „`combat.ts:407–413` jako konsument” był błędny — to deklaracja pola (zarzut Evaluatora nr 4, PRZYJĘTY). Wniosek audytu (brak przecieku trudności do walki PM) potwierdzony, ale z innego powodu |
| 9 | NAPRAWIONY (fakt zmieniony) | Jednostki MAJĄ koszt surowcowy: `gra/data/units.json` pola `Surowiec` / `Surowiec (ilość)` (nie `koszt_surowce`; audytowy grep był błędnym kluczem). Zmapowanie: `game/building-stock-cost.ts:402–420` `unitStockCost` (+5 Koni dla `Typ: Mount`). Konsumpcja Z PULI PAŃSTWA: `main.ts:3996–4026` (komentarz `JEDNOSTKI-SUROWIEC-01`, `unitStockCost`, `ownerResourceStockAll`, `pickUnitRecruitHint`), `main.ts:4075` `deductBuildingStockCostAcrossCities(cities, ownerId, batchStockCost)`; wielosztuka `main.ts:4140–4174` (`canAffordBuildingStock` + deduct `:4174`); zwrot `main.ts:4199–4206` (`creditOwnerResourceStock`); AI przez tę samą `purchaseRecruitmentUnit` (`main.ts:35220`); utrzymanie jednostek na turę `game/economy-upkeep.ts:784–917` (`unitResourceUpkeep`, `totalUnitResourceUpkeep`) i `turn-economy.ts:2940` | Audyt (r5 Operatora, `buildingStockCost` tylko dla budynków) nie uwzględnił `unitStockCost`. Decyzja A jest wdrożona; asymetrii gracz/AI nie ma |

### 12.2 Liczniki

- PARYTET-AI (9 pozycji: #1–#9): **NAPRAWIONY 9** (w tym #7 i #9 ze zmianą faktu) · NADAL ISTNIEJE 0 · NIEROZSTRZYGNIONY 0.
- L2 (wyrąb lasu AI): **NADAL ISTNIEJE** (§12.3).
- Kryterium binarne (zero pozycji bez statusu z dowodem; #9 z przeczytania funkcji konsumującej): **SPEŁNIONE** — po obronie 1 (#4 domknięte przeczytaniem `ai.ts:5454–5520`, `main.ts:33945–33962`, `main.ts:16820–16870`, `main.ts:19775–19835`). Nieprzeczytane pozostają wyłącznie literalne wartości capu w #1 — nie wpływają na status (formuła owner-agnostic, obie strony wołają tę samą funkcję).

### 12.3 L2 — wyrąb lasu AI (NADAL ISTNIEJE, linie poprawione)

- Audytowe `main.ts:14863–14893` = kod oblężenia (`u.oblegaCityId`, `endMapSiege`), nie wyrąb.
- Wyrąb AI cywilizacji: `main.ts:35268–35300` — komentarz „AI nie ma per-owner wieloturowego `hexClearingStates`”; gałąź `if (meta?.typ === 'wycinka')` usuwa las od razu (`if (hexForImprovement.nakladka !== Nakladka.Las) continue`), odejmuje koszt z `aiPracaPoolByOwner` i kredytuje drewno (`applyStolarniaDrewnoMapInflow`, `pracaTotal`).
- Gracz/automat gracza: wieloturowo przez `freshClearingState` + `hexClearingStates` (`main.ts:33059–33076`).
- Konsekwencja: mechanika czasowa różni się (AI natychmiast), netto koszt Pracy/drewna jest zbilansowany komentarzem `P-AI-WYRAB-REFUNDACJA-PRACA-ZAMIAST-DREWNA = A`. Odstępstwo od „zero uproszczeń dla AI” nadal istnieje.

### 12.4 Ograniczenia tej rundy

- Nie uruchomiono `cargo`, `npm`, gry ani testów (zakaz w temacie). `gra/**` nietknięte; odczyt wyłącznie z pinu.
- Nieprzeczytane (zgłoszone wprost): wyłącznie literalne wartości capu (#1) — nie zmieniają statusu. Dwa poprzednio nieprzeczytane elementy #4 (`eitherIsCityState`, AI→gracz) zostały przeczytane w obronie 1 (§12.5).
- HEAD repo roboczego w chwili weryfikacji: `f439879c`; wyniki dotyczą pinu `edb8fb56`.
- Brak commita, brak push, brak deployu. Plik ma niezacommitowane zmiany z rund 1–5 i KODU-A (`git status`: ` M`) — integracja należy do orkiestratora.

### 12.5 Obrona 1 (po zarzutach Evaluatora, ta sama runda 1/5)

- Zarzut 1 (#4 zawężony zakres, zła lokalizacja AI→gracz): **PRZYJMUJE** — przeczytano ścieżkę AI→gracz: `game/ai.ts:5454–5520` (`decideAIDiplomacy`), `main.ts:33945–33962`, `main.ts:16820–16870`, `main.ts:9985–10000`, `game/diplomacy-ai-balance.ts:203`. `ai.ts:2449–2477` to `boostCandidatesForResourceDeficits` (potwierdzone). #4 → NAPRAWIONY, zakres pełny.
- Zarzut 2 (kryterium „SPEŁNIONE z zastrzeżeniem”): **PRZYJMUJE** — zastrzeżenie usunięte, bo #4 jest domknięte dowodem; kryterium SPEŁNIONE bez zastrzeżeń.
- Zarzut 3 (BLOKADY „brak”): **PRZYJMUJE** — BLOKADY w `01-operator.md` (obrona) jako lista z rozstrzygnięciem: (a) `ai.ts:2449–2477` — rozstrzygnięte (zarzut 1); (b) `main.ts:19757` `eitherIsCityState` — rozstrzygnięte (zawęża tylko tworzenie umów AI↔AI z miastem-państwem, `main.ts:19835`); (c) literalne wartości capu #1 — NIEROZSTRZYGNIĘTE, bez wpływu na status (formuła owner-agnostic).
- Zarzut 4 (cytat #8 `combat.ts:407–413`): **PRZYJMUJE** — `combat.ts:407–413` to deklaracja pola (`combat.ts:410`). Konsumpcje: `combat.ts:901`, `battle/battleScene.ts:8224, 8228`, `main.ts:7935`; wiring `main.ts:27207–27209`. Status #8 bez zmian (NAPRAWIONY).

Nowe liczniki po obronie: PARYTET-AI NAPRAWIONY 9 / NADAL ISTNIEJE 0 / NIEROZSTRZYGNIONY 0. L2 bez zmian: NADAL ISTNIEJE.

**DEPLOY/PUSH: NIE WYKONANO.**

---

## 13. Runda 1/5 — R-RUSTPORT-P1-16C-STOLICE-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`; wersja po obronie, tura 2 tej samej rundy)

**Dowody:** wyłącznie `git show edb8fb56:…` i `git grep edb8fb56` (numery linii z tych poleceń). Test NIE uruchomiony (odczyt przez git; brak checkoutu, build, dev). §1–§12 nietknięte. Źródło twierdzeń: `dyspozycje/AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` (tabela „Stan", „Pakowanie MP", „Testy", „Chip").
**Decyzja ABC:** `MAP-UX-CLUSTER-LABEL-Q1` = ZASTĄPIONE (paczka `ABC-PACZKA-2026-08-06-KOLEJKA` [3/5], FALA 296 `a37f7123`, `dyspozycje/PYTANIA-OTWARTE.md:318`). Brak nowych pytań ABC.

### 13.1 Status per pozycja (5 z §9.4 AUDYT-STOLICE)

| # | Pozycja | Status | Dowód (pin `edb8fb56`) | Korekta względem audytu |
|---|---|---|---|---|
| 1 | Luzowanie MP w pakowaniu do 3 hex (audyt: „nadal nie 2”) | NADAL ISTNIEJE (zakres: TYLKO ścieżka repack; hub-chain bez luzowania) | Luzowanie: `gra/src/map/clusters.ts:2894` `looseMin = Math.max(3, minDist − 2)` w `repackClusterStateCitiesIfSparse` (`:2843`, wołane `:2979`, uruchamiane gdy `mpNow < stateCityCount` `:2860`, a `validMp` puste `:2891`). Dla `ki === 0`: `minDist = minDystMiastaPanstwa = opts?.minDystans ?? MIN_DIST_START_CITY_STATE` (`:3399`; `MIN_DIST_START_CITY_STATE = 5`, `:49`, `CLUSTER_CITY_STATE_MIN_HEX = 5`, `:42`). Floor = 3 tylko gdy minDist ≤ 5; przy większym minDist floor = minDist − 2. Ścieżka hub-chain (`packCityStatesAroundCapital` `:2036` → `packCityStatesHubChain` `:1911`): `minDistLevels = [minDist]` (`:2084`), `validCandidate` na `minSep` (`:1941–1944`), `packNearestLegalLand` na `minSep = minDist` (`:1975`, `:2000–2001`, wołanie `:2122`). Brak luzowania. Ostatnia deska do 2: `:2919–2932` (`packCityStatesAroundCapital(…, 2, …)`, `ringDistances: [3, 2]`), tylko gdy retry (`:2894–2913`) daje 0 ważnych MP (`:2920`) | Audyt „nadal nie 2” jest NIEPRAWDZIWY na pinie: deska do 2 istnieje (repack, po retry). Luzowanie do 3 jest warunkowe (ścieżka i minDist), nie ogólne |
| 2 | Menu MP Standard: min 4 / default 5 / max 7 | (a) twierdzenie audytu 4/5/7: NIEAKTUALNE wobec faktu (korekta, poza zbiorem statusów; ujawnione jawnie) · (b) min 5 MP: NADAL ISTNIEJE | UI: `gra/src/ui/newGameFlow.ts` → `miastaPanstwaMenuForMapLabel` (`gra/src/map/newGameMapDefaults.ts:695`) → `miastaPanstwaTriple` (`:658`): NAJPIERW `eStartMiastaPanstwa` z `gra/data/e-start-params.json` „Standardowy”.`miasta_panstwa` = **6** (`:35–37`) → `clampedDef = 6`, `max = min(clampedDef + 1, MAX)` = 7, `min = max(1, clampedDef − 1)` = 5 (`:659–665`). Wiersz `MIASTA_PANSTWA_MENU_BY_TIER` (`:579`, standard {4,5,7}) to fallback (`:667`), nieosiągalny gdy istnieje wiersz JSON | (a) audytowe 4/5/7 nie zachodzi na pinie. (b) min 5 MP = min 6 etykiet w klastrze (1 stolica + 5 MP): realny problem, osobny od liczb audytu |
| 3 | Test `node tools/capital-sep-unit-test.cjs` → 36 PASS | NIEROZSTRZYGNIONY | Plik istnieje na pinie: `gra/tools/capital-sep-unit-test.cjs` (121 linii). Przegląd statyczny (bez uruchomienia): licznik PASS = `passed++` przy `console.log('PASS:', msg)` (`:49`); 29 linii zawiera `assert`. Literalne `36` w pliku: brak (`grep -n '36'` = 0 trafień). Wynik 36 nie jest zapisany w kodzie testu, zależy od uruchomienia | — Nierozstrzygnięte do czasu uruchomienia testu (poza zakresem tej rundy) |
| 4 | Chip: nazwa WIELKIMI + dopisek „· miasto-państwo” dla MP; stolica obca bez dopisku | NADAL ISTNIEJE (częściowo: dopisek i wielkie litery są; stolica obca bez dopisku jest) | Dopisek: `gra/src/game/display-names.ts:8–9` (`CITY_STATE_LABEL`, `CITY_STATE_SEPARATOR = ' · '`), `:17–22` (`formatEntityDisplayName`, dopisek tylko przy `isCityState`). Stolica obca: `:184–189` (gałąź `isCapital && !isCityState` → bez dopisku). Wielkie litery: `gra/src/render/cityMapStatChip.ts:789` `toUpperCase()` na całym napisie. Wywołanie: `gra/src/render/cities.ts:779–787` | Opis audytu zgodny z kodem |
| 5 | Zgodność z B+C (FALA 296): obca stolica = nazwa cywilizacji | NADAL ISTNIEJE (rozbieżność z wdrożonym B+C trwa; kod realizuje inną wersję, zob. 13.2) | Gałąź obcej stolicy: `gra/src/game/display-names.ts:184–189` → `foreignCapitalMapName` (`:247`) = nazwa MIASTA. Nazwa cywilizacji tylko przy placeholderze (`isTechnicalOwnerLabel`, `:210–217`). Źródło zmiany w kodzie: komentarz `:161–170` i `:234–235` („R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 (Maciej 2026-09-04)”, ECHO „Sama nazwa miasta, bez cywilizacji”); komentarz `gra/src/render/cities.ts:778` mówi nadal „nazwa cywilizacji” (nieaktualny). Wpis 2026-09-04 w `dyspozycje/PYTANIA-OTWARTE.md`: 0 trafień (`grep -c 'R-MAPA-ETYKIETA\|2026-09-04'` = 0) | Audyt pyta o zgodność z B+C. Literalnie NIEZGODNE. Zmiana ma źródło wyłącznie w komentarzach kodu, bez rejestru |

### 13.2 Wnioski dla orkiestratora (bez pytań do właściciela)

- Kryterium „zero pozycji bez statusu z dowodem”: SPEŁNIONE dla 5/5. Pozycja 2 ma dwa wiersze (a) i (b), oba z dowodem. Pozycja 3 = NIEROZSTRZYGNIONY z jawnym powodem.
- Pozycja 5: wpis `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` do `PYTANIA-OTWARTE.md` to porządek rejestru, nie nowe pytanie. Która wersja obowiązuje, rozstrzyga orkiestrator wg rejestru, nie Operator.
- Pozycje 1 i 2: liczby audytu (4/5/7, „nie 2”) są nieaktualne. Realne wartości: menu Standard 5/6/7; luzowanie do 3 tylko w repack (warunkowo); deska do 2 po retry.
- Sep stolic (`capitalMinSeparation`, `clusters.ts:1470–1474`, `duza: 15`) poza zakresem tych 5 pozycji; nie oceniano.

### 13.3 Ograniczenia

- Nie uruchomiono testu `capital-sep-unit-test.cjs`, `cargo`, `npm` ani gry. Test 36 = NIEROZSTRZYGNIONY.
- Nie potwierdzono „obu nazw z puli `nazwyKlastra` / `miasta_panstwa`” (audyt, sekcja chip): nieprzeliczone.
- `gra/**` nietknięte. Zapis: ta sekcja §13 oraz `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-STOLICE-Q1/` (01 i 02). Brak commita, push, deployu.

**DEPLOY/PUSH: NIE WYKONANO.**

---

## 14. Runda 1/5 — R-RUSTPORT-P1-16C-CIVPEDIA-KARAWANSERAJ-Q1 (Operator Haiku 5.5 medium, pin `edb8fb56`)

**Dowody:** wyłącznie `git show edb8fb56:…`, `git grep -I edb8fb56` i odczyt JSON z pinu (`python3 -I`). Numery linii z tych poleceń. §1–§13 nietknięte. Brak testów, build, dev, checkoutu. `gra/**` nietknięte.

### 14.0 Warunek wstępny: PYTANIE 19 (nieaktualny w dispatchu z r1 P1.16B)

- `dyspozycje/PYTANIA-OTWARTE.md:567` (pin): `STATUS: WDROŻONE W KODZIE (2026-07-25 decyzja A, economy-upkeep.ts)`. Pytania nie zadawano ponownie.
- Weryfikacja na pinie: `gra/src/game/economy-upkeep.ts:623` (komentarz „decyzja wlasciciela 19=A”), funkcja `buildingUpkeep` `:637–656`: dla budynku z wpisem `utrzymanie` stawka = `floor(buildingEffectAtLevel(utrzymanie, przyrostUtrzymania, lvl))`, a płaski `budynekUtrzymanieFlat` jest tylko domyślną wartością dla budynku bez wpisu (`:645–646`). Decyzja A jest na pinie wdrożona.

### 14.1 Trzy hasła z frazą wariantową (§9.3 pozycja 8b)

Źródło tekstu: `gra/src/data/wikiBundle.json`, wpisy `budynki/<id>` (pola `wikiS`/`wikiM`). Dane: `gra/data/buildings.json` (odczyt JSON). Silnik: wzór z §14.0.

| Hasło (id) | Fraza na pinie | Dane `utrzymanie` / `przyrostUtrzymania` | Wynik silnika (baza, bez mnożników) | Status |
|---|---|---|---|---|
| Koszary (`koszary`) | „utrzymanie **2** ¤/t (+1 ¤ na poz. 2)” | 2 / 1 | poz. 1 = 2, poz. 2 = 3 | NAPRAWIONY (zgodne; maks. 2 poz.) |
| Mury (`mury`) | „utrzymanie **2** ¤/t (+1 ¤ na poziom 2)” | 2 / 1 | poz. 1 = 2, poz. 2 = 3 | NAPRAWIONY (zgodne; maks. 2 poz.) |
| Targowisko (`targowisko`) | „utrzymanie **1** ¤/t (+1 ¤ na wyższych poziomach w danych)” | 1 / 1 | poz. 1 = 1, poz. 2 = 2, poz. 3 = 3 | NADAL ISTNIEJE (tylko fraza: liczby zgodne, ale „+1 na wyższych poziomach” sugeruje stałe +1; wg wzoru przyrost kumuluje się, poz. 3 = +2 względem poz. 1) |

Zastrzeżenie: fraza podaje wartości bazowe. Mnożniki FALA2 (`R_STAWKI_FALA2_MULT`, `:654`) i ery (`buildingEraCostMultiplier`, `:655`) nie są w tekście i nie zostały porównane z kwotą pobieraną w grze.

### 14.2 Karawanseraj: lista miejsc (decyzja 15B, usunięty 2026-07-25)

Polecenie: `git grep -I -i 'karawanser' edb8fb56` (potwierdzenie na szerszym `karawan`, bo część trafień to ogólne „karawany”, nie budynek).

| Miejsce (pin) | Trafienia | Status | Uwaga |
|---|---|---|---|
| `gra/src/game/trade-routes.ts:904` | 1 (komentarz) | NAPRAWIONY (kod) | `TRADE_BUILDING_IDS` = `targowisko, port, port_wielki`; zostaje wyłącznie komentarz historyczny |
| `gra/src/ui/cityPanel.ts` | 0 (`karawan*`) | NAPRAWIONY | plik ma 11986 linii; linie 7316 i 7395 z audytu nie dotyczą Karawanseraju |
| `gra/data/tech.json` | 0 (`karawanser`) | NAPRAWIONY | „Karawany kupieckie” (`:277`) to ogólny opis narracyjny, nie budynek |
| `gra/src/data/wikiBundle.json` | 0 (`karawanser`) | NAPRAWIONY | `karawany` (opisy ogólne) poza zakresem |
| `gra/src/ui/icons/brand/building-icon-map.json` | 0 | NAPRAWIONY (mapowanie) | brak wpisu `karawanseraj` |
| `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` | plik istnieje | NADAL ISTNIEJE | osierocona ikona (brak odwołania w mapie ani w `import.meta.glob` dla `brand/buildings`) |
| `gra/data/buildings.json` | 0 | NAPRAWIONY | brak wpisu budynku |
| `docs/PORADNIK-GRACZA/*` (25 plików) | 0 (`karawan*`) | NAPRAWIONY | — |
| `gra/Gra-podglad-POLE-BITWY.html:3955` | 1 | NADAL ISTNIEJE | osadzony snapshot danych z wpisem `karawanseraj` (artefakt podglądu w `gra/`) |
| `gra/tools/.zeton-max-dist/index.html`, `.zeton-mockup-dist/index.html`, `.zeton-tabliczka-dist/index.html`, `.zeton-tabliczka-kat-dist/kat.html`, `.diag-playtest-bundle.cjs` (2), `.pt-layout-bundle.cjs` (2) | 1–2 każdy | NADAL ISTNIEJE | artefakty buildu (`bld-karawanseraj.svg`, `id: "karawanseraj"`); usuwane przez rebuild, nie ręcznie |
| Poza `gra/`: `Gra-FINALNA.html` (18), `UI/Gra-podglad-KREATOR-E2.html` (1), `gra-robocza/**`, `docs/archiwum-ux/*.html` (3), `docs/decyzje/B-SUROW-BUD-2026-07-23.md`, `B2-narzedzia-stabilizacji.md`, `PACZKA-UPGRADE-2-ABC-2026-07-05.md`, `dyspozycje/*` (13 plików), `EKONOMIA/EKONOMIA-analiza-surowce-budynki.md`, `MIASTO/Panel-przeglad-danych.html`, `Makieta-drzewko-technologii.html`, `STAN-PRACY-HANDOFF-ARCHIWUM-2026-08-20.md` | 1–18 każdy | NADAL ISTNIEJE (poza zakresem `gra/**`) | artefakty i rejestry historyczne; decyzja właściciela, nie korekta tego tematu. Pliki binarne `UI/*.zip` nie przeliczone |

Niezależnie od wierszy powyżej: `gra/data/units.json`, `terrain-improvements.json`, `wonders.json`, `gra/src/render/tradeRoutesOverlay.ts:26` zawierają tylko ogólne „karawana/karawany” (nie budynek). Brak statusu usunięcia dla nich nie jest potrzebny.

### 14.3 Liczniki

- Trzy hasła 8b: **NAPRAWIONY 2** (Koszary, Mury) · **NADAL ISTNIEJE 1** (Targowisko: fraza nieprecyzyjna, liczby zgodne).
- Karawanseraj, pozycje z listy dispatchu: **NAPRAWIONY** trade-routes (kod), tech.json, wikiBundle.json, cityPanel.ts, building-icon-map.json, PORADNIK (25), buildings.json · **NADAL ISTNIEJE** osierocony SVG `bld-karawanseraj.svg`.
- Pozostałe trafienia Karawanseraju: NADAL ISTNIEJE (artefakty w `gra/` i poza nim, §14.2).
- Kryterium binarne (zero pozycji bez statusu z dowodem): **SPEŁNIONE** dla 3 haseł i wszystkich miejsc z dispatchu oraz miejsc z `git grep`.

### 14.4 Zalecenia dla orkiestratora (poza tym tematem, wymagają osobnego dispatchu)

1. Usunąć `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` (osierocony asset).
2. Zmienić frazę Targowiska w `gra/src/data/wikiBundle.json` na precyzyjną (poz. 3 = +2 względem poz. 1), bez zmiany liczb.
3. Decyzja właściciela co do artefaktów HTML z `gra/` i poza nim (§14.2).

### 14.5 Ograniczenia

- Nie przeliczono pozostałych haseł CivPedii i rozdziałów Poradnika (poza grepem `karawan`).
- Nie porównano kwot z mnożnikami FALA2 i ery (§14.1, zastrzeżenie).
- Nie uruchomiono testów, build, gry. Brak commita, push, deployu.

**DEPLOY/PUSH: NIE WYKONANO.**

### 14.6 Obrona 1 (tura 2 tej samej rundy 1/5) — odpowiedzi na zarzuty Evaluatora, pin `edb8fb56`

**Korekta §14.2 i §14.3.** Poprzednie wiersze grupowały pliki zbiorczo i pomijały trafienia w archiwach Office/zip. Poniżej pełna lista z dowodem. §14.3 („SPEŁNIONE”) jest **zastąpione** przez §14.6.7. §1–§13 nietknięte.

**Dowody:** `git grep -I -c -i karawanser edb8fb56` (44 pliki tekstowe); `git grep -n` dla pozycji z liczbą 1 i wybranych; `git ls-tree -r -z` (51 plików `.xlsx/.zip/.docx/...`); przeszukanie członków archiwów przez `python3 -I` + `zipfile` (rekurencyjnie, `.xml/.json/.html/.js/.svg/.md/.rels/.txt`). Brak testów, build, dev, checkoutu.

#### 14.6.1 Civ-UNITS (zarzut 1)

| Plik (pin) | Trafienie | Status |
|---|---|---|
| `Civ-UNITS/Galeria-jednostek-4widoki.html` | l. 3971, `{id:"karawanseraj",nazwa:"Karawanseraj",…}` | NADAL ISTNIEJE (osadzone dane w artefakcie UI) |
| `Civ-UNITS/_backup/Galeria-jednostek-4widoki-20260625-173831.html` | l. 3971, ta sama forma | NADAL ISTNIEJE (backup) |
| `Civ-UNITS/_backup/Galeria-jednostek-4widoki-20260625-182823.html` | l. 3971, ta sama forma | NADAL ISTNIEJE (backup) |
| `Civ-UNITS/_backup/Galeria-jednostek-4widoki_20260624_230100.html` | l. 3971, ta sama forma | NADAL ISTNIEJE (backup) |

#### 14.6.2 Archiwa Office i zip (zarzuty 2 i 3)

| Plik (pin) | Trafienia (członek=liczba) | Status |
|---|---|---|
| `Technologie-drzewko.xlsx` | sheet4=1, sheet5=2 (`Karawanseraj; Magazyn`) | NADAL ISTNIEJE (arkusz) |
| `docs/archiwum/panele-legacy/Technologie-drzewko.xlsx` | sheet4=1, sheet5=2 | NADAL ISTNIEJE (archiwum) |
| `dyspozycje/DRZEWKO-TECH-UKLAD-3TIER.xlsx` | sharedStrings=1 | NADAL ISTNIEJE (arkusz) |
| `docs/archiwum/panele-legacy/MIASTO/Budynki.xlsx` | sharedStrings=2 (`karawanseraj`, `Karawanseraj`) | NADAL ISTNIEJE (archiwum) |
| `docs/archiwum/panele-legacy/MIASTO/Panel-przeglad-danych.xlsx` | sheet2=2 | NADAL ISTNIEJE (archiwum) |
| `UI/KANON — baza wiedzy 1E.zip` | `brand-book/KANON/eksport/icons/buildings/building-icon-map.json`=2; `mockupy/The Game - Budynki infografiki kanon v1 (1E).dc.html`=2; `mockupy/The Game - Ekran Dyplomacja (1E).dc.html`=1 | NADAL ISTNIEJE (archiwum binarne, nieedytowane) |
| `UI/Ulepszenie infografik.zip` | te same trzy członki, te same liczby | NADAL ISTNIEJE (archiwum binarne, nieedytowane) |

Pozostałe 44 z 51 plików `.xlsx/.zip/.docx/.ods/.odt/.pptx` na pinie: 0 trafień (przeszukane).

Zastrzeżenie: pliki binarne innych formatów (np. `.pdf`, `.png`) nie zostały przeszukane osobno. Porównanie `git grep -a` z `-I` wykazało tylko dwa zip-y z §14.6.2 jako trafienia binarne; reszta tekstu bez zmian.

#### 14.6.3 Pozostałe 40 plików tekstowych z 44 (zarzut 5 — pełna lista ze statusem; 4 z §14.6.1)

Stan wspólny: `NADAL ISTNIEJE` = artefakt/dokument/rejestr/archiwum/build poza zakresem kodu (decyzja właściciela, §14.4). Liczby = `git grep -I -c` na pinie.

- `Gra-FINALNA.html` 18; `Gra-podglad-POLE-BITWY.html` 1; `UI/Gra-podglad-KREATOR-E2.html` 1; `MIASTO/Panel-przeglad-danych.html` 1; `Makieta-drzewko-technologii.html` 1; `STAN-PRACY-HANDOFF-ARCHIWUM-2026-08-20.md` 3; `EKONOMIA/EKONOMIA-analiza-surowce-budynki.md` 1 — NADAL ISTNIEJE
- `docs/archiwum-ux/Gra-podglad-OKOLICA-UX_PRE-IKONY-2026-06-26.html` 2; `…OKOLICA-UX_TOPBAR-2026-06-26.html` 2; `…PLAYTEST-MIASTO_TOPBAR-2026-06-26.html` 2 — NADAL ISTNIEJE (archiwum UX)
- `docs/decyzje/B-SUROW-BUD-2026-07-23.md` 1; `docs/decyzje/B2-narzedzia-stabilizacji.md` 1; `docs/decyzje/PACZKA-UPGRADE-2-ABC-2026-07-05.md` 1 — NADAL ISTNIEJE (dokumenty decyzji)
- `dyspozycje/AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` 9; `AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md` 1; `AUDYT-WERYFIKACJA-53-WERDYKTY.md` 1; `BACKLOG-PRZYSZLOSC.md` 1; `DECYZJE-BUDYNKI-2026-07-25.md` 2; `DECYZJE-MNOZNIK-ABC.md` 25; `DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md` 2; `PAMIEC-ROBOCZA-CIV.md` 1; `PROBLEMY-I-ROZWIAZANIA-2026-07-25.md` 3; `REJESTR-PROSB-I-ZADAN.md` 5; `SLEDZTWO-MNOZNIK-BUDYNKOW.md` 3; `WERSJE.md` 4; `_handoff/KANAL-PRACA.md` 2 — NADAL ISTNIEJE (rejestry; 13 plików tekstowych w `dyspozycje/*` + 1 xlsx = 14 plików)
- `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html` 1; `gra-robocza/Gra-ROBOCZA.html` 1; `gra-robocza/data — kopia/buildings.json` 2; `gra-robocza/data — kopia/tech.json` 1; `gra-robocza/srcKopiaMaster/data/wikiBundle.json` 1; `gra-robocza/srcKopiaMaster/ui/icons/brand/building-icon-map.json` 1 — NADAL ISTNIEJE (kopia robocza poza `gra/**`)
- `gra/Gra-podglad-POLE-BITWY.html:3955` 1 — NADAL ISTNIEJE (osadzony podgląd w `gra/`)
- `gra/tools/.diag-playtest-bundle.cjs` 2; `gra/tools/.pt-layout-bundle.cjs` 2; `gra/tools/.zeton-max-dist/index.html` 1; `gra/tools/.zeton-mockup-dist/index.html` 1; `gra/tools/.zeton-tabliczka-dist/index.html` 1; `gra/tools/.zeton-tabliczka-kat-dist/kat.html` 1 — NADAL ISTNIEJE (artefakty buildu; usuwane przez rebuild)
- `gra/src/game/trade-routes.ts:904` 1 — **NAPRAWIONY (kod)**; zostaje wyłącznie komentarz historyczny

#### 14.6.4 Ścieżki (bez trafień tekstowych)

- `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` — NADAL ISTNIEJE (osierocony asset, §14.4 pkt 1)
- `gra-robocza/srcKopiaMaster/ui/icons/brand/buildings/bld-karawanseraj.svg` — NADAL ISTNIEJE (kopia robocza)

#### 14.6.5 Miejsca z dispatchu i audytu bez trafień (zarzut 4)

- `gra/src/ui/empireDetailPanel.ts` — 0 trafień na pinie (`git grep -n -i karawan edb8fb56 -- …` pusto); audytowe l. 434 nie zawiera Karawanseraju. **NAPRAWIONY / czysto.**
- `docs/encyklopedia/budynki/karawanseraj.md` — **nieobecny** na pinie (`git ls-tree -r edb8fb56 -- docs/encyklopedia/budynki/` nie zawiera pliku). **NAPRAWIONY / czysto.**
- `docs/encyklopedia/indeks.md` — 0 trafień na pinie (l. 12 to link „Targowisko (Rynek)”). **NAPRAWIONY / czysto.**
- `gra/src/data/wikiBundle.json` — 0 trafień karawanser (w `gra-robocza/…wikiBundle.json` 1, §14.6.3). **NAPRAWIONY w `gra/`.**
- `gra/data/tech.json`, `gra/data/buildings.json`, `gra/src/ui/icons/brand/building-icon-map.json`, `gra/src/ui/cityPanel.ts`, `docs/PORADNIK-GRACZA/*` — 0 trafień na pinie (`git grep -I -c -i karawanser edb8fb56` ich nie wymienia). **NAPRAWIONY.**

#### 14.6.6 Źródła frazy 8b (zarzut 8)

Fraza „+1 ¤ na poz. 2 / na poziom 2 / na wyższych poziomach w danych” występuje także poza `wikiBundle.json`:

- `docs/encyklopedia/budynki/koszary.md:37` — „2 ¤/turę (+1 ¤ na poz. 2)”
- `docs/encyklopedia/budynki/mury.md:34` — „2 ¤/turę (+1 ¤ na poziom 2)”
- `docs/encyklopedia/budynki/targowisko.md:38` — „1 ¤/turę (+1 ¤ na wyższych poziomach w danych)”
- `gra/src/data/wikiBundle.json` `encyklopedia[57]` (`budynki/koszary`), `[77]` (`budynki/mury`), `[131]` (`budynki/targowisko`) — pola `wikiM` i `full`, te same frazy.

Statusy z §14.1 **bez zmian** (dane `buildings.json` zgodne z frazami): Koszary NAPRAWIONY, Mury NAPRAWIONY, Targowisko NADAL ISTNIEJE. Stan w `docs/encyklopedia/*.md` i w `wikiBundle.json` jest identyczny, więc nie ma rozbieżności między nośnikami.

#### 14.6.7 Liczniki po korekcie (zastępują §14.3)

- Trzy hasła 8b: **NAPRAWIONY 2** (Koszary, Mury) · **NADAL ISTNIEJE 1** (Targowisko, fraza). Źródła: 3 pliki `.md` + 6 pól `wikiBundle.json`.
- Karawanseraj w `gra/src/**` i `gra/data/**`: **NAPRAWIONY** (trade-routes.ts poza komentarzem, cityPanel.ts, tech.json, wikiBundle.json, buildings.json, building-icon-map.json, `docs/PORADNIK-GRACZA/*` 25 plików, empireDetailPanel.ts, indeks.md, nieobecny karawanseraj.md).
- Karawanseraj poza kodem: **NADAL ISTNIEJE** — 43 pliki tekstowe (z 44 bez `trade-routes.ts`) + 7 plików archiwów Office/zip (5 xlsx, 2 zip) + 2 ścieżki SVG, wszystkie wymienione w §14.6.1–§14.6.4.
- Kryterium binarne (zero pozycji bez statusu z dowodem): **SPEŁNIONE dopiero po §14.6** (każda pozycja z `git grep -I -c`, `git ls-tree` i przeszukania zip/xlsx ma status). Przed §14.6 kryterium **nie było** spełnione.

#### 14.6.8 Odpowiedzi na zarzuty Evaluatora (tura 2, pin `edb8fb56`)

- **Zarzut 1 — PRZYJMUJE.** Dodano §14.6.1. Dowód: `git grep -n` (l. 3971 we wszystkich czterech plikach), literal `{id:"karawanseraj",nazwa:"Karawanseraj"}`.
- **Zarzut 2 — PRZYJMUJE.** Dodano §14.6.2 (pięć plików xlsx, dowód: członki `xl/…` przez `zipfile`). Liczba „13 plików” w §14.6.3 była niepełna: `dyspozycje/*` = 13 tekstowych + `DRZEWKO-TECH-UKLAD-3TIER.xlsx` = 14.
- **Zarzut 3 — PRZYJMUJE.** `UI/KANON — baza wiedzy 1E.zip` i `UI/Ulepszenie infografik.zip` mają trafienia (3 członki każdy). Pierwszy skan pominął pierwszy zip, bo ścieżka z `—` jest cytowana przez git (`core.quotePath`); powtórzony skan NUL-safe (`git ls-tree -r -z`) obejmuje oba. Status: NADAL ISTNIEJE (archiwum binarne), nie „nieprzeliczone”.
- **Zarzut 4 — PRZYJMUJE.** Dodano §14.6.5: `empireDetailPanel.ts` (0), `karawanseraj.md` (nieobecny), `indeks.md` (0), z dowodem `git grep`/`git ls-tree`.
- **Zarzut 5 — PRZYJMUJE.** §14.3 „SPEŁNIONE” było przedwczesne. Poprawiono w §14.6.7; nagłówek raportu zostaje PASS-WITH-NOTES (Targowisko i artefakty poza kodem wymagają decyzji).
- **Zarzut 6 — PRZYJMUJE (korekta faktu).** Raport r1 podał „Brak commita” — to było nieprawdziwe. Commit `b602c663` (2026-10-21 05:07:47 +0000, +64/−0 w `P1-16-EDGE-CASES.md`, komunikat „interim … operator round-1 write (§14)”) istnieje na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (lokalnie i `origin`). Nie istnieje na `rust-port/parity-v2` (`git cat-file -e` → brak). Tej tury nie wykonano żadnego commita ani pusha. Working tree: `P1-16-EDGE-CASES.md` bez zmian względem HEAD. Kto wykonał commit, nie ustalono z pliku.
- **Zarzut 7 — ODRZUCAM (z zastrzeżeniem dla orkiestratora).** Ta sesja ma wprost zakaz pisania plików raportu `.md`; dispatch wymaga zwrotu raportu w tekście (FORMAT ODPOWIEDZI). Pakiet `runs/<ID>/` jest na allowliście, ale nie jest zlecony jako zapis Operatora. Trwały zapis `runs/<ID>/` (CLAUDE.md, minimalny kontrakt raportu) musi wykonać orkiestrator z tekstu odpowiedzi. Kontrola tego nie blokuje, ale zostaje jako otwarta pozycja procesu.
- **Zarzut 8 — PRZYJMUJE.** Dodano §14.6.6 (3 pliki `.md` + 6 pól `wikiBundle.json`). Statusy nie zmieniają się.

#### 14.6.9 Ograniczenia tej tury

- Nie zmieniono §1–§13 ani żadnego pliku poza tym jednym (dopisanie na końcu §14).
- Nie przeliczono kwot z mnożnikami FALA2 i ery (zastrzeżenie §14.1).
- Nie przeszukano plików binarnych innych formatów niż Office/zip (np. `.pdf`, `.png`); `git grep -a` nie dał dodatkowych trafień tekstowych.
- Nie zrobiono nowego `runs/…/01-*.md` (zob. zarzut 7).
- Poza zakresem: korekta frazy Targowiska w `wikiBundle.json`/`.md`, usunięcie osieroconego SVG, decyzja o artefaktach HTML/zip/xlsx — osobne dispatche (§14.4).

**DEPLOY/PUSH: NIE WYKONANO.**

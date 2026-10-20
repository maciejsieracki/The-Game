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
| `dyspozycje/AUDYT-KODU-2026-07-21.md` | NAPRAWIONY 57 · NADAL 7 · NIEROZSTRZYGNIĘTY 9 | §8.1 |
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

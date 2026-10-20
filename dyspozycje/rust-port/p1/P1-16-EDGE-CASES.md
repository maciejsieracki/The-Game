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

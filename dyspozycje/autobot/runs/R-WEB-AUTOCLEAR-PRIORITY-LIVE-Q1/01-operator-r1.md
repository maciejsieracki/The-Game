STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1
GOAL: farma przed trzodą przy rzece (rejestr #1: E1 farma → E2 wycinka+farma → E3 trzoda → E4 irygacja); diagnoza zgłoszeń Korynt/Rodos.
ZMIANY/COMMIT: `b65363410` — `gra/src/game/auto-improvements.ts` (nowe `onRiverHex`), nowe `gra/tools/autoclear-priority-q1-test.cjs`, `gra/tools/autoclear-priority-live-test.cjs`, `evidence/`, `gate-*.txt`. Raport: kolejny commit. Zero zmian w `main.ts`, `gra-robocza/**`, `WERSJE.md`.

## Przyczyna (pierwsze odstępstwo)
`auto-improvements.ts:1142-1145` (przed zmianą): „heks z rzeką” w E1/E2/E3 = wyłącznie `map.riverPaths` (użycia: filtr E1 ~:1356, sortowanie, `riverKrok0Ok` ~:1502, `rzekiDoZagospodarowania` ~:1528, `keyBlockedOnHex` ~:1622). Realna mapa nowej gry (seed 778899, zapis przez `buildSaveGameSnapshot`): 1961 heksów `rzeka.obecna`, tylko 1173 w `riverPaths`. Centrum / pole obywatela na rzece spoza `riverPaths` nie było kandydatem E1; trzoda (E3) stawała na innym heksie ścieżki rzeki, a farma na „tamtym” heksie czekała do E5 — za trzodą i irygacją (irygacja ~58 Pracy przy sztywnym 33% budżetu wstrzymuje E5: `earlierStageIsPending`). To odpowiada zgłoszeniu Rodos (tura 1–2: trzoda zamiast farmy).
Poprawka: `onRiverHex = riverPaths ∪ rzeka.obecna` w E1, sortowaniu, E2, E3. `hasRiverAccess` (S3-1: tartak/obóz) bez zmian.

## Tabela: scenariusz → kolejność (picker na realnej mapie z żywej gry, 60 miast, 1 obywatel, pula 300, +25/tura, 33%)
| profil | wycinka | technologie | PRZED: trzoda przed farmą na otwartym heksie na rzece | PO | zgodność z #1 po poprawce |
|---|---|---|---|---|---|
| K2 | OFF | pełne | 32/60 | 0/60 (farma>farma>trzoda 57, farma>trzoda>irygacja 3) | tak |
| K1 | OFF | pełne | 32/60 | 0/60 | tak |
| K2 | ON | pełne | 32/60 | 0/60 | tak |
| K2 (3 obyw.) | OFF | pełne | 48/60 | 0/60 | tak |
| K1 (3 obyw.) | ON | pełne | 48/60 | 0/60 | tak |
| K2 | OFF | tylko „Oswojenie zwierząt” | trzoda pierwsza w 60/60 | bez zmian (ABC-5=A) | wg decyzji |
Żywe (Chromium, bundle ROBOCZA = kod PRZED, start na heksie ścieżki rzeki, 30 tur, K1/K2, OFF/ON): kolejność zgodna — t1 farma(centrum)+farma(obywatel) → t2 trzoda → t3/t5 irygacja → dopiero potem farmy poza rzeką (E5). Ten start NIE odtwarza błędu (centrum na `riverPaths`); błąd odtworzono na żywo-zdekodowanej mapie pickerem (`evidence/sweep-przed-po.txt`, `live-k2-off-opis.txt`).
Wycinka (Korynt, las wszędzie): przy przycisku OFF zero wycinki gracza jest zgodne z decyzją (domyślnie OFF: `cities.ts:226`, domyślny tryb `reczny` :203). Przy ON wycinka+farma przy rzece działa (sweep: `farma>wyrab>farma`). NIE_ZMIERZONO: żywa wycinka K1/K2 ON na lesie przy rzece (bundle nie ma hooka polityki, mapa startowa bez lasu pod obywatelem).
Hipotezy z dispatchu: (i) technologia — POTWIERDZONA jako możliwa: Rolnictwo i Oswojenie zwierząt są obie poziomu 1 bez prereq (`tech.json`); gdy gracz zna tylko Oswojenie, trzoda jest pierwsza (zgodnie z ABC-5=A). (ii) farma nie wymaga rzeki (`terrain-improvements.json`); (iii) koszt farmy = trzody = 20, nie powód; (v) centrum jest zwykłym heksem; (c)/(e) wycinka nie blokuje pickerów (`clearingHexKeys` tylko deduplikuje), `skipWyrab` blokuje E2 tylko przy OFF (zgodnie z decyzją).

## TESTY (logi `gate-*.txt`, każdy z `EXIT=`)
- `autoclear-priority-q1-test.cjs` 19/19 (NOWY, K1+K2, centrum/pole na rzece poza riverPaths, trzoda tylko po farmie, bez Rolnictwa trzoda pierwsza).
- Mutacje: oryginał `origin/main` → 17/19 (2 FAIL), `onRiverHex` bez `rzeka.obecna` → 17/19 (2 FAIL).
- `autoimprove-stages-q1-test` 302/0, `auto-improvements-test` 46/0, `tsc --noEmit` EXIT=0. 
- Pokrewne (16 plików): bez regresji; `ai4-popyt-obywatele` (1 FAIL), `oboz-lowiecki-las` (19), `praca-jeden-podzial-kontrakt` (2) — IDENTYCZNE na kodzie bazowym (istniejące, poza zakresem).
- Żywy test po poprawce: NIE_ZMIERZONO (wymaga bundla z nowym kodem — build robi orkiestrator).

## BLOKADY
Brak. Uwaga: ręczna konfiguracja polityki w żywym teście idzie przez `restoreGameFromSave` (brak hooka UI).

## DECYZJA_WYMAGANA (ABC, zgłasza orkiestrator)
A: heks tylko SĄSIADUJĄCY z rzeką (bez własnej rzeki) zostaje E5 po trzodzie/irygacji (dziś; zgodne z testami (c)/(d)) — B: farma na takich heksach już w E1 (szersza definicja jak irygacja; wymaga zmiany testów kontraktu E4).
A: trzoda i irygacja czekają na budżet 33% (dziś) — B: komunikat w UI „Czeka na Pracę: irygacja 58” (pokazuje, czemu farmy poza rzeką stoją).
A: przy przycisku „Wolno wycinać las” OFF brak wycinki (dziś) — B: komunikat „Wycinka wyłączona” przy braku kandydata.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (weryfikacja kodu `auto-improvements.ts` diff, mutacje, żywy build z poprawką).
## DEPLOY/PUSH: NIE WYKONANO

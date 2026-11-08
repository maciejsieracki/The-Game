STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-FROZEN-FORTIFIED-UNSELECTABLE-Q1
GOAL: Jednostka lub armia w stanie fortify/garnizon zawsze wybieralna; laczenie nie przenosi blokady; samoleczenie gracz+AI ta sama logika.
RUNDY: 2/5 (obrona po FAIL Evaluatora r1)

## Odpowiedz na zarzuty

1. Brak testu behawioralnego laczenia — PRZYJMUJE.
   - Logika merge wyniesiona z inline `main.ts` do `normalizeMergedFortify` (armyMerge.ts), wolana z OBU sciezek (panel i ruch na heks).
   - Jednostkowo na prawdziwych funkcjach (A8-A13): sierota+26, pole+26, re-fortify, wlasne miasto, oblegajaca, brak zmian. Mutacje M7-M10 lamia A.
   - Chromium (D7-D10): REALNY panel "Polacz armie" (sierota+20 oraz fortyfikacja w polu+19), po scaleniu nikt inGarnizon/field, ruch>0, pula>0, realny klik wybiera, przycisk fortyfikacji wlacza/wylacza caly stos, panel "Rozdziel" widzi 21 jednostek i dzieli.
   - Dowod RED live: `LIVE_RED=1` (bundle z normalizacja=no-op) -> pass=71 fail=5 (D7c/D7d/D8b/D10/D10b: pula 0, odfortyfikowanie nie pomaga) — `gate-live-red-r2.txt`.

2. `ufortyfikowanyWPolu` / `group.some` (main.ts:7305) — PRZYJMUJE; zbadano, znaleziono DRUGA realna przyczyne zamrozenia.
   - `syncStackRuchLeft` = MIN puli. Jednostka ufortyfikowana w polu (ruchLeft 0, snapshot) zerowala pule CALEJ armii po scaleniu; zdjecie fortyfikacji przywracalo ruch tylko jej samej (A9 REPRO: pula=0 po exitFieldFortify).
   - `enterFieldFortify` nadpisywalo snapshot zerem przy ponownym "Ufortyfikuj" stosu z ufortyfikowana jednostka -> zdjecie "przywracalo" 0 (A10). Naprawione (idempotentne).
   - Przycisk panelu liczyl stan z samej `active`, nie ze stosu: teraz `stack.some(...)` (stan) i zdjecie dla calego stosu (handler). `group.some` w liscie armii (7305) jest tylko etykieta/odznaka listy ("ufortyfikowana w polu") — celowo "stos zawiera"; po normalizacji merge stos jest jednolity, wiec nie zapala sie fantomowo.
   - Merge: poza garnizonem WLASNEGO miasta zdejmuje tez fortyfikacje w polu (poza oblegajacymi); ruch ze snapshotu.

3. Hover / split / follow-leader — CZESCIOWO PRZYJMUJE.
   - Hover: `healInconsistentUnits('hover')` na zmiane heksu (main.ts mousemove). D11 (Chromium): realny ruch myszy leczy sierote, licznik rosnie.
   - Split: D9/D9b realny panel (21 wpisow, podzial, razem 21). Panel nie widzial sieroty (visibleStackOnHex) — naprawione heal-em + normalizacja merge.
   - pageerror/console.error: D12 obejmuje klik, merge, fortyfikacje, split, hover, start tury — 0 bledow.
   - Follow-leader (`generalQuickFollow.ts:28,73,144`): pomija `inGarnizon`/`oblegaCityId`; przy sierocie (garnizon poza miastem) jednostka byla pomijana, heal zdejmuje flage przed planowaniem (start tury). NIE_ZMIERZONO: zywy test follow-leader z przerwanym marszem (nie odtworzono, dowod tylko z kodu: plik:linia powyzej).

4. Brak odtworzenia organicznego / RED warstwy D — CZESCIOWO PRZYJMUJE.
   - RED warstwy D teraz jest (LIVE_RED=1, wyzej); wczesniej tylko jednostkowy (`BASELINE=1` pass=2 fail=1).
   - Pomiar 5 ziaren x 100+ tur: nadal NIE_ZMIERZONO (headless: tura w kilka sekund). Przyczyna organiczna sieroty (evict/cesja) wywnioskowana z kodu (`enterGarnizon` tylko w 2 miejscach), nie odtworzona w grze — jawnie oznaczone. Przyczyna "pula=MIN" (pkt 2) jest odtworzona w grze zywo (LIVE_RED).

5. Hak `__frozenTestDebug` — PRZYJMUJE.
   - Uzasadnienie: stanowisko stanu wejsciowego dla testu Chromium (wzor `__eraTestDebug`); klik/wybor/merge/heal ida REALNYMI sciezkami.
   - Oslona: `if (isCivTestEnabled(window.location.search))` — ta sama bramka co `window.__civTest`; bez `?civTest=1` hak nie istnieje (test C12 pilnuje).

## Zmiany (allowlista)
gra/src/game/armyMerge.ts, gra/src/main.ts, gra/tools/unit-frozen-fortified-unselectable-test.cjs, ten katalog runs. Zero zmian w gra-robocza, rust-port, WERSJE.md.

## Testy
- `node tools/unit-frozen-fortified-unselectable-test.cjs`: pass=76 fail=0 EXIT=0 (`gate-full-green-r2.txt`).
- RED live `LIVE_RED=1`: pass=71 fail=5 (`gate-live-red-r2.txt`); RED jednostkowy `BASELINE=1`: pass=2 fail=1 (`gate-red-baseline-r2.txt`).
- `tsc --noEmit`: 0 bledow (`gate-tsc-r2.txt`).
- Regresje (`gate-regression-r2.txt`, 66 testow, --no-live): 14 FAIL, ten sam zbior co r1 PO (r1 mial 17 = te 14 + 3 `army-merge-panel-*` czerwone tylko z braku `/usr/bin/chromium`; z `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` wszystkie 3 PASS). Brak nowych regresji.

## NIE_ZMIERZONO
- Pomiar PRZED/PO 5 ziaren x 100+ tur gracza-bota.
- Organiczne odtworzenie sieroty w grze (evict/cesja traktatu).
- Zywy follow-leader z przerwanym marszem.
- Wizualny hover tooltip (sprawdzono tylko heal + brak bledow, nie tresc tooltipu).

BLOKADY: brak
NASTEPNY KROK: Evaluator r2
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BUILD-SPLIT-AUDIO-SIDECAR-Q1
GOAL: build daje HTML (kod + dane nie-audio) + pliki-sąsiedzi audio-pack-N.js z CAŁYM audio (DODATEK 1), ładowane <script src> z file://, cichy fallback bez sąsiadów, strażnik rozmiaru.
ZMIANY/COMMIT: patrz SHA na końcu (commit kodu) + merge MUSIC2 FC d8c4d1d58 (źródło pakietu muzyki; merge czysty, bez konfliktów).
  Allowlista (dotknięte): gra/vite.config.ts, gra/src/audio/filePlayer.ts, gra/tools/audio-sidecar-test.cjs (NOWY),
  gra/tools/memory-datauri-duplicates-test.cjs, gra/tools/civ-music-live-test.cjs, ten raport.
  NIE dotknięte: finalize.sh, gra-robocza/, KANON/FINALNA, gra/data/civ-music.json, WERSJE.md.
TESTY: (build poza repo: `node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir`; 16 s)

## Co zrobiono
1. vite.config.ts, wtyczka `civ-binary-assets-out-of-js`:
   - mp3 (MIME audio/*) NIE trafia już do HTML. Wszystkie audio idzie do `audio-pack-N.js` obok HTML (stałe nazwy,
     numeracja ciągła od 1), pakowanie deterministyczne (klucze = SHA-256 treści, posortowane, first-fit do 40 MB
     znaków base64 na pakiet; twardy limit pakietu 90 MB -> błąd buildu).
   - Format pakietu: `(function(r){ r["<klucz>"]="<base64>"; ... })(window.__CIV_AUDIO__=window.__CIV_AUDIO__||{});` +
     samousunięcie elementu `<script>` (document.currentScript).
   - HTML dostaje `<script src="audio-pack-N.js"></script>` (ścieżka względna, klasyczny skrypt) zaraz po `<head>`,
     PRZED bundlem -> działa z file:// bez serwera i bez fetch. Obrazy png/jpg nadal jako elementy danych w HTML
     (bez zmian; zakres tematu = audio).
   - Runtime `civEmbeddedAssetUrl`: dla audio czyta rejestr `window.__CIV_AUDIO__`, po zdekodowaniu usuwa wpis
     (base64 nie zostaje na stercie); brak pakietu/klucza -> pusty URL (cichy fallback).
   - Strażnik: hook `writeBundle` skanuje outDir rekurencyjnie i RZUCA błąd (vite kończy się kodem 1), gdy dowolny
     plik > 95 MB (`OUTPUT_FILE_FAIL_BYTES`); wypisuje listę plików i sumę. Do testu: env `CIV_OUTPUT_FAIL_BYTES`.
2. filePlayer.ts: wszystkie globy mp3 owinięte w `dropEmptyUrls` (puste URL-e odrzucane) -> brak sąsiada = pusta
   playlista = dotychczasowy mechanizm "brak utworów" (bez błędów). Dev (Vite serve) bez zmian.
3. Testy: nowy `audio-sidecar-test.cjs` (S1-S3 statyka, W z sąsiadami, N bez sąsiadów, G strażnik);
   `memory-datauri-duplicates-test.cjs` zaktualizowany (audio weryfikowane w pakietach: SHA-256 bajtów, MIME,
   blob: URL, decodeAudioData); `civ-music-live-test.cjs` L5/L6 poprawione (STARE oczekiwania sprzed MUSIC2:
   Sumerowie mają teraz negocjacje 149,3 s, Celtowie przywitanie 38,45 s — wcześniej FAIL 18/2 na samym MUSIC2).

## Pomiary (build z tego commitu; scratch poza repo)
- index.html: 14 306 135 B (14,3 MB). `grep -c "data:audio/" index.html` = 0.
- audio-pack-1.js 39 803 262 B; audio-pack-2.js 39 999 512 B; audio-pack-3.js 11 556 324 B (każdy < 90 MB).
- Razem: 105 665 233 B (ok. 5% więcej niż wcześniejsze 100,78 MB: różnica nie zbadana, NIE_ZMIERZONO przyczyny —
  prawdopodobnie pakiet MUSIC2 w pełni wliczony vs wcześniejszy pomiar). Żaden plik > 95 MB.
- MD5 (informacyjnie dla tego commitu; orkiestrator liczy własne po swoim buildzie): audio-pack-1 5b990bc3...,
  audio-pack-2 0a9a1047..., audio-pack-3 9e88be9f..., index.html 3adf1dce...
- UWAGA: gra-robocza/Gra-ROBOCZA.html w main ma 85,77 MB, a nowy index.html tylko 14,3 MB — finalize.sh
  (poza zakresem) kopiuje/przetwarza HTML; należy po deployu zmierzyć faktyczny rozmiar Gra-ROBOCZA.html.

## Wyniki bramek (wszystkie zielone)
- tsc --noEmit: 0 błędów.
- audio-sidecar-test (na zbudowanym dist): S1a-c, S2a-c, S3 (91/91 mp3, SHA-256 zgodne, 0 dubli), W1 (muzyka gry
  gra z blob:, currentTime 0,24 -> 2,49 s), W2 (przywitanie Greków 40,70 s, currentTime rośnie), W3 (rejestr pusty),
  W4 (0 błędów konsoli), N1-N5 (bez sąsiadów: gra startuje, cisza, HUD działa, 0 pageerror; jedyne wpisy konsoli =
  3x "Failed to load resource: net::ERR_FILE_NOT_FOUND" dla audio-pack-N.js — komunikat sieciowy przeglądarki, nie
  da się go wyciszyć przy <script src>), G (build z progiem 1 MB: kod 1, "plik wyjsciowy audio-pack-1.js ... >").
- memory-datauri-duplicates-test --no-snap: 14 PASS (91 audio zdekodowane, 4696 s, 0 błędów).
- civ-music-live-test na nowym bundlu (z L9 autoplay): wcześniej 18 OK/2 FAIL (stare oczekiwania), po poprawce
  19 OK/0 FAIL (z CIVMUSIC_SKIP_AUTOPLAY=1; pełny przebieg z L9 przed poprawką: L9 OK).
- civ-music-test 100 OK/0 FAIL; menu-game-music-transition-test 7/0; menu-music-delay-test 9/0;
  ambience-natura-tylko-zwierzeta-test 8 pass/0 fail (własny build w gra/dist-... usunięty); logic-test 213/213.
- NIE_ZMIERZONO: zużycie pamięci przeglądarki z sąsiadami vs wcześniej (C1 snapshot sterty pominięty, --no-snap).

## Instrukcja dla orkiestratora (finalize / kopiowanie)
1. Build poza repo: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/vbuild --emptyOutDir` (log sprawdź
   pod kątem BIEŻĄCEGO merge'a; strażnik >95 MB zatrzyma build błędem).
2. Wyjście = DOKŁADNIE: `index.html` + `audio-pack-1.js` ... `audio-pack-N.js` (N obecnie 3; liczba zależy od
   rozmiaru audio, stałe wzorce nazw `audio-pack-<n>.js`). Lista: `ls /tmp/vbuild | grep -E '^audio-pack-[0-9]+\.js$'`.
3. Do gra-robocza/ kopiować `index.html` (jako Gra-ROBOCZA.html, jak dotąd) ORAZ WSZYSTKIE `audio-pack-*.js` pod tą
   samą nazwą, W TYM SAMYM katalogu co Gra-ROBOCZA.html (tag <script src="audio-pack-N.js"> jest względny).
   Starsze nadmiarowe `audio-pack-*.js` w gra-robocza/ (gdy N zmaleje) usunąć.
4. MD5: `md5sum Gra-ROBOCZA.html audio-pack-*.js`; wpisać każdy plik w rejestr/WERSJE.md.
   Odczyt GitHub Raw + MD5 dla KAŻDEGO pliku (pakiety też).
5. Wariant POLE-BITWY (vite.oblezenie-bitwa.config.ts i inne konfiguracje) NIE były zmieniane ani budowane — jeśli
   importują mp3, nie mają tej wtyczki (poza zakresem; w razie potrzeby osobny temat).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja kryteriów 1-4 + DODATEK 1)
DEPLOY-PUSH: NIE WYKONANO

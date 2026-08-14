'use strict';
/**
 * menu-music-delay-test.cjs — P-MENU-START-MUZYKI-OPOZNIENIE
 * Uruchom z gra/: node tools/menu-music-delay-test.cjs
 *
 * Zgłoszenie właściciela (Maciej, znalezione w audycie 2026-08-14, oryginalnie
 * z 2026-07-26): „jakiś czas temu prosiłem żebyś przesunął start muzyki w menu
 * głównym o dwie trzy sekundy bo niestety ścina początek zanim się właduje
 * przeglądarka" — muzyka menu głównego startowała natychmiast, zanim
 * przeglądarka zdążyła się „rozgrzać" (załadować zasoby, wyrenderować UI), więc
 * pierwsze 2-3 s utworu bywały ucięte/zniekształcone.
 *
 * USTALENIE (recon przed napisaniem tego testu, nie zgadywanie — zasada
 * CLAUDE.md §6/§7 „nie zgaduj, nie twórz problemów, których nie ma"): to
 * zgłoszenie było już RAZ naprawione (commit c922954f, 2026-07-26,
 * mechanizm startDelayed()+canplaythrough), NASTĘPNEGO DNIA zastąpione
 * innym mechanizmem (fb3ba24b, 2026-07-27: fade-in głośności 0->100% w 5 s,
 * bez opóźnienia startu), po czym opóźnienie 2500 ms zostało DOŁOŻONE z
 * powrotem OBOK fade-inu (89b144ff, Cursor Agent 2026-08-05, „MUZYKA delay
 * 2.5s"). Stan na dziś (weryfikowany też w żywym bundlu gra-robocza/*.html,
 * nie tylko w źródle): OBA mechanizmy działają razem — setTimeout 2500 ms
 * PRZED pierwszym play(), a start faktycznego dźwięku dodatkowo narasta z
 * głośności 0 przez 5000 ms (menu.muzyka_fade_in_ms). Ten test istnieje jako
 * STRAŻNIK tego już wdrożonego zachowania (regresja = ktoś usunie opóźnienie
 * przy okazji innej zmiany w resumeIntroMusic()), NIE jako dowód że dopiero
 * teraz coś naprawiono.
 * / EN: Owner's report (found in a 2026-08-14 audit, originally from
 * 2026-07-26): menu music started immediately, before the browser finished
 * "warming up" (loading assets, rendering UI), so the first 2-3s of the
 * track were cut off/distorted. Recon before writing this test found the
 * fix already exists and is already live: a 2500ms setTimeout before the
 * first play() (menu.muzyka_opoznienie_startu_ms in ui-params.json,
 * wired in resumeIntroMusic() in main.ts) PLUS a 5000ms volume fade-in on
 * top (menu.muzyka_fade_in_ms) — both present in source AND in the deployed
 * gra-robocza/*.html bundle already. This test is a REGRESSION GUARD for
 * that existing behaviour, not evidence of a fresh fix.
 *
 * Zakres opóźnienia: WYŁĄCZNIE pierwszy start playlisty intro w życiu strony
 * (flaga introMusicStartedOnce). Kolejne wywołania resumeIntroMusic() (powrót
 * do menu z gry, zmiana ekranu) muszą wołać startIntroMusic() BEZ opóźnienia
 * — test to sprawdza wprost (musi być JEDNO wystąpienie setTimeout w całej
 * funkcji, w gałęzi if(!introMusicStartedOnce), i startIntroMusic() bez
 * setTimeout w gałęzi else).
 */

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const FILE_PLAYER_TS = path.join(GRA_ROOT, 'src', 'audio', 'filePlayer.ts');
const UI_PARAMS_JSON = path.join(GRA_ROOT, 'data', 'ui-params.json');

let passed = 0;
let failed = 0;

function ok(label, cond, extra) {
  if (cond) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}${extra ? ' -- ' + extra : ''}`);
  }
}

// --- 1) Opóźnienie jako nazwany parametr w danych, w oczekiwanym przedziale 2-3 s ---
const uiParams = JSON.parse(fs.readFileSync(UI_PARAMS_JSON, 'utf8'));
const delayMs = uiParams && uiParams.menu ? uiParams.menu.muzyka_opoznienie_startu_ms : undefined;

ok(
  'ui-params.json: menu.muzyka_opoznienie_startu_ms jest liczbą',
  typeof delayMs === 'number' && Number.isFinite(delayMs),
  `got ${JSON.stringify(delayMs)}`,
);
ok(
  'ui-params.json: menu.muzyka_opoznienie_startu_ms w przedziale 2000-3000 ms (zgłoszenie: "dwie trzy sekundy")',
  typeof delayMs === 'number' && delayMs >= 2000 && delayMs <= 3000,
  `got ${delayMs}`,
);

// --- 2) resumeIntroMusic() w main.ts: setTimeout okablowany na ten parametr ---
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

const fnMatch = mainSrc.match(
  /function resumeIntroMusic\(\)\s*:\s*void\s*\{[\s\S]*?\n {4}\}/,
);
ok('main.ts: funkcja resumeIntroMusic() znaleziona', Boolean(fnMatch));
const fnBody = fnMatch ? fnMatch[0] : '';

ok(
  'resumeIntroMusic(): czyta opóźnienie z UI_PARAMS.menu.muzyka_opoznienie_startu_ms',
  /UI_PARAMS\.menu\.muzyka_opoznienie_startu_ms/.test(fnBody),
);
ok(
  'resumeIntroMusic(): woła setTimeout(...) przed pierwszym startem',
  /setTimeout\(/.test(fnBody),
);
ok(
  'resumeIntroMusic(): opóźnienie strzeżone flagą introMusicStartedOnce (tylko PIERWSZY start)',
  /if\s*\(!introMusicStartedOnce\)/.test(fnBody),
);

// Dokładnie JEDNO wystąpienie setTimeout w całej funkcji -- opóźnienie nie
// może "wyciec" do gałęzi obsługującej kolejne powroty do menu.
const setTimeoutCount = (fnBody.match(/setTimeout\(/g) || []).length;
ok(
  'resumeIntroMusic(): dokładnie 1 setTimeout w całej funkcji (nie duplikuje się do gałęzi "kolejny powrót")',
  setTimeoutCount === 1,
  `got ${setTimeoutCount}`,
);

// Gałąź "else" (kolejne powroty do menu) musi wołać startIntroMusic() BEZ
// opóźnienia -- wyodrębniamy tekst po ostatnim "} else {" w funkcji.
const elseIdx = fnBody.lastIndexOf('} else {');
const elseBranch = elseIdx >= 0 ? fnBody.slice(elseIdx) : '';
ok(
  'resumeIntroMusic(): gałąź "kolejny powrót do menu" woła startIntroMusic() natychmiast',
  /startIntroMusic\(\)/.test(elseBranch) && !/setTimeout/.test(elseBranch),
  `elseBranch=${JSON.stringify(elseBranch)}`,
);

// --- 3) Playlista plikowa (filePlayer.ts): przejścia MIĘDZY utworami (crossfade
// / selectNext / monitorTick) nie mają żadnego odniesienia do opóźnienia startu
// -- opóźnienie dotyczy WYŁĄCZNIE pierwszego uruchomienia, nie kolejnych
// utworów w playliście podczas gry. ---
const filePlayerSrc = fs.readFileSync(FILE_PLAYER_TS, 'utf8');
ok(
  'filePlayer.ts: mechanizm przejść między utworami (selectNext/monitorTick/beginCrossfade) nie zna parametru opóźnienia startu',
  !/muzyka_opoznienie_startu_ms/.test(filePlayerSrc),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

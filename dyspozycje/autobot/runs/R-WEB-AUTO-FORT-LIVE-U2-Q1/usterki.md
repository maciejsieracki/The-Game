# usterki — R-WEB-AUTO-FORT-LIVE-U2-Q1 (runda 1)

## U-HARNESS-ERA-LIMIT (DOMAIN: PROCESS/narzędzia; nie usterka gry)
- Fakt (pomiar, `evidence/limit-probe-p1-s18-u1.json`): po `__civTest.unlockAllTech()` (32 technologie) po 1 turze `player.era` = 3
  (`__eraTestDebug.getPlayerState()`, main.ts:24837), a limit miast = baza + (era-1)*5 (`cities.ts:1220-1225`, `auto-improvements.ts:611`) = 1 + 2*5 = 11.
  Drugie i trzecie miasto da się założyć już w T2/T7 mimo "Limit miast (baza)=1".
- Bez `unlockAllTech` (`limit-probe-p1-s18-u0.json`) limit =1 obowiązuje (8/8 prób: "limit miast na tej epoce", T1/T2/T7, era=1).
  Kontrola bez preferencji (`limit-probe-pnone-s18-u0.json`): limit 10, miasta zakładane od razu.
- Skutek: scenariusz U-2 ("limit miast wyczerpany") jest NIEOSIĄGALNY wzorcowym skryptem `live-verify-autoimprove-fort.cjs`
  (unlockAllTech jest konieczne dla kluczy fort/posterunek, ale jednocześnie podnosi epokę). `cityLimitExhausted=false` we wszystkich turach.
- Propozycja (poza allowlistą tego tematu): hak testowy `__civTest.unlockTechs(names[])` (bez zmiany epoki) albo `__civTest.setCityLimit/forceCityLimitExhausted`
  w `gra/src/game/civ-test-hooks.ts` + `main.ts` (~26562) — osobny temat; po nim powtórzyć U-2 z faktycznie wyczerpanym limitem.
- Hipoteza (NIE_ZMIERZONO): przy wyczerpanym limicie bramki E-FORT (staged/fallback/deficit/koszt/rezerwa/sufit) nie były w ogóle testowane żywą grą.

## U-LOG-INFRASTRUKTURA-BRAK-WPISOW (INFORMATIONAL)
- Profil "infrastruktura": 0 wpisów `e-fort` (city0) w 14 turach, choć forty stoją (fort 14,34 T3; posterunek 13,37 T4) — ścieżka budowy
  fortów w tym profilu nie przechodzi przez log `fortSink`/`fortReason` (`auto-improvements.ts:1015-1028`, `:741-757`).
  Nie blokuje; log E-FORT dotyczy tylko ścieżki profilu zrównoważone. NIE_ZMIERZONO, skąd dokładnie budowane są te forty.

## NOTA-S18-GAMEOVER (INFORMATIONAL)
- Seed 18: gra zakończona (`gameOver`) na końcu T33 (wojna `setWar(0,21)` ze skryptu; 0 miast gracza w snapshotcie końcowym; koniec tury #34 zablokowany `gameOver`, 420 s). Dane T2–T33 kompletne.

## OBRONA r1 — uzupelnienia
- U-HARNESS-ERA-LIMIT: slowo "NIEOSIAGALNY" WYCOFANE. Wariant w allowliscie dziala czesciowo: `FILL_CITIES=11` w `live-verify-autoimprove-fort.cjs`
  (T.foundCity po 1. turze, era 3 => limit 11) zaklada 11 miast gracza w T2 (`evidence/fort-fill-probe-s18.json`, `fort-zrownowazone-s18-fill11*.json`).
  Pierwsza zywa obserwacja bramki PO wejsciowej: T3 `e-fort bramka: zywnosc E1-E6 w toku` (cityLimitExhausted=true, roadCities=11, stagedPicks=63, deficitPicks=397, fortPicks=0).
  Ograniczenie: konczenie tury T3 wisi 420 s, log `blocked: gameOver` (z wojna i bez, `NO_WAR=1`); przyczyna gameOver NIE_ZMIERZONO.
- U-3 kontrola negatywna: bundel PRZED poprawka 8f59c5c2, ten sam scenariusz, 8 tur: posterunek (14,33) r3 w odleglosci 1 od fortu (14,34) r5, shared=37=nHex.
  Bundel e3f08be6: posterunek (13,37), d=3, shared=33<37.

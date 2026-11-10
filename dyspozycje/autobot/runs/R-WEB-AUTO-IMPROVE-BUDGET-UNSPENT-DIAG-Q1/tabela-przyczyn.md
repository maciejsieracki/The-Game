# Tabela przyczyn — R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1

Pomiar na ZYWEJ grze (Chromium headless, realny endTurn, realny `tryFoundPlayerCityAt`), baza `23dd158e9`, seed 778899 Kontynenty
(1 rywal, 0 miast-panstw; zalozenie w dispatchu o szybkosci), gracz Rzymianie, tryb ulepszen `auto`, `pracaAutoPercent` 100 (poza S5 = domyslne 33).
Klasyfikacja heksu = PIERWSZA bramka, ktora go odrzuca (kolejnosc: terytorium → ma ulepszenie → teren → tech → obywatel → regula rzeki → kandydat).
Zasieg = promien terytorium miasta + 1 (tak jak picker: `auto-improvements.ts:1399`). Procenty liczone od heksow W MOIM terytorium (kolumna „moje”).
Fixture (jawnie): techy (`player.zbadane`), polityka imperium, populacja 1. miasta (`setPop`), pula Pracy (`setPraca`); reszta to realna gra.
Scenariusze S1-S4, S6, S7, S9, S11, S12 zmierzone buildem bez logowania upkeep/AI (wyniki gracza identyczne; kod gry bez zmian).

| Scen. | Profil / filtr obyw. / wycinka | Pula start→koniec (tury) | Wydane (suma autoKoszt) | Moje heksy | Ma ulepszenie | FILTR OBYWATELI | Brak tech | Brak zastosowania terenu | Kandydat (czeka) |
|---|---|---|---|---|---|---|---|---|---|
| S1 | Zywnosc / ON / wolno | 800→254 (16) | 1300 | 186 | 15 (8,1%) | **171 (91,9%)** | 0 | 0 | 0 |
| S3 | Zrownowazone / ON / wolno | 800→77 (16) | 1376 | 186 | 16 (8,6%) | **170 (91,4%)** | 0 | 0 | 0 |
| S9 | Zrownowazone / ON / pop 12, pula 3000 | 3000→796 (14) | 2891 | 326 | 26 (8,0%) | **295 (90,5%)** | 0 | 4 (1,2%, gory) | 1 |
| S9b | to samo, 22 tury | 724(t5)→**1289**(t23) rosnie ok. +50/tura | — | 357 | 31 (8,7%) | **321 (89,9%)** | 0 | 4 | 1 |
| S5 | DOMYSLNE (Rown./ON/33%/bez wycinki), techy naturalne, 30 tur | 0→50 (+4/tura start) | 160 | 122 | 5 (4,1%) | **112 (91,8%)** | 5 (4,1%) | 0 | 0 |
| S2 | Zywnosc / OFF / wolno | 800→40 | 892 | 199 | 41 (20,6%) | 0 | 0 | 1 | 157 (78,9%) |
| S4 | Zrownowazone / OFF / wolno | 800→0 (t4) | 786 | 175 | 18 (10,3%) | 0 | 0 | 0 | 157 (89,7%) |
| S4b | jw., 22 tury | 800→0→7 | 786 | 199 | 19 (9,5%) | 0 | 0 | 0 | 180 (90,5%) |
| S11 | Zywnosc / OFF / **bez wycinki** | 800→71 | 1260 | 186 | 24 (12,9%) | 0 | 0 | **65 (34,9%; las: laka/las 51, rownina/las 9, wzgorza/las 5)** | 97 (52,2%) |
| S12 | Zywnosc / OFF / wolno, pula 6000 | 6000→0 (t14) | 5692 | 199 | 85 (42,7%) | 0 | 0 | 1 | 113 (56,8%) |
| S6 | Surowce / OFF | 800→0 (t3) | 766 | 186 | 15 (8,1%) | 0 | 0 | 31 (morze 11, laka 14, rownina 6) | 140 (75,3%) |
| S7 | Infrastruktura / OFF | 800→0 (t3) | 765 | 208 | 8 (3,8%) | 0 | 0 | 98 (morze) | 102 (49,0%) |

„Kandydat (czeka)” = heks przechodzi wszystkie bramki heksa, ale nie ma jeszcze ulepszenia w momencie snapshotu (czeka na etap albo na Prace).
`NIE_ZMIERZONO`: wplyw samych technologii przy puli >> 0 i OFF (S5 mierzy tech tylko przy puli ~50); drugi seed/swiat (brak czasu — jeden seed); AI nie ma
pomiaru przyczyn per heks (tylko pula/koszt/picki per wywolanie, ponizej).

## Przepustowosc etapow (S12, pula 6000, filtr OFF) — 1 etap na tury

| tura | t2 | t3 | t4 | t5 | t6 | t7 | t8 | t9 | t10 | t11 | t12 | t13 | t14-15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| picki (typ) | farma 14 | wyrab 29 | farma 29 | farma 3 | wyrab 14 | farma 14 | bydlo 56+owce 2 | farma 4 | wyrab 18 | farma 18 | bydlo 22+owce 1 | irygacja 38 | brak wywolania (pula 73→0) |

W KAZDYM wywolaniu pickera gracza (S1, S2, S12) picki dotycza dokladnie JEDNEGO ETAPU (S1/S2: 0 tur z >1 typem; S12: 2 tury z bydlo+owce = jeden etap E3; w K2 dodatkowo krok niedoboru) —
`auto-improvements.ts:883` (`if (stagePicks.length > 0) { stagedPicks = stagePicks; break; }`): pierwszy etap, ktory ma picki, „bierze cale wywolanie”.

## Bilans Pracy po wylaczeniu filtru (S4b / S9b)

- S9b (filtr ON): upkeep 61-97/ture, netto +20..+92/ture, pula 724→1289 (19 tur) przy 321/357 heksow zablokowanych filtrem.
- S4b (filtr OFF): po pierwszej turze (786 Pracy na 22 ulepszenia: warzelnia soli x10, kamieniolom x5, tartak x4, kopalnie x3) pula = 0 przez ~19 tur,
  upkeep 32-37/ture, `_lastPracaRate` -9..-1 → przy braku budzetu 180 z 199 heksow zostaje kandydatami. Wniosek: poluzowanie filtra
  samo w sobie zamienia „ogromny nieuzywany budzet” w „budzet 0 i nieustanny upkeep” — decyzja produktowa, nie tylko bug.

## AI (zmierzone: wywolanie `ai.ts:2705`, S5/S9, 30 tur, 4 AI)

`maxItemsPerCity: null` (= Infinity), `pracaBudgetPercent` 100, `improvementBudgetCap` = pula AI (np. pool=33 cap=33), pula AI 10-80 Pracy;
AI wydaje tyle, ile pozwala przychod (n=0 w turach z pula < koszt); brak gromadzenia „ogromnego budzetu” w oknie 30 tur (pula AI nie przekroczyla ~80).
Filtr obywateli AI: `getOnlyWorked: () => true` (`ai.ts:2711`) — przyczyny odrzucen heksow AI NIE_ZMIERZONO.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-ULEPSZENIA-Q1
GOAL: Obrona Operatora po zarzutach Evaluatora (runda 2/5). Zarzuty 1-6 przyjęte z dowodami; plik P1-16F skorygowany.

OBRONA:
- 1 -> PRZYJMUJE. Wiki `ulepszenia/wyrab`, sekcja „Przykład liczbowy”, podaje „Wycinka +2 → 3 żywności/t”, nie handel. Dane `wyrab`: `bonus: {handel: 1}`, brak żywności. Wiersz 15 poprawiony na żywność 2 vs 0; handel 1 oznaczony jako niepodany w wiki.
- 2 -> PRZYJMUJE (sformułowanie). Wpis istnieje: `technologie/drogi_brukowane`, kategoria „Technologie”, epoka Żelazo, „Odblokowuje ulepszenia terenu: Droga brukowana”, uwaga „+2 ruch, upgrade z Drogi”. Wiki nie podaje kosztu 25 ani handlu 3, więc status NIEROZSTRZYGNIĘTY zostaje, z poprawionym uzasadnieniem.
- 3 -> PRZYJMUJE. Pominięcia były błędnie oznaczone jako NIEZGODNE, sprzecznie z §3. Po korekcie: NIEZGODNE (konflikt wartości/technologii) = 6 wpisów / 9 wierszy (bydło, fort, kopalnia ×4, posterunek, tarasy, wycinka). POMINIĘCIA = 8 wpisów (farma, glinianka, irygacja, lama, lodzie_rybackie, oboz_lowiecki, owce, warzelnia_soli). ZGODNE = 1 (droga). Dodano legendę dla POMINIĘCIA.
- 4 -> PRZYJMUJE. Plik istnieje w commicie `cff7a5e9` (2026-10-21 08:16:12, „Mid-flight checkpoint”, autor „Claude”). Notatka „brak commita” była błędna. Operator nie wykonywał `git commit`; ustalenie, kto wykonał commit, należy do orkiestratora. Pin `edb8fb56` nie jest przodkiem HEAD `claude/sprawdzenie-funkcjonalnosci-ek4ra0` ani `rust-port/parity-v2`. Odczyty szły przez `git show edb8fb56:…`, więc dane są niezależne od gałęzi.
- 5 -> PRZYJMUJE. Pole `wycinka.praca_per_tura: 50` ma nazwę „praca”, ale kod (`gra/src/main.ts:35274`, komentarz „kredytuje DREWNO”) i `warunek` mówią o drewnie. `gra/src/game/improvement-tech.ts:97` mapuje to pole na `pracaPerTura` z domyślną wartością 20. Niezgodność nazwy odnotowana w wierszu 15 jako ryzyko dla mapowania w P2.9.
- 6 -> PRZYJMUJE. Podsumowanie w zleceniu podało 9, co było błędne. Wpisów z jakimkolwiek pominiętym bonusem danych jest 11: 8 POMINIĘCIA plus bydło (handel 3), kopalnie ×4 (handel 5/10) i tarasy (praca 2, handel 2). Dopisano to do §2 pliku.

ZMIANY-COMMIT: zmieniono tylko `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-ULEPSZENIA.md` (w allowliście; `git diff --check` czysty, 22 dodane / 20 usuniętych linii). Brak commita i brak zmian w `gra/**`. Notatka `01-operator.md` z rundy 1 nie była zmieniana.
TESTY: brak testów. Dane odczytano z `git show edb8fb56:gra/data/terrain-improvements.json` i `gra/src/data/wikiBundle.json`, parsowanie przez `python3 -I`. Sprawdzono też `improvement-tech.ts:46-47` (posterunek: Obróbka drewna + Murarstwo) oraz `main.ts:35274`.
BLOKADY: NIEROZSTRZYGNIĘTE pozostają: `stadnina` (brak hasła wiki; pełny tekst 169 wpisów bez wzmianki), `droga_brukowana` (hasło tylko w Technologiach, bez liczb), `surowiec_ilosc_tura` (wiki nie podaje wartości), nazewnictwo „złoto” vs „pieniądz” (oboz_lowiecki, warzelnia_soli).
RUNDY: 2/5 (runda 1 była Operatorem, runda 2 to obrona po Evaluatorze)
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje korektę P1-16F, zwłaszcza §2, wiersz 15 i wiersz droga_brukowana. Orkiestrator ustala autora commita `cff7a5e9`.
DEPLOY/PUSH: NIE WYKONANO
STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-RECAPTURE-Q1 (tag CAPRECAP), runda obrony 1 (Operator HAIKU 5.5)
GOAL: zmierzyć ścieżki odzyskania zbuntowanej stolicy AI i naprawić tylko po odtworzeniu błędu.
ZMIANY/COMMIT: gra/tools/capital-recapture-stale-designation-test.cjs (przepisany: kotwice w main.ts, asercje PASS/FAIL, scenariusze S1-AI, S1-GRACZ, KONTROLA, S2, S3, S4, S5 jako NIE-ZMIERZONO, kod wyjścia 1 przy FAIL, sprzątanie plików tymczasowych w finally, bez ścieżek poza gra/tools); dyspozycje/analizy/STOLICA-ODBICIE-PO-BUNCIE-2026-11-27.md (przepisana); ten raport. Zero zmian gra/src i gra/data. SHA: czubek gałęzi po commicie (patrz odpowiedź Operatora).
TESTY:
- Narzędzie z ESBUILD_DIR=/home/user/The-Game/.claude/worktrees/wf_7bd17cba-d6c-2/gra/node_modules/esbuild (esbuild nie ma w worktree): kod wyjścia 1, PASS=7 FAIL=4 NIE-ZMIERZONO=1.
  Surowy wynik (skrót tabeli):
  - S1-AI po buncie efektywna stolica: city1 = city1 PASS
  - S1-AI odbicie faktycznej stolicy: oczekiwano przejecie_stolicy, wynik null FAIL
  - S1-GRACZ efektywna stolica gracza po buncie: city5 = city5 PASS
  - S1-GRACZ zdobycie faktycznej stolicy gracza: oczekiwano przejecie_stolicy, wynik null FAIL
  - KONTROLA wpis wyczyszczony: przejecie_stolicy PASS
  - S2 odzyskana stolica: city2 = city2 PASS (stan obecny)
  - S3 efektywna stolica AI po cesji: city1 = city1 PASS
  - S3 atak na faktyczną stolicę po cesji: oczekiwano przejecie_stolicy, wynik null FAIL
  - S4 efektywna stolica AI po dwóch buntach: city3 = city3 PASS
  - S4 atak na trzecie miasto: oczekiwano przejecie_stolicy, wynik null FAIL
  - S5 round-trip zapisu: NIE ZMIERZONO
  - kotwice repliki w main.ts: obecne PASS
- Bramki z dispatchu (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, capital-capture-test, society-breakdown, ai-city-rebellion-gate, wiring): NIE URUCHAMIANO. Powód: brak zmian gra/src; poprawka nie wdrożona (patrz BLOKADY).
- Pomiar live S1–S5 (Chromium, Trudny, Wysoki x4, kultura i dyplomacja trudne, seedy 4242 i 7, min. 3 konfiguracje): NIE ZMIERZONO. Powód: w tej rundzie nie zbudowano wersji live (brak node_modules w worktree, build vite w /tmp nie uruchomiony) i nie ma istniejącego scenariusza zdobycia stolicy armią (caprebel2-live.cjs robi cesję hakiem).
- Mennica/efekty stolicy po przejęciu, round-trip zapisu (S5), częstość występowania w rozgrywce: NIE ZMIERZONO.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. Pomiar live S1–S5 nie wykonany: PRZYJMUJĘ. Pomiar live NIE wykonany w tej rundzie (powód wyżej). Kryterium binarne dispatchu nie jest spełnione.
2. Narzędzie replikuje resolver, brak asercji, rc=0: PRZYJMUJĘ. Dodano asercje PASS/FAIL, kod wyjścia 1 przy FAIL, kotwice sprawdzające, że replikowane linie nadal są w main.ts, scenariusze S1-GRACZ, S3, S4. Replika nadal dotyczy dwóch funkcji (capitalCityIdForOwner, odczyt surowego wpisu); kryterium wasCapitalOfOldOwner działa na kodzie modułu. Test S1 nie jest już „zielony przez replikę”: oczekuje przejecie_stolicy i dziś zwraca FAIL.
3. Warunek wystąpienia wpisu nieuzasadniony; brak przypadku gracza: PRZYJMUJĘ. Dodano w analizie §2 tabelę miejsc zapisu wpisu (40379 relokacja AI przy zagrożeniu, wywołanie 49013; 40316 ustawienie stolicy gracza; 40797 sukcesja; 32057 hak testowy) i stwierdzenie, że start gry nie zapisuje wpisu. Dodano scenariusz S1-GRACZ (FAIL odtworzony). Częstość w rozgrywce NIE ZMIERZONO.
4. Zakres poprawki tylko dla buntu i cesji; brak podboju/aneksji i oceny S2: PRZYJMUJĘ. Analiza §4 opisuje wszystkie miejsca zmiany ownerId miasta. Podbój w walce (19160, 41565) wywołuje plunder; aneksja państwa-miasta (40447) nie zostawia stale wpisu dla tego samego właściciela (wpis kasowany przy eliminacji, 40584, NIE ZMIERZONO przy aneksji). S2 oznaczone jako pytanie do właściciela (§7).
5. Pliki tymczasowe i numer linii: PRZYJMUJĘ. Sprzątanie w finally (także po błędzie buildu). Numer linii poprawiony: runCapitalCapturePlunder to 40736 (wcześniej 40744), wasCapitalOfOldOwner capital-capture.ts:102, designatedCapitalId 40764.

DECYZJA NIE PODJĘTA W TEJ RUNDZIE: poprawka w gra/src/main.ts (czyszczenie wpisu stolicy przy zmianie właściciela miasta) NIE wdrożona. Powody: (a) dispatch wymaga odtworzenia błędu live przed poprawką, a pomiar live nie wykonany; (b) poprawka zmienia zachowanie gry (przejęcie faktycznej stolicy zacznie uruchamiać plunder i sukcesję), więc to decyzja o grze, do pytania właściciela wg zasad ABC, nie decyzja inżynierska.

BLOKADY: (1) pomiar live S1–S5 nie wykonany; (2) pytanie o zamierzone skutki przejęcia stolicy (plunder/sukcesja), cesji stolicy i powrotu stolicy po odzyskaniu miasta (S2) — do właściciela, jednozdaniowy DECISION_REQUIRED: „Czy przejęcie faktycznej stolicy AI/gracza po buncie ma uruchamiać plunder skarbca i sukcesję stolicy (obecnie nie uruchamia)?”.
RUNDY: 1/5 (runda obrony)
NASTĘPNY KROK: (a) decyzja właściciela o plunderze i sukcesji po przejęciu faktycznej stolicy (A tak / B nie); (b) osobny temat live z odtworzeniem zdobycia stolicy armią (Trudny, Wysoki x4, seedy 4242 i 7, min. 3 konfiguracje, S1–S5) i wynikiem PASS/FAIL w tabeli; (c) po decyzji: poprawka §5 analizy, regresja w narzędziu z mutacją czerwoną, bramki z dispatchu.
UWAGI-DLA-ORKIESTRATORA:
- Evaluator r1 (commit 9e75855a0) nie jest w tym worktree; zarzuty wzięto z dispatchu obrony.
- ESBUILD_DIR wskazuje na node_modules innego worktree (wf_7bd17cba-d6c-2) — tylko do uruchomienia narzędzia, bez zapisu tam.
- Rozjazd w kodzie potwierdzony na module; skutek w grze (np. brak plunderu przy odbiciu stolicy) pozostaje do potwierdzenia live.
- Nie wykonano żadnego spawn_task, create_session ani run_in_background.
DEPLOY/PUSH: NIE WYKONANO

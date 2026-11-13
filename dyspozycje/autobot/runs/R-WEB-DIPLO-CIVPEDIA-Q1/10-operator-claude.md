# R-WEB-DIPLO-CIVPEDIA-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (dokumentacja + generowany bundle + test wartości; kod gry bez zmian)
TEMAT: R-WEB-DIPLO-CIVPEDIA-Q1
GOAL: Encyklopedia (Civpedia) i poradnik gracza opisują dyplomację (zaufanie, respekt, relacja, wiarygodność, Moc i jej podział na wojskowy i gospodarczy, wypowiadanie wojny, rozejm, pokój, zmęczenie wojną) z parametrami, plusami i minusami. Obecny stan gry zweryfikowany w kodzie; zasady zatwierdzone a niewdrożone oznaczone osobno.
BAZA: d09df3e0b (origin/main), worktree wf_b1a0e0f2-9c6-1, detached HEAD.

## ZMIANY / COMMIT
Allowlista zachowana (docs/encyklopedia/pojecia/*.md, docs/encyklopedia/indeks.md, docs/PORADNIK-GRACZA/12-dyplomacja.md, gra/src/data/wikiBundle.json regenerowany skryptem, nowy gra/tools/diplo-civpedia-values-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-CIVPEDIA-Q1/**). Kod gry (gra/src/**/*.ts poza wikiBundle.json), JSON balansu i WERSJE.md nie zmienione.

Nowe hasła (docs/encyklopedia/pojecia/):
- zaufanie.md (tabela zmian na turę, zdarzenia jednorazowe, progi umów, start 20)
- respekt.md (start 30, źródła zmian, progi wasalizacji 70 i wchłonięcia 90)
- relacja.md (etykiety i progi 30/45/60/120, progi paktu/sojuszu/handlu)
- moc-podzial.md (składniki Power i podział wojskowy/gospodarczy)
- wypowiedzenie-wojny.md (progWojnyRelacji, hamulec relacji, bramki epok)
- rozejm-pokoj.md (rozejm 5/10/15, domyślnie 10; progi AI proponującej pokój)
- zmeczenie-wojna.md (wzór poziomu, progi 0,5/0,8, stopnie przegrywającego, ochrona)

Zmieniona hasła: wiarygodnosc.md (dodane Plusy/minusy i Parametry; poprawiony próg paktu o nieagresji z −40 na 0 wg kodu), indeks.md (sekcja Dyplomacja), 12-dyplomacja.md (odsyłacze do haseł i ostrzeżenie o sekcjach niewdrożonych).

Każde hasło z zasadami niewdrożonymi ma blok „DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku”.

Commit: SHA podany w polu sha odpowiedzi orkiestratora (commit na detached HEAD, bez push).

## TESTY
- node gra/tools/diplo-civpedia-values-test.cjs → PASS: 41 sprawdzeń, 136 wierszy parametrów w 8 hasłach. Test czyta gra/data/diplomacy.json, diplomacy-war-peace-params.json, war-weariness-params.json, power-params.json, war-rules-params.json oraz wartości z gra/src/game/*.ts (progi etykiet, truce, współczynniki Power). Samo-test mutacji: zmiana liczby startZaufanie w haśle jest wykrywana.
- Przed poprawkami test wykrył 2 realne rozbieżności w haśle zaufanie.md (handel_zaufanie_perTura: hasło 2 vs JSON 1; karaPrzemarszNieautoryzowany: znak). Obie poprawione w haśle.
- node gra/tools/admin-panstwo-panel-names-test.cjs → 26 pass, 0 fail (po npm ci --ignore-scripts w gra/; node_modules usunięty po teście).
- npx tsc --noEmit (gra/) → exit 0.
- node gra/tools/logic-test.cjs → LOGIC OK (213/213).
- node gra/tools/bundle-wiki-for-game.cjs → 22 rozdz. + 181 haseł; wszystkie 8 haseł obecnych w wikiBundle.json. Diff wikiBundle.json: linia JSON (zawiera pole generated z czasem skryptu).
- git diff --check → czysto.
- Nie uruchamiano npm run build/dev (zakaz). Nie uruchamiano testów w przeglądarce (dokumentacja).

## BLOKADY / ROZBIEŻNOŚCI (kod wygrywa wg dodatku; do decyzji orkiestratora)
1. Dobra wola po wymianie: dodatek 5 tur; diplomacy.json `dobra_wola_tur` = 3. Hasło podaje 3. (zaufanie.md)
2. Cena pokoju w czasie zmęczenia: dodatek „obniża cenę do 60%”; war-weariness-params.json `czlowiek.rabatCenyPokojuMax` = 0,6, czyli cena spada do 40% (wzór czynnik = 1 − 0,6·…). Hasło podaje wartość z pliku. (zmeczenie-wojna.md)
3. Pakt o nieagresji — wymóg wiarygodności: stary tekst wiarygodnosc.md podawał W ≥ −40; kod (diplomacy-proposals.ts:1153, params.wiarygodnoscProgNapMin = 0) wymaga W ≥ 0. Poprawione w haśle. Stary zapis „−40” to był błąd dokumentacji.
4. Opisy akcji w diplomacy.json (sekcja akcji dyplomatycznych, ok. linii 234–259) podają „Złamanie paktu: −30 Relacja, −20 Zaufanie”, „Wypowiedzenie sojuszu: −25 Relacja, −20 Zaufanie”, „Zerwanie handlu: −15 Relacja, −10 Zaufanie”. Parametry: zlamanaPaktGracz_zaufanie = −40, zerwanie_traktatu = −15 Zaufania (kod). Tekst w JSON jest niespójny z parametrami — NIE poprawiane (diplomacy.json poza allowlistą). Do decyzji.
5. Liczby przesłanek AI do wypowiedzenia wojny z dodatku (siła względna ≥ 0,6, agresja ≥ 0,5, relacja poniżej 30) — NIE_ZMIERZONO w tej rundzie; hasło wypowiedzenie-wojny.md podaje tylko wartości zweryfikowane (progWojnyRelacji, hamulecRelacji, delayInterCivWarsUntilTurn 40).
6. Warunek kary za sąsiedztwo „>2 miasta obu stron i wspólna granica” z dodatku — w kodzie nie znaleziono w tej rundzie (karaWspolnaGranica przekazywana z kontekstu); NIE_ZMIERZONO.
7. Próg +15 Respektu „przy 50% przewadze” (lista zadań #328) — w JSON jest tylko wartość 15 (przewagaMilitarna_respekt); próg nie zweryfikowany. Hasło respekt.md mówi „próg w kodzie”.
8. Zasady niewdrożone (siła militarna, rozejm po pokoju 10/20, kara sąsiedztwa −3/−4/−5, religia, progi etykiet 10/30) są opisane jako zatwierdzone a niewdrożone; nie są w grze.
9. Pełne plik:linia dla każdej liczby w kodzie: NIE_ZMIERZONO — tabela Parametry podaje plik:klucz JSON lub identyfikator `kod:` z testu; numery linii nie zostały wygenerowane.

## RUNDY
1/5 (pierwsza runda Operatora).

## NASTĘPNY KROK
Evaluator (Sonnet) weryfikuje: (a) każdą liczbę w hasłach względem plików (test + ręczny przegląd tabel), (b) rozbieżności 1–4 z sekcji BLOKADY, (c) czy blok „Zasady niewdrożone” nie został pomylony z obecnym stanem. Decyzja orkiestratora o rozbieżności 4 (opisy w diplomacy.json) i o terminologii religii przed FC.

DEPLOY/PUSH: NIE WYKONANO

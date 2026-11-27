STATUS: PASS-WITH-NOTES
DOMAIN: GAME (integralność zapisu — diagnoza, zero zmian gry)
TEMAT: R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST), obrona Operatora, runda 2
GOAL: ustalić, co dokładnie różni się w digeście po wczytaniu zapisu, i czy to błąd integralności. Zero zmian gra/src i gra/data.
BAZA: 5ea1cc362 (origin/main); kandydat do obrony: 5069d00f9.

ZMIANY/COMMIT: commit obrony (czubek pracy w polu sha). Pliki:
- gra/tools/savedigest-run.cjs: opcja `--bunt 1` (bunt pierwszej stolicy AI w pierwszej turze po zapisie, `forceRevoltEligible` jak w caprebel2-live.cjs); zmienna `PW_PATH` (katalog playwright; w tej sesji brak go w gra/node_modules).
- dyspozycje/analizy/ZAPIS-DIGEST-ROZNICA-2026-11-27.md: przepisane (tabela pokrycia 4/4, wyniki aionly A/B i max+bunt, poprawiona liczba miast, wniosek bez słowa „realny błąd integralności”).
- dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/dane/: nowe pliki aionly-A/B.json, maxbunt-A/B.json, diffy aionly-A-vs-B-turn4/6, maxbunt-A-vs-B-turn4/6 (łącznie ok. 80 KB w katalogu dane).
- dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/30-obrona-claude.md (ten raport).
Zero zmian w gra/src, gra/data, WERSJE.md, manifestach, rust-port.

ODPOWIEDŹ NA ZARZUTY (z raportu Evaluatora 8730bf180):

ZARZUT 1 (brak konfiguracji iii i trybu A/B dla aionly): PRZYJĘTE i POPRAWIONE.
- (iii) max + bunt stolicy AI: zmierzone A/B K=3 (bunt w turze 4). Dowód: dane/maxbunt-A.json i maxbunt-B.json; t4 len 43530 (A) vs 46300 (B), fnv 9332158c vs f1a2a9f (pełne rekordy w json); t5 45465 vs 48277; t6 46811 vs 49913; nU t6 65 vs 66. Restore vs snap (t3): snap len 41659 → restore 44389 (+2730); po odfiltrowaniu 3 pól domyślnych 0 innych różnic (126 wpisów = 42 miasta × 3 pola).
- aionly A/B K=3: dane/aionly-A.json i aionly-B.json; t4 len 43495 vs 46235; t5 45344 vs 48154; t6 46475 vs 49561; nU t6 64 vs 65. Restore vs snap po odfiltrowaniu: identyczny (0 innych różnic).
- Konfiguracje z pomiarem digestu, diffem i klasyfikacją: 4 z 4 (i default A/B, ii max rt+A/B, iii max+bunt A/B, iv aionly rt+A/B). Kryterium „≥4 konfiguracje” spełnione w tej rundzie, każda jako jedna para (seed 4242).
- Tabelka wiersza „AIONLY-AB-WYNIK” w doc była placeholderem; zastąpiona wynikiem.

ZARZUT 2 (wniosek „realny błąd integralności” zbyt mocny): PRZYJĘTE.
- Wniosek w doc: „reprodukowalna rozbieżność przebiegu, przyczyna NIEZNANA”. Nie nazywamy tego błędem integralności ani jego braku. Dowód: B ≠ A w 4/4 konfiguracjach, od tury 4, ale jedno ziarno i jeden punkt zapisu.
- Pozostaje w mocy, że restore w miejscu zapisu jest zgodny po odfiltrowaniu 3 pól domyślnych (4/4).

ZARZUT 3 (42 vs 43 miast): PRZYJĘTE i ZWERYFIKOWANE na pełnym zrzucie.
- max/rt.json.pre.full: 43 miasta; 42 bez trzech pól (city1–city42), 1 z polami przed zapisem: city0 (Rzym, stolica gracza). Po wczytaniu 43/43 mają pola. Wyjaśnienie 2730 = 42 × 65 jest poprawne.

ZARZUT 4 (rozmiar dodanego klucza i top-10): PRZYJĘTE jako ograniczenie, poprawione częściowo.
- Rozmiar wpisu liczy już nazwę klucza i wartość (`"postepBudynkowUsuniete":{}` = 27 znaków; test w doc). Nowe diffy zapisane z `--top 40`; pełna lista niedomyślnych różnic sprawdzona z `--top 2000`: w turze 4 dla obu nowych konfiguracji 6 wpisów niedomyślnych (city16, city25, city17, city26), reszta to wpisy domyślne. Opisane w sekcji Ograniczenia.

WYNIKI (liczby z surowego wyjścia runnera i diffu):
- Restore vs zapis, po odfiltrowaniu 3 pól domyślnych: identyczny w 4/4 konfiguracjach.
- B ≠ A od tury 4 w 4/4 konfiguracjach; rozbieżne pola: wealthState.pula i surowce.drewno city16/city25, surowce.drewno city17, manpower city26; w turze 6 dodatkowo rozjeżdża się skład jednostek (aionly 64 vs 65, max+bunt 65 vs 66).
- Klasyfikacja: różnica surowa = (b) reprezentacja (3 pola domyślne, 2730 znaków); różnica przebiegu = przyczyna nieznana.

TESTY:
- node --check gra/tools/savedigest-run.cjs: OK.
- Build live (bez npm run build): z poprzedniej rundy, bundle w scratchpad/savedigest/dist (15 045 104 B index.html), nie w repo.
- Runy (pageErrors = 0 w każdym): aionly A (3 tury + zapis), aionly B, max+bunt A, max+bunt B; każdy ok. 3–4 min.
- tsc, logic 213, ai-test 297/0: NIE URUCHAMIANO w tej rundzie (brak zmian w gra/src; bramki gry nie zależą od tooling tools/).

BLOKADY:
- Przyczyna B ≠ A (przebieg po wczytaniu) NIEZNANA. Hipotezy w doc (pole stolic AI nie trafia do zapisu / kolejność Map/Set / cache planera AI poza digestem).
- Test B==A na jednym ziarnie i jednym punkcie zapisu. Brak drugiego ziarna i punktu zapisu.
- Bieg (iii) z buntem w turze 4, a nie w turze 1 jak w CAPREBEL2; liczba 6930 z CAPREBEL2 nie została odtworzona tym runnerem.
- Zasada testowania na maksimum: maksimum przyjęte wg CAPREBEL2 (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny, flagi ON). Nie ma wyższego poziomu dla tych pól.

RUNDY: 2/5 (runda 1: diagnoza, runda 2: obrona)
NASTĘPNY KROK: osobny temat (nie ten): odtworzyć B ≠ A minimalnie w tym runnerze (seed 4242, default lub aionly, zapis po turze 3, wczytanie, tura 4), porównać strukturę stolic AI city16/city25 przed/po wczytaniu, zidentyfikować pole, które nie trafia do zapisu lub zależy od kolejności, dopiero potem poprawka w gra/src. Dodatkowo: drugie ziarno (np. 7) i drugi punkt zapisu, żeby potwierdzić reprodukowalność.
UWAGI-DLA-ORKIESTRATORA:
- Runner nie ma zależności od gra/node_modules w tej worktree (node_modules to dowiązanie do innej worktree, bez playwright); użyto PW_PATH=/opt/node-tools/node_modules/playwright. Nie tworzono dowiązań w środowisku.
- Pliki scratchpad/savedigest (dist, A/B) są poza repo i można je usunąć po integracji (dist ~104 MB).
- DECISION_REQUIRED: brak (naprawa techniczna po wskazaniu przyczyny, bez pytania do właściciela).
DEPLOY/PUSH: NIE WYKONANO

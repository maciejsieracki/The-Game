STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1
GOAL: w oknach 1280x800 i 1366x768 blok machin w panelu oblezenia mniejszy i mieszczacy sie w widocznej tresci panelu dla 1/2/4 typow, bez zmiany logiki budowy machin (zawezone ZAL-1: blok w calosci widoczny po przewinieciu tresci panelu do dolu).
ZMIANY/COMMIT: kandydat/integracja = 1ea7f8bb708ea6b5d81053a9bfcf009129bb8a87 (potomek bazy fab9a9b75: TAK, git merge-base --is-ancestor). Diff vs baza: gra/src/ui/siegeMapPanel.ts (CSS + komorki siatki), gra/tools/siege-panel-machines-block-fit-test.cjs (nowy), runs/<ID>/** (10-operator, 30-obrona, 3 PNG). Poza allowlista: brak. Logika budowy machin bez zmian (tylko DOM/CSS + tytul przycisku).

TESTY (surowe wyjscia, wlasne uruchomienie FC):
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6 — wszystkie exit 0 na kandydacie (kod gry zmieniony tylko w siegeMapPanel.ts; brak czerwonych, wiec porownanie z baza zbedne).
- git diff --check fab9a9b75..1ea7f8bb7: czysty. node --check testu: OK (test uruchomiony).
- Chromium przez serwer HTTP (vite build do scratchpad, exit 0): siege-panel-machines-block-fit-test na KANDYDACIE: verdict PASS 6/6. Wysokosc bloku machin 106/119/186 px (1/2/4 typy), widoczna tresc panelu 284 px (1280x800) i 252 px (1366x768), blok.bottom 473 <= dock.top 497 (1280x800), 441 <= 465 (1366x768), 3 przyciski akcji klikalne i nad dolnym paskiem.
- Dowod mutacyjny (baza fab9a9b75, ten sam test): verdict FAIL; 1 i 2 typy PASS, 4 typy FAIL w obu oknach (blok 274 px; "w calosci widoczny" i "nie wyzszy niz widoczna tresc" = false). Po poprawce 274 -> 186 px dla 4 typow. Czerwony na bazie, zielony po poprawce.
- Zrzut after-1280x800-types4.png obejrzany Readem: blok "Zbuduj machine w oblezeniu" jako siatka 2x2 z krotkimi kartami i powodem pod kazda, pod nim "Potwierdz dzialanie" z 3 przyciskami (Oblegaj/Szturm/Odwrot) w calosci, dolny pasek komunikatu niezaslonięty. Brak przyciecia.

ZARZUTY:
1. "bez wewnetrznego przewijania" niespelnione doslownie przy scrollTop=0: DO DECYZJI CZLOWIEKA (ABC nizej), nie blokuje. Blok sam nie ma przewijania (blockOwnOverflow=false); przewija sie istniejaca tresc panelu (.civ-smp-body: 420/432/499 px tresci przy 284 px widocznych; tresc nad blokiem ok. 289 px = stan oblezenia + kolejka), czego allowlista i decyzja wlasciciela nr 6 ("zwezic blok machin") nie obejmuja. Wariant doslowny wymaga przebudowy gornej czesci panelu (osobny temat). Dla 4 typow blok spadl z 274 do 186 px.
2. Brak twardej asercji scrollTop=0: ODDAL. Przy obecnym kodzie bylaby czerwona 6/6 z konstrukcji (blockTop 502 > bodyBottom 497/465); pomiar informacyjny _probeTop jest w tescie. Twarda asercje dodac po decyzji ABC wariant B.
Zaden zarzut nie wymaga NAPRAW => brak FAIL.

PYTANIE ABC DO WLASCICIELA (zadaje orkiestrator w glownym czacie):
Blok machin jest zwarty i w calosci widoczny po przewinieciu panelu do dolu, ale przy otwarciu panelu (bez przewijania) pierwszy ekran konczy sie nad blokiem — trzeba przewinac tresc panelu o ok. 50-100 px.
A (rekomendowane) — zaakceptowac stan obecny: blok zwarty, przewijana jak dotad tresc panelu; zamknac temat.
B — wymagac, by blok byl widoczny od razu bez przewijania (przebudowa sekcji stanu i kolejki nad blokiem, np. zwiniecie "Machiny warsztatowe z zapisu" i skrot tekstu oblezenia); osobny temat + twarda asercja scrollTop=0.
C — przeniesc blok machin nad sekcje stanu (machiny pierwsze), bez zmiany wysokosci; osobny temat.

BLOKADY: brak.
RUNDY: FC 1/5; Evaluator PASS-WITH-NOTES, Obrona PASS-WITH-NOTES.
NASTEPNY KROK: integracja orkiestratora 1ea7f8bb7 (baza fab9a9b75 jest przodkiem) + pytanie ABC (A/B/C) do wlasciciela; deploy ROBOCZA po integracji.
UWAGI-DLA-ORKIESTRATORA: (a) 00-dispatch.md nie istnieje w origin/main (tylko DODATEK na galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0). (b) W tescie zduplikowany klucz blockBottom w obiekcie (nieszkodliwe, kosmetyka). Nie zakladano sesji/zadan.
DEPLOY/PUSH: NIE WYKONANO

TEMAT: P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: plik(i) reguł kwalifikacji ulepszeń terenu odpowiedzialne za blokadę Stadniny w lesie
(recon: znajdź dokładny warunek dziś blokujący `surowiecOdblokowany='kon'` w lesie i porównaj z
wzorcem Glinianki)
MODEL+EFFORT: claude-sonnet-5, effort high (zmiana reguły kwalifikacji terenu — wymaga
precyzyjnego odróżnienia "budowa" od "trwałość po usunięciu lasu")

WYZWALACZ (ECHO właściciela, 2026-09-03, dosłowna odpowiedź)
"Stadnina, w przeciwieństwie do wyżej wymienionych [owiec/bydła/lam], jest ulepszeniem
surowcowym, więc nie może podlegać takim samym zasadom jak owce, bydło i lamy, tylko takim jak
tartak czy kopalnie. Jeżeli symbol konia jest na lesie, to nie przeszkadza w tym, żeby tam
postawić stadninę. Potem można usunąć las i to też nie powinno usuwać stadniny. Stadnina jest
niezależna od lasu, jest tak samo czymś takim samym jak na przykład glinianka."

RECON WYMAGANY (Operator musi wykonać, orkiestrator NIE zrobił reconu kodu dla tego tematu —
tylko zebrał wypowiedź właściciela)
- Znajdź dokładny warunek dziś zabraniający budowy Stadniny (`surowiecOdblokowany='kon'`) na
  heksie z lasem — to jest "efekt uboczny reguły z 2026-07-29" wg wcześniejszego zgłoszenia
  właściciela (reguła ta wprost wymieniała tylko owce/bydło/lamy jako pastwiska podlegające
  regule las-blokuje-budowę/las-znika-po-budowie).
- Znajdź dokładny wzorzec Glinianki (i/lub Tartaku/Kopalni) — jak dziś działa kwalifikacja
  budowy tych ulepszeń na heksie z lasem (czy las w ogóle jest brany pod uwagę, czy te budynki
  są całkowicie niezależne od obecności lasu na heksie) I jak zachowuje się usunięcie lasu
  spod już postawionego budynku surowcowego (czy budynek przetrwa — właściciel wprost oczekuje
  że TAK, analogicznie do Glinianki).
- Sprawdź czy istnieje wspólna reguła/funkcja klasyfikująca ulepszenia na "pastwiska" (owce/
  bydło/lamy, podlegające regule lasu z 07-29) vs "surowcowe" (Glinianka/Tartak/Kopalnia,
  niezależne od lasu) — jeśli tak, dołącz Stadninę do drugiej grupy przez tę samą klasyfikację,
  nie przez nowy, osobny warunek.

GOAL
1. Stadnina (`surowiecOdblokowany='kon'`) MA być budowalna na heksie z lasem — obecność symbolu
   konia na zalesionym heksie NIE MA blokować budowy, dokładnie jak dla Glinianki/Tartaku/
   Kopalni.
2. Stadnina MA być NIEZALEŻNA od obecności lasu po zbudowaniu — jeśli las zostanie później
   usunięty (wyrąb, dowolny mechanizm), Stadnina MA POZOSTAĆ (nie zostaje usunięta razem z
   lasem, w przeciwieństwie do reguły dla farm z `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1`/
   `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`, która dotyczy WYŁĄCZNIE farm).
3. Dołącz Stadninę do TEJ SAMEJ klasyfikacji/mechanizmu co Glinianka (lub analogiczny budynek
   surowcowy), NIE twórz nowego, osobnego warunku, jeśli istniejący wzorzec da się bezpośrednio
   zastosować.
4. Zero zmian w regule dla owiec/bydła/lam (te MAJĄ pozostać "pastwiskami" podlegającymi
   dzisiejszej regule lasu z 2026-07-29 — właściciel wprost odróżnia Stadninę od tej grupy).
5. Zero zmian w regule dla farm (`R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`, osobny,
   zintegrowany temat).

KRYTERIA KOŃCA (binarne)
1. Test: żywe/symulowane sprawdzenie kwalifikacji budowy — heks Łąka/Równina z lasem i
   `surowiecOdblokowany='kon'` — Stadnina JEST dostępna do budowy (kwalifikuje się), tam gdzie
   dziś jest zablokowana.
2. Test: po zbudowaniu Stadniny na zalesionym heksie i USUNIĘCIU lasu (dowolnym mechanizmem gry)
   — Stadnina POZOSTAJE, nie znika.
3. Test regresyjny: owce/bydło/lamy — zachowanie IDENTYCZNE jak dziś (nadal podlegają regule
   lasu z 07-29, zero zmian).
4. Test regresyjny: farmy — zachowanie IDENTYCZNE jak dziś (`R-ULEPSZENIA-FARMA-LESIE-USUN-
   ISTNIEJACE-Q1` nietknięty).
5. Zero regresji na istniejących testach ulepszeń/kwalifikacji terenu (znajdź reconem, m.in.
   `map-improvement-qualify-test.cjs`, `hodowla-las-test.cjs`, `farma-nie-w-lesie-test.cjs`).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- Plik(i) reguł kwalifikacji ulepszeń terenu zidentyfikowane reconem (prawdopodobnie
  `gra/src/game/` lub `gra/src/map/` — Operator ma wskazać dokładną ścieżkę w raporcie PRZED
  edycją, jeśli nie jest jednoznaczna z pierwszego reconu).
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana reguły dla
owiec/bydła/lam, zmiana reguły dla farm (`R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`).

IZOLACJA
worktree /home/user/wt-stadnina-las, gałąź autobot/P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1, baza
jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-stadnina-las --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2 (przetrwanie po usunięciu lasu) za spełnione bez żywego testu
usuwającego las spod już postawionej Stadniny i sprawdzającego stan PO — nie zakładać z samej
lektury warunku budowy, że warunek trwałości po fakcie zachowuje się tak samo. Zakaz założenia
dokładnego pliku/funkcji odpowiedzialnej za blokadę bez faktycznego reconu w kodzie — jeśli
orkiestrator nie wskazał dokładnej ścieżki, znajdź ją sam przed edycją.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.

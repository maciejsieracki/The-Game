STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-HILLS-CLEAR-REVERT-Q1
GOAL: Cofnięcie wyjątku Wzgórz w `wyrabMaSens` (decyzja właściciela ABC 2026-11-05, odp. B): wycinka lasu pod żywność tylko tam, gdzie powstanie farma (`isFarmBaseTerrain`, Łąka/Równina). Reszta SIMPLE-FOOD-RULE bez zmian.

ZMIANY/COMMIT: baza origin/main 37402ebe1 (detached). SHA commitu: patrz commit "fix(autoimprove): cofniecie wycinki lasu na Wzgorzach" (HEAD tego worktree).
- `gra/src/game/auto-improvements.ts`: usunięto `|| hx.terenBazowy === TerenBazowy.Wzgorza` z `wyrabMaSens`; komentarz zastąpiony uzasadnieniem rewertu; komunikat verdict E2 dopasowany ("teren nie jest baza pod farme").
- Testy (przypięta NOWA reguła, komentarze z uzasadnieniem): `simple-food-rule-no-toggles-test.cjs` (blok 3), `ai-food-only-worked-hexes-test.cjs` (sekcja H: 0 wycinek na Wzgórzach i Górach, AI i gracz), `autoimprove-stages-q1-test.cjs` (blok r5-wyrab: Wzgórza K1/K2/K3 bez wycinki; rzeka+las na Wzgórzach: wyrab NIE, tartak NIE).
- `chromium-r2-wzgorza.txt` to dowód historyczny SIMPLE-FOOD-RULE (nie plik wykonywalny) — nie ruszany.

TESTY (PRZED -> PO; logi gate-pre-*/gate-po-*.txt, każdy z jedną linią EXIT=):
- simple-food-rule-no-toggles: 38 OK/0 FAIL -> 36 OK/0 FAIL
- ai-food-only-worked-hexes: 70/0 -> 66/0
- auto-improve-q3: 41/0 -> 41/0
- autoclear-river-forest-priority: 16/0 -> 16/0
- autoimprove-irrigation-after-farms: 42/0 -> 42/0
- autoimprove-stages-q1: 302/0 -> 299/0 (pierwszy bieg PO przed aktualizacją testu: 297/5 FAIL — dokładnie 5 asercji pinujących starą regułę Wzgórz; log nadpisany zielonym po poprawce testu)
- tartak-oboz-wyscig-race: EXIT=0 -> EXIT=0
- sawmill-hill-relief: 8 assertions, EXIT=0 -> 8 assertions, EXIT=0
- tsc --noEmit: EXIT=0 (po npm ci --ignore-scripts; node_modules usunięte po pracy)
- Mutacja M1 (przywrócenie warunku Wzgórz w kopii src poza repo): simple-food-rule 2 FAIL, ai-food-only 2 FAIL, autoimprove-stages-q1 5 FAIL, wszystkie EXIT=1 (mut-M1-*.txt).
- NIE_ZMIERZONO: weryfikacja w przeglądarce (poza zakresem dispatchu; zmiana logiki automatu).
- Uwaga środowiskowa: w trakcie bramek PO jądro zabiło proces (wspólny limit pamięci); wszystkie bramki mają kompletny wynik i EXIT, autoimprove-stages-q1 powtórzony osobno: 299/0.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) tego samego ID; potem Final Control
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) AI, parametr
TEMAT: R-WEB-AI-PURCHASE-RESERVE-N10-Q1
GOAL: Normal = 10 tur rezerwy (decyzja wlasciciela), pomiar do T100, test pilnujacy 10/3/2.
ZMIANY/COMMIT: Operator 82bc19e86 (baza 529c66cf7). Diff do allowlisty zweryfikowany (git diff --name-only): gra/data/ai-params.json, gra/tools/ai-purchase-maintenance-reserve-test.cjs, katalog runu. Zero main.ts/ai.ts/gra-robocza/WERSJE.md/rust-port/render. git diff --check czysty. Easy 3, Hard 2, progi dochodu bez zmian.
TESTY (odtworzone przez FC, npm ci w worktree, node_modules usuniete): reserve-test 44/0; z wartoscia 3 dla Normal 40/4 (test pilnuje 10); logic-test 213/213; ai-test 274/20 (jak baza); tsc --noEmit exit 0. Pomiar live nie powtarzany (JSON + analiza.cjs w runie; wynik-analizy.txt spojny z analiza.cjs).

ROZSTRZYGNIECIE ZARZUTOW FC r0: wszystkie 6 -> ODDAL (naprawione w 82bc19e86: commit, pomiar, katalog runu, raport koncowy, testy odtworzone, allowlista).

ROZSTRZYGNIECIE DECISION_REQUIRED Operatora: ODDAL. Dispatch krok 3 definiuje degeneracje jako: AI bez armii, utrata stolicy bez walki, wojny przestaja sie toczyc. Dowod: zadna AI nie ma 0 wojsk po T40 (zeroMil puste w T60-T100; w T20/T40 tylko owner 10, tak samo w N=3 w T20), spadkow liczby miast brak w obu seriach, tury wojny 79 vs 79, skarbiec trwale dodatni. Warunek degeneracji niespelny -> wg dispatchu "zostaje 10". Wlasciciel juz zdecydowal 10 (ABC 2026-11-07); mniejsza sila wojskowa (T100 suma wojska 59 vs 172, -66%; zlota akumulowane 53k/36k vs 13.5k/12.9k) jest skutkiem tej decyzji, nie nowa decyzja.

NOTATKI DLA ORKIESTRATORA/WLASCICIELA (informacyjnie, nie blokuja):
- N=10 daje ok. 3x slabsza AI militarnie i nadmierna akumulacje zlota; jesli wlasciciel uzna to za niepozadane, to osobny temat (np. wartosc posrednia 5-6).
- Zastrzezenia pomiaru: jeden seed/mapa; barbarzyncy niezbadani; zniknieciae owner 10 (1 miasto) ok. T40 przy N=10 vs T60-80 przy N=3 - nie rozstrzygniete czy bez walki; baza bez reguly nie mierzona ponownie (odniesienie z poprzedniego tematu).

BLOKADY: brak
RUNDY: FC 1/5 (runda tematu 2)
SHA DO INTEGRACJI: patrz commit FC (nastepca 82bc19e86; zmiana wylacznie w tym pliku)
KOLEJNOSC: zmiany wylacznie w gra/ + dyspozycje/ - brak nakladania na rust-port/**; niezalezne od origin/rust-port/parity-v2 (wspolny przodek f4c89d008, parity-v2 = 783c6b766). Integrowac na bazie claude/aireserve2-fc (529c66cf7, zawiera regule w main.ts) - NIE na origin/main bez tej reguly; kolejnosc wzgledem parity-v2 dowolna.
NASTEPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

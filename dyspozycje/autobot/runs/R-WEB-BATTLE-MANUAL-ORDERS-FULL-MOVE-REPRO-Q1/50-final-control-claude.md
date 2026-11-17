# R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; kod gry nietkniety)
TEMAT: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1
GOAL: reprodukcja na poziomie sceny (AUTO / marsz do pola X / atak na cel, >=3 ziarna), tabela, klasyfikacja wzgledem decyzji A.
ZMIANY/COMMIT: kandydat 703cc4ca4dd5479479033630d2e7e6d2b9bd0f35 (potomek acc92b89e i bazy affc50fa4; 0218ac0d9 jest przodkiem). Diff vs affc50fa4: wylacznie 3 pliki gra/tools/battle-manual-orders-full-move-repro-* + 30-obrona-claude.md + evidence-summary.json — w allowliscie, zero zmian w gra/src, WERSJE.md, gra-robocza/, rust-port/. integration_sha = SHA commitu tego raportu (nad 703cc4ca4). Uwaga integracyjna: origin/main (c50b64e20) jest przed baza kandydata (merge-base = affc50fa4); pliki tematu sa nowe (0 kolizji nazw w main), wiec integracja przez merge/cherry-pick tylko tych plikow, NIE przez nadpisanie drzewa.
TESTY (zmierzone przeze mnie na 703cc4ca4, po npm ci): logic-test 213/213 exit 0; tech-tree-test 20 pass/0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6; tsc --noEmit exit 0; git diff --check czysto. Bramki niezalezne od zmiany (tylko tools) — bazowe czerwone nie dotyczy, brak potrzeby porownania z baza.
Niezalezny pomiar kontrolny (seed 1, Hastati 6 vs 6, Rownina, cap 8): AUTO — 0,62 heks/rundę, 1,48 heks/rundę z ruchem, 0,57 ciosu/rundę, 5 jednostko-rund ruch+cios (zgodne z tabela obrony, granice zakresow). RECZNY marsz — 1,00 heks/rundę z ruchem, ruch niewykorzystany 2 MP z MP 3, 0 jednostko-rund ruch+cios (zgodne; przebieg przekroczyl RM_MAX_MS=200000 przy 42/60 jednostko-rund — timedOut=true, zwiazane z wolnym headless, wartosci po stronie ruchu i tak zgodne). Weryfikacja kodu: battleScene.ts 6276 `if (!this._manualMode && ...)` — galaz doktryny pomijana w trybie recznym, jak podaje obrona.

ZARZUTY EVALUATORA:
1 (brak artefaktu) — ODDAL: artefakt istnieje (3 pliki, sonda uruchamialna).
2 (brak raportu) — ODDAL: 30-obrona-claude.md + evidence-summary.json zawieraja kontraktowy raport.
3 (brak pomiaru) — ODDAL: 9 przebiegow (3 tryby x ziarna 1-3) + moj kontrolny.
4 (brak tabeli/klasyfikacji) — ODDAL: tabela i klasyfikacja sa; czesc 1 ZGODNE z decyzja A, czesc 2 NIE_ROZSTRZYGNIETE.
5 (brak dowodu mutacyjnego) — ODDAL: temat pomiarowy bez poprawki kodu; sonda dyskryminuje AUTO vs reczny (potwierdzone moim pomiarem).
6 (bledny SHA) — ODDAL: fakt zaakceptowany, praca = acc92b89e/703cc4ca4.
Czesc 2 klasyfikacji (przepadek ~2 MP, brak kontynuacji po ciosie) — DO DECYZJI CZLOWIEKA (realna decyzja produktowa: opcje A/B/C w 30-obrona; rekomendacja obrony C).
Zadnego NAPRAW => nie FAIL.

BLOKADY: brak (pytanie ABC do wlasciciela, nie blokada techniczna).
NOTATKI (ograniczenia pomiaru, jawnie): jedna scena Hastati (MP 3), brak Wojownika ruch 4 i armii mieszanej; brak powtorzenia tego samego ziarna (determinizm niesprawdzony, ale moj seed 1 zgodzil sie z raportowanym zakresem); sonda omija doktryne obroncy przez przelaczenie _manualMode, speedMul 32; AUTO: ruch niewykorzystany NIE_ZMIERZONO; zachowanie live z UI NIE_ZMIERZONO.
UWAGI-DLA-ORKIESTRATORA: (1) pytanie ABC (czesc 2) do wlasciciela; (2) osobna weryfikacja live, czy tryb reczny z AI-przeciwnikiem domyka ture (galaz doktryny pomijana przy _manualMode=true dla obu stron, battleScene.ts ~6276) — NIE_ZMIERZONO w grze; (3) ewentualny pomiar Wojownika/armii mieszanej.
RUNDY: FC po rundzie 2/5.
NASTEPNY KROK: orkiestrator integruje pliki tematu, wpis w rejestrze, pytanie ABC; kod gry bez zmian.
DEPLOY/PUSH: NIE WYKONANO

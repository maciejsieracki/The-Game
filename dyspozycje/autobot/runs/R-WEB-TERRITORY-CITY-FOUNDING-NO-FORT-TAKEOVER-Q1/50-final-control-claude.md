STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-CITY-FOUNDING-NO-FORT-TAKEOVER-Q1
GOAL: zalozenie miasta nie przejmuje cudzych fortow/ulepszen; heks wlasnego fortu zostaje u wlasciciela; zdobycie fortu tylko silowo (wojna + jednostka wojskowa).
ZMIANY/COMMIT: kandydat 91573b398 (git merge-base --is-ancestor 1bc8ec66 91573b398 -> OK). Diff vs baza: fort-territory.ts, main.ts (tylko komentarz), map/territory.ts (POZA allowlista), 3 testy gra/tools, raporty runa. Brak zmian gra-robocza/WERSJE/rust-port.
TESTY (wlasne, surowe, na 91573b398; node_modules przez npm ci --ignore-scripts):
- tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
- city-founding-no-fort-takeover 27/0; fort-outpost-hard-territory 92/0; fort-strazniaca-zasieg 82/0; fort-vision 15/0; fort-nodes-save-load 18/0; fort-outpost-placement-rules 40/0; perf-hud-frame-memo 16/0; ai-territory-race 29/0; ai-stadnina-fort-territory 17/0; territory-border 9/0; territory-border-dense 15/0; perf-territory-index-equiv 6/0; improvement-territory-gate 6/0; ai-founding-territory 29/0.
- Czerwone IDENTYCZNIE na bazie 1bc8ec66 i kandydacie (nie regresja): auto-fort-claim 61/2, ai-march-avoid-foreign-territory 98/1 (C7).
- Mutacja produkcyjna (usuniecie `return centreFortOwner` w territory.ts): city-founding 24/3 FAIL -> test nietautologiczny wobec zarzutu 1; plik przywrocony git checkout.
OCENA ZARZUTOW:
1 (heks fortu trafial do miasta): ZASADNY, NAPRAWIONY w fe2143da1 (centrum fortu wygrywa z miastem, lustro w indeksie); potwierdzone testem i mutacja. Zmiana w territory.ts jest poza allowlista, ale konieczna dla reguly (a) dispatchu, minimalna (+8 linii), nie zmienia promieni ani kosztow: AKCEPTUJE jako uzasadnione odstepstwo (decyzja orkiestratora).
2 (testy): NAPRAWIONE (R1c-4, owner(0,0)=0 przy miescie w zasiegu).
3 (mutacja R0-M1 tautologiczna): ODDALAM do uwagi; mutacje produkcyjne czerwone (moja: 24/3 FAIL).
4 (Chromium przed/po): NIE ZMIERZONO przez nikogo. Luka dowodowa, nie FAIL (logika pure pokryta testami modulowymi); do KOLEJKA 2 R-WEB-VERIFY-LIVE.
5 (R2 regex na zrodle): ODDALAM do uwagi; applyFortCaptureByOccupation przetestowane jednostkowo (R2-1..6), sweepFortCaptures uzywa areEnemyOwners + jednostki nie-cywilnej (main.ts ~17251, sprawdzone w kodzie).
6 (R1 unifikacja zakladania): nie wykonana, tylko tabela + DECISION_REQUIRED; decyzja produktowa (ABC), nie blokuje celu glownego.
7 (sciezki ownerId): potwierdzam grepem - jedyna zmiana ownerId fortu w src to fort-territory.ts:380 (zdobycie: wojna, jednostka wojskowa, bez barbarzyncow, bez jednostki wlasciciela). Zgodne z R2. F1 (miasto fizycznie na heksie fortu kasuje wezel) bez zmian wg dispatchu (d).
8 (wyscig AI): ai-territory-race 29/0 to nie pomiar runnerem; wplyw NIE ZMIERZONO (forty AI i tak prawie nie powstaja, FALA 868).
ZASTRZEZENIE SEMANTYKI: heksy pierscienia fortu (nie centrum), wpadajace w promien nowego miasta, nadal ida do miasta (jak miasto<->miasto, dispatch b). U wlasciciela zostaje heks centrum fortu i jego ulepszenie. Wlasciciel moze oczekiwac szerszej ochrony stadnin - do ABC.
BLOKADY: brak blokujacych. Otwarte: Chromium NIE ZMIERZONO; R1 unifikacja (ABC); akceptacja territory.ts poza allowlista (orkiestrator).
RUNDY: FC po rundzie 2/5
NASTEPNY KROK: integracja orkiestratora (merge 91573b398 do main + bramki), potem KOLEJKA 2 weryfikacja zywa.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: ABC o lokalizacji fortu w cudzym zasiegu miasta; ABC o ochronie stadnin w pierscieniu fortu.

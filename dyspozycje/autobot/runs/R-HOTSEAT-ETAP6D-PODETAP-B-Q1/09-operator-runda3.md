STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (15 funkcji) na `isMe()`/`ME()` — runda 3:
poprawka luki pokrycia w bramce `exec-test.cjs` sekcja 3 (`collectDiploChipCounts`), wskazanej
DWUKROTNIE przez Final Control. ZERO zmian w `gra/src/main.ts` w tej rundzie.

ZMIANY/COMMIT: wyłącznie `gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs`, sekcja 3.
Mock `getDiplomaticContacts` rozszerzony z `{AI1=4, AI2=5}` na `{AI1=4, AI2=5, PLAYER=7}` —
trzeci kontakt to wartość graniczna guardu `if (isMe(oid)) continue;` (main.ts:15038,
świeżo zgrepowane, numer linii bez zmian). Dodane 2 nowe asercje w bloku PRAWDZIWY:
(1) `getDiploRelation.every(c => c[1] !== PLAYER)` — żadne wywołanie nie ma oid=PLAYER jako
drugiego argumentu (guard faktycznie wyklucza wartość graniczną, nie tylko przypadkiem
nietrafioną); (2) w bloku MUTACJA (`isMe=>zawsze false`) — `getDiploRelation.length === 3`
zamiast 2, bo zepsuty guard przepuszcza PLAYER do pętli. Istniejąca asercja
`length === 2` w bloku PRAWDZIWY teraz faktycznie coś sprawdza (wcześniej AI1/AI2 nigdy nie
były równe PLAYER niezależnie od guardu — tautologia). Brak zmian w main.ts, brak zmian poza
allowlistą. Commit NIE wykonany (deploy/push poza zakresem tej rundy).

TESTY: `node tools/hotseat-etap6d-podetap-b-exec-test.cjs` z katalogu `gra/` — czysty kod:
**48 PASS, 0 FAIL** (było 46/46, +2 nowe asercje). Ręczna mutacja main.ts:15038
`if (isMe(oid)) continue;` → `if (oid === 0) continue;` (ten sam guard, ta sama linia co
Final Control testował) — bramka **czerwienieje: 3 FAIL** w sekcji 3 (pakty=2 zamiast 1,
getDiploRelation wywołane 3x zamiast 2x, nowa asercja "żadne wywołanie nie ma oid=PLAYER"
łapie regresję wprost). Po teście: `git checkout -- gra/src/main.ts`, następnie
`git diff 6cda638a -- gra/src/main.ts` → PUSTY (main.ts potwierdzony identyczny z
6cda638a). `git status --short` po przywróceniu: wyłącznie zmiana w exec-test.cjs + dwa
niezmienione untracked raporty rund 1-2.

BLOKADY: brak.

RUNDY: 3/5 (rundy 1-2 zużyte na FAIL Final Control tej samej klasy defektu — luka
pokrycia mocka na wartości granicznej guardu; runda 3 = poprawka wskazana wprost przez
Final Control, zakres wyłącznie exec-test.cjs sekcja 3, main.ts potwierdzony nietknięty).

NASTĘPNY KROK: Evaluator → Final Control (weryfikacja: (a) nowa asercja PLAYER w mocku
`contacted`, (b) ręczna mutacja main.ts:15038 faktycznie czerwieni bramkę, (c) main.ts
diff wobec 6cda638a pusty) → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

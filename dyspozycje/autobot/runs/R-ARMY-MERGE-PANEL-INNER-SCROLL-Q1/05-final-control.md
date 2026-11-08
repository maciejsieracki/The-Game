# AutoBot Final Control — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1 — runda 2

Werdykt: **PASS dla kontraktu UI tej rundy**. Bez zmian produktu wykonanych przez Final Control.

## Zakres i niezależne kontrole

- Baza i HEAD: `91dc998a5f1b51ad29e0f4785edfd45655445c53`; branch `codex/army-merge-panel-inner-scroll-q1`; worktree `/workspace/army-merge-scroll`.
- Sprawdziłem dispatch, raport Operatora r2, Evaluatora r2, diff źródła oraz `03-150-percent-59-units.png`.
- Niezależnie uruchomiony test rzeczywistego Chromium: `army-merge-panel-scroll-real-render-test.cjs` — **31 PASS, 0 FAIL**.
- Niezależnie uruchomione `node ./node_modules/typescript/bin/tsc --noEmit` i `git diff --check` z `gra/` — oba exit 0.

## Ustalenia

- Przy 600×413 CSS px / DPR 1.5 render przedstawia 59 istniejących jednostek i wiersz przybywającej jednostki. W teście liczba renderowanych wierszy wynosi 60.
- Na zrzucie oba CTA są widoczne w stopce nad rosterem. Widoczny złoty thumb znajduje się przy końcu toru, zgodnie z pozycją rosteru; test pikselowy potwierdza jego widoczność. Test potwierdza też synchronizację ruchu thumbu, przeciągnięcie do ostatniego wiersza oraz dostęp do ostatniego istniejącego wiersza.
- Niezależny render Chromium zmierzył margines górny 28.59 px i dolny 27.88 px, przekraczające wymagane 24 px. Roster jest jedynym zamierzonym scroll containerem i nie ma poziomego overflow.
- Kliknięcie „Połącz armie” osiąga `onMerge`, a „Zostaw osobno” osiąga `onSeparate` w teście.

## Granica dowodu

Callbacki są licznikami fixture. Dowodzą widoczności i osiągalności handlerów panelu, ale nie uruchamiają pełnej gry ani pełnej transakcji scalania. Zmiana nie dotyka mechaniki scalania. PASS obejmuje wyłącznie określony kontrakt panelu i jego weryfikację.

Commit, push, merge i deploy: **nie wykonano**. Brak READY_FOR_DEPLOY.

# R-WEB-DIPLO-FORCED-PEACE-WINDOW-AUTO-OPEN-Q1 — Operator, runda 2 (DODATEK 2, wariant B)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (wyłącznie test żywy; kod gry bez zmian)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-WINDOW-AUTO-OPEN-Q1
GOAL: test żywy gra/tools/diplo-forced-peace-pending-live-paths-test.cjs — S4 i S2(a) zielone; okno pokoju wymuszonego otwiera się samo w turze utworzenia pending (bez Esc/kliknięcia); odroczenie przy trwającej bitwie zmierzone; mutacja czerwona. Decyzja ABC (wariant B): D1 = odroczenie wg decyzji, nie defekt; logika gry nietknięta.
ZMIANY/COMMIT: gra/tools/diplo-forced-peace-pending-live-paths-test.cjs (+ ten raport). Baza: c8ae0d3e9 + merge origin/main (a8a57008a; merge-base 899667a91 OK). Hak `pendingForcedPeaceForTest` z r1 już w main.ts, bez zmian w tej rundzie.

TESTY (ZMIERZONO):
- Test żywy na niezmienionym buildzie (vite, poza repo): EXIT 0. S4 PASS (okno samo, topmost, odroczenie, Esc/tło/„Zakończ turę”/Enter, akceptacja, warLog). S3 PASS. S2(a) PASS. Zero pageerror/console.error.
- Mutacja na kopii buildu (usunięte wywołanie showNextPendingForcedPeace po ticku, main.ts:39301, przywrócone po teście, cmp OK): EXIT 1, 8 FAIL (auto-open, topmost, S2a, S3 wariant).
- Zrzut s4-okno-pokoju.png OBEJRZANY: okno „Pokój wymuszony” na wierzchu, tura 2, przycisk „AKCEPTUJĘ WARUNKI POKOJU”; „Zakończ turę” zablokowane.
- tsc --noEmit: exit 0.
- logic 213/213; tech-tree 20 pass / 0 fail; research 33/33; unit-replace 21/21; combat 6/6.
- diplo-forced-peace-pending-test 40/0; diplo-weariness-forced-peace-test 14/0; peace-vazne-always-test ZIELONE; diplo-weariness-stages-view-test PASS; diplo-peace-auto-stale-offer-live-test 15/0.
- git diff --check: czysto.

BLOKADY / NIE ZMIERZONO:
- S2(b)/D2 (drugi pokój po akceptacji pierwszego): NIE ROZSTRZYGNIĘTE. W zmierzonym przebiegu pending = 1 mimo dwóch wojen (druga para nie weszła do kolejki); nie naprawiano (zgodnie z dispatchem).
- S1 (zapis/wczytanie z pending) i S5 (AI↔AI bez okna): NIE ZMIERZONO (brak haków).
- S3 wariant „Oddajesz: miasta”: NIE ZMIERZONO (mapa testowa dała tylko wariant „bez wymiany miast”).

UWAGI-DLA-ORKIESTRATORA:
- Odkrycie w teście: po auto-walce AI ekran „Wynik auto-walki” (src/ui/postBattleSummary.ts, przycisk „Kontynuuj”) potrafi przesłonić okno pokoju wymuszonego, dopóki gracz nie kliknie Kontynuuj. Test zamyka ten ekran jak bitwę (closeSummaries) i mierzy, czy przycisk okna jest na wierzchu (overlayTopmost). To nie zmienia logiki gry; do decyzji, czy kolejka okien powinna czekać na zamknięcie wyniku bitwy (poza tym tematem).
- Pierwsza wersja testu klikała „Akceptuję” przez Playwright i trafiała w nakładkę ekranu wyniku; w S2 klik zrobiono przez DOM (click() na przycisku okna).
- Ścieżka robocza (do sprzątania): /home/user/The-Game/.claude/worktrees/wf_e10e019c-4fb-1; zrzuty i bundle: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fpb-base (ev4/s4-okno-pokoju.png), .../fpb-mut (mutacja). node_modules w gra/ zainstalowane (npm ci --ignore-scripts).

RUNDY: 2/5 (Operator HAIKU; licznik porażek Haiku = 0)
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja testu żywego i mutacji; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

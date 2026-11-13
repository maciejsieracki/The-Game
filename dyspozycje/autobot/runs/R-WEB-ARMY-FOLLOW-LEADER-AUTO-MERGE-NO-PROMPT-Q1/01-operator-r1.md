STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1
GOAL: Jednostka z trybem "Idź do wodza" (followGeneral) po dotarciu na heks wodza scala się automatycznie, bez monitu; monit zostaje tylko przy ręcznym najechaniu jednostką bez trybu podążania; limit armii → hint zamiast scalenia.
BAZA: main 8dbcd48f7 (ROBOCZA po FALA 567). Operator: Haiku 5.5. Gałąź worktree: worktree-wf_baf6b395-90b-1.
ZMIANY/COMMIT: kod + test 226f7725c; ten raport w commicie następnym (SHA w odpowiedzi orkiestratorowi). Allowlista: gra/src/main.ts, gra/src/game/army-follow-auto-merge.ts (nowy), gra/tools/army-follow-leader-auto-merge-test.cjs (nowy), dyspozycje/autobot/runs/R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1/01-operator-r1.md.

DIAGNOZA (przed zmianą):
- Tryb: main.ts ~24820-24870, akcja 'general-follow' (etykieta "Idź do wodza") ustawia u.followGeneral=true; domyślnie dla rekrutów gracza main.ts ~4438 i ~38379 (recruitFollowGeneralDefault).
- Marsz do wodza: planGeneralFollowMarch (main.ts ~29990) + generalQuickFollow.ts; wykonanie w applyMarchSegmentInstant (~30315, koniec tury) i w ścieżce animowanej (~42623).
- Monit: obie ścieżki wołają promptMergeIfCoLocated (main.ts ~14152), które bezwarunkowo pokazywało showArmyMergePanel, gdy na heksie stała własna jednostka (w tym wódz). Tryb followGeneral nie był brany pod uwagę.

NAPRAWA:
- Nowy moduł game/army-follow-auto-merge.ts: followLeaderAutoMergeDecision(units, arriving, existing, q, r, limit) → 'merge' | 'limit-blocked' | 'none'. 'merge' = wszystkie wchodzące followGeneral===true (nie wódz), na heksie stoi isGeneral własnego właściciela, canJoinStackAt(limit) OK. 'limit-blocked' = jak wyżej, ale limit przekroczony. Inaczej 'none'.
- main.ts promptMergeIfCoLocated: po odłożeniu (deferred) decyzja; 'limit-blocked' → hint "Nie dołączono do armii wodza: Armia nie może mieć więcej niż N jednostek (limit bitwy)." bez scalania i bez monitu; 'merge' → applyMerge(true) bez monitu; 'none' → monit jak dotąd. Treść onMerge wyciągnięta do wspólnej funkcji applyMerge(autoFollow) (ta sama ścieżka scalania); hint dla auto: "Dołączono do armii wodza" (zamiast "Połączono: N jedn."), bez surowych id.
- AI bez zmian (promptMergeIfCoLocated wychodzi dla !isHuman).

TESTY:
- node gra/tools/army-follow-leader-auto-merge-test.cjs → 10 pass, 0 fail (tryb ON → merge; 2 jednostki ON → merge; tryb OFF → none; brak wodza → none; mieszany przyjazd → none; limit przekroczony → limit-blocked; limit dokładnie osiągnięty → merge; puste wejście → none; wchodzący wódz → none).
- npx tsc --noEmit (gra) → exit 0.
- Regresja army-merge: army-merge-bounce, -colocated, -dismiss-bounce, -separate-return(-mainguard), -split-direction-icons, -stackgroupid, merge-decor-no-regress → exit 0.
- army-merge-panel-list-visibility, army-merge-panel-production-mount, army-merge-panel-scroll-real-render → NIE_ZMIERZONO: exit 1 z powodu braku przeglądarki (browserType.launch: brak /usr/bin/chromium) — błąd środowiska, nie kodu; scroll-real-render przeszedł części źródłowe przed startem przeglądarki.
- Weryfikacja w przeglądarce (realny marsz do wodza) NIE_ZMIERZONO — poza zakresem headless testu; do potwierdzenia na ROBOCZEJ.
- npm run build/dev NIE uruchamiane (zakaz). Zainstalowano tylko zależności (npm ci --ignore-scripts) w gra/node_modules (ignorowane przez git).

ZAŁOŻENIA (luki rozstrzygnięte w dokumencie):
- "Dotarcie" = istniejący hook scalenia po ruchu (promptMergeIfCoLocated), bez nowego hooka.
- Mieszany przyjazd (jedna jednostka ON, druga OFF) → monit jak dotąd (auto tylko gdy wszyscy wchodzący podążają).
- Odłożone monity (koniec tury/bitwa) nadal czekają w kolejce i są scalane automatycznie przy flushu, jeśli spełniają warunki.
- Przy limicie jednostka zostaje osobno na sąsiednim heksie; brak ponowienia (gracz może scalić ręcznie, jeśli zmieści się limit).

BLOKADY: brak (środowiskowe: chromium do testów przeglądarkowych — NIE_ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) → Final Control (Sonnet) na bazie 226f7725c.
DEPLOY/PUSH: NIE WYKONANO

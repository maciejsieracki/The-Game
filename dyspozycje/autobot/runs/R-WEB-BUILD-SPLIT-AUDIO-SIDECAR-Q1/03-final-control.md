STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILD-SPLIT-AUDIO-SIDECAR-Q1
GOAL: całe audio w plikach-sąsiadach audio-pack-N.js, HTML bez audio, file:// przez <script src>, cichy fallback, strażnik rozmiaru. Spełniony.
ZMIANY/COMMIT: SHA do integracji 41d2b9f74cd9a75ea9a2bb86f384a4afa0c9dc4f (gałąź worktree-wf_90cb04c7-8e7-1; rodzic bf57226b1 = merge MUSIC2 FC d8c4d1d58). Diff 41d2b9f74 vs bf57226b1: 6 plików, wszystkie w allowliście (vite.config.ts, filePlayer.ts, audio-sidecar-test.cjs, memory-datauri-duplicates-test.cjs, civ-music-live-test.cjs, 01-operator-r1.md). finalize.sh, gra-robocza/, KANON/FINALNA, civ-music.json nietknięte.
TESTY (własne, build poza repo, 15,2 s): index.html 14 306 135 B, 0x data:audio/; pakiety 39 803 262 / 39 999 512 / 11 556 324 B (żaden >90 MB); audio-sidecar-test PASS (S1-S3, W1-W4, N1-N5, G); tsc --noEmit 0 błędów; civ-music-test 100/0. Wyniki Evaluatora (menu-*, ambience) oraz operatora (logic 213/213, civ-music-live 19/0, memory-datauri 14/14) przyjęte bez własnego powtórzenia.
ZARZUTY: brak otwartych. Rozstrzygnięcie: ODDAL (0 NAPRAW).
BLOKADY: brak.
KOLEJNOŚĆ WZGLĘDEM origin/rust-port/parity-v2 (d6414fcf1): niezależne linie (merge-base a61337844). Zintegrować NAJPIERW do main; parity-v2 nie jest przodkiem 41d2b9f74. Próbny merge-tree 41d2b9f74 + parity-v2 daje konflikty (gra/vite.config.ts oraz modify/delete gra/tools/wyrab-rzeka-r2-test.cjs) — nie do rozwiązywania przy integracji main, tylko przy późniejszym REPIN parity-v2 po main.
UWAGI: (1) 3x ERR_FILE_NOT_FOUND bez sąsiadów to komunikat przeglądarki, zgodny z dispatchem. (2) Po deployu zmierzyć Gra-ROBOCZA.html (~14,3 MB) i każdy audio-pack-*.js, MD5 + GitHub Raw dla każdego; usunąć nadmiarowe pakiety, gdy N zmaleje. (3) RSS procesu z sąsiadami vs stary build: NIE_ZMIERZONO (Evaluator: sterta JS 16,6 MB po GC). (4) Inne warianty vite (POLE-BITWY, podglądy) poza zakresem.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge 41d2b9f74 do main, sprawdź merge-base --is-ancestor i diff --stat), potem READY_FOR_DEPLOY
DEPLOY-PUSH: NIE WYKONANO

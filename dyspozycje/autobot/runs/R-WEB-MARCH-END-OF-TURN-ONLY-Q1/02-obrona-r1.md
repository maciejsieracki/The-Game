STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-END-OF-TURN-ONLY-Q1
RUNDA: 1/5 (obrona)

Baza obrony: commit Operatora 9d51150de. Poprawka obrony dodaje wyłącznie hak testowy `spawnFollowerFlush` w
`__playerMovesTestDebug` (blok `?civTest=1`) i scenariusz L8 w `player-moves-before-ai-turn-test.cjs`.

Zarzut 1 (brak pomiaru przed/po): PRZYJMUJĘ CZĘŚCIOWO. Chromium `/opt/pw-browsers/chromium` dziala; pomiar PO w realnym
`endTurn` wykonany (pelny `player-moves-before-ai-turn-test`: 51 OK, 0 FAIL, scenariusze a, b, c, d, e, f). Pomiaru PRZED
(stary kod ze stack trace) nie wykonano -- NIE_ZMIERZONO; dowod regresji dla starych sciezek to mutacje M1-M4 w
`march-end-of-turn-only-test` (odtwarzaja stary kod).

Zarzut 2 (brak zywego scenariusza b): PRZYJMUJĘ. Dodano L8 (a-f): REALNY `flushDeferredPlayerUnitReveals` dla
jednostki `followGeneral`. Asercje: marsz zaplanowany, brak animacji, pozycja i MP bez zmian po flush i 2 s pozniej
(start nowej tury), jednostka poza `marchExecQueue`, potem realny endTurn -> dokladnie 1 `PLAYER_MARCH_INSTANT` w oknie
ruchow gracza przed swiatem, brak `PLAYER_MARCH_ANIM_START`, pozycje stabilne po `PLAYER_MOVES_END`, MP odnowiony.
Grep E1-E6 pozostaje jako warstwa pomocnicza.

Zarzut 3 (hashe determinizmu, regresje): PRZYJMUJĘ CZĘŚCIOWO. Zywe `player-moves*` 51/0; `planned-march` 18/0;
`march-attack-queue-persist` 57/0; `rally-point-automarch` 30/0; `army-panel-recruit-rally-general` 5 OK;
`march-end-of-turn-only` E1-E6 + M1-M5 EXIT=0; `tsc --noEmit` EXIT=0. NIE_ZMIERZONO: hashe `war-allin-capital-quick`,
`ai-test` 274/20, reszta `*end-turn*`/`army-*`/`hotseat-*`/`general-march*`. Diff nie dotyka AI, swiata, RNG; do domkniecia
przez Final Control/orkiestratora.

Zarzut 4 (UX "idz do wodza"): ODRZUCAM jako blad, PRZYJMUJĘ jako uwage produktowa. Zgodne z dispatchem (A: pierwszy
segment rozkazu gracza natychmiast, reszta na koniec tury). Zglaszam do decyzji wlasciciela przy integracji.

Zarzut 5 (martwy kod): ODRZUCAM. `executePlannedMarchesEndTurn` jest kotwica w testach (`march-end-of-turn-only`,
`player-moves-before-ai-turn` regex, komentarze hotseat-*); usuniecie rozszerzylo by diff poza minimalna zmiane.
Petla `newlyPlanned` jest redundantna ale nieszkodliwa (ta sama ochrona `movedByPlayerThisTurn` w petli glownej);
sprzatanie do osobnego tematu.

Dodatkowo: timeout `waitForFunction` w `openGame` podniesiony 180 s -> 600 s (pierwszy bieg przy load average ~28
wygasl w L3 na ladowaniu swiata -- INFRA, nie logika; powtorka z gotowym bundlem: 51 OK).
Brak zmian w WERSJE.md, gra-robocza, rust-port, src-tauri, battle. node_modules i bundle w /dev/shm usuniete.
DEPLOY/PUSH: NIE WYKONANO

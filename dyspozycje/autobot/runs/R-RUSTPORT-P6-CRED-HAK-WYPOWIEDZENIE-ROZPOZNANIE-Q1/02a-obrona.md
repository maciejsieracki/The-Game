# 02a-obrona — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1
GOAL: Odpowiedzieć na 6 zarzutów Evaluatora do rozpoznania haka P4 (wypowiedzenie gracza, sojusz, klaster). Przyjęte zarzuty: poprawka dokumentu + dowód. Odrzucone: z dowodem.
ZMIANY/COMMIT: dokument `dyspozycje/rust-port/p6/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1-ROZPOZNANIE.md`, commit `202f5a45c` (poprawki §1, §1a, §2, §4). Ten plik: commit podany w raporcie końcowym. Brak zmian w `rust-port/**`, `gra/**`, testach, `Cargo.toml`. Push nie wykonany.
TESTY: NIE DOTYCZY (dispatch: zero zmian kodu; `git diff --check` czysty; `git diff --stat fc2ed160f..HEAD` = 2 pliki .md w allowliście).
BLOKADY: brak blokad. NIE_ZMIERZONO pozostaje w §5 rozpoznania (aiHonorsAllianceWarObligation, interCivWarBlockedForAi, pętla klastrów PM, ścieżka rebel-war w produkcji).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki (§1a, §2 wiersz guardu barbarzyńcy, §4 wiersz T1 i zależności).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### O-1 — PRZYJMUJĘ
Zarzut: P2 pomija gałąź `force` i `isPeaceLockedBetween` (`main.ts` ok. 13195-13203, czyszczenie `peaceUntilTurn`).
Dowód (pin `07d2fbd72:gra/src/main.ts`): `ownerDeclareWarOn(attackerId, defenderId, force = false, cause?: WarCause)`; `force=true` zeruje `peaceUntilTurn` (`:13200`), `force=false` przy pokoju daje `return` (`:13201-13202`). Rust `declare_war_opts` (`diplomacy_truce_flow.rs:247-272`) nie ma tych parametrów.
Poprawka: §1a dopisku (commit `202f5a45c`).

### O-2 — PRZYJMUJĘ CZĘŚCIOWO
Zarzut: T1 powołuje `fragSha256` (`p6_cred_wojna_vectors_r2.rs:96`) jako wektory, a nie wektory behawioralne.
Dowód: `:96` to asercja hasha strażnika (`fragSha256.chargeWarDeclarationCredibility`), a nie wektor. Zarzut ma rację co do tego, jak dokument to opisał. Nie ma racji co do źródła wektorów: tablica `hook` (≥150 przypadków, `hook_p4_counter_matches_pin_for_all_cases`) jest generowana przez `tests/p6_cred_wojna_gen_r2.mjs`, który wykonuje tekst pinu przez esbuild (nagłówek generatora). Ręcznych wektorów nie ma.
Poprawka: wiersz T1 w §4 podaje rozróżnienie hash / wektor i wymóg regeneracji generatorem, bez ręcznej edycji `vectors.json`.

### O-3 — PRZYJMUJĘ
Zarzut: dwa guardy barbarzyńcy są niespójne (`note_war_declarations` z `BARBARIAN_OWNER_ID = -1`, `declare_war_opts` ze zbiorem `barbarians`).
Dowód: `turn_war_dipl_steps.rs:883-887` (stała `-1`, filtr par). `diplomacy_truce_flow.rs:254` (`barbarians.contains`). Zbiór `barbarians` (`diplomacy_truce_flow.rs:62`) nie jest wypełniany w produkcji (`grep` `barbarians.insert` / `barbarians =`: tylko `tests/p6_repin_rozejm_silnik.rs:263,268`). Pin: `isBarbarian(id)` = `id === BARBARIAN_OWNER_ID` (-1), `gra/src/game/barbarians.ts:51-55`. Wniosek: rozpoznanie błędnie oceniło guard `declare_war_opts` jako zgodny. W produkcji jest nieaktywny. `note_war_declarations` jest zgodny z pinem.
Poprawka: wiersz guardu w §2 zmieniony na CZĘŚCIOWO. T1 ma ujednolicić definicję (`LEGACY_BARBARIAN_OWNER_ID`, `domain/ids.rs:42`, albo `BARBARIAN_OWNER_ID`).

### O-4 — PRZYJMUJĘ
Zarzut: tabela zależności nie wskazuje, że T3 i T5 zależą od ścieżki `force`/`wymuszona_inna` i rebel-war (`siege_transfer.rs:84`).
Dowód: `siege_transfer.rs:84` (NIE_ZMIERZONO: `force` i `wymuszona_inna` bez odpowiednika), `siege_transfer_effects.rs:193`, pin `main.ts:13262` (`ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna')`). Wołający `triggerRebelProtectionWarConsequence`: `main.ts:17703`, `:36090`. Dodatkowo do §1a dopisane pełne listy wołających pinu, które rozpoznanie pominęło: `playerDeclareWarOnOwner` z `:13276`, `:13278`, `:20502`, `:25248`; `ownerDeclareWarOn` z `:20504`, `:20652`, `:28924`, `:29012`.
Poprawka: §1a i wiersze T2, T3, T5 w §4. Zależności: T2 przed T3 i T5.

### O-5 — PRZYJMUJĘ
Zarzut: szacunki rund T4 (3) i T5 (2-3) nie mają podstawy pomiarowej.
Dowód: zgadzam się, że NIE_ZMIERZONO (odmowy AI, `interCivWarBlockedForAi`, pętla klastrów PM) nie daje pomiaru. Nie podaję nowej liczby.
Poprawka: w §4 oznaczone jako wstępne, z podstawą (liczba funkcji pinu do portu) i wymogiem przeliczenia przed startem T4/T5.

### O-6 — ODRZUCAM
Zarzut: bramki fmt, clippy i cargo test nie były uruchomione.
Dowód: dispatch (`00-dispatch.md`, sekcja RAPORT): zakres to rozpoznanie bez zmian kodu, a pole TESTY wprost brzmi „NIE DOTYCZY”. Zmian w `src/**`, `tests/**`, `Cargo.toml` nie ma (`git diff --stat fc2ed160f..HEAD`: 2 pliki .md). Bez zmian w kodzie nie ma czego kompilować ani testować. Weryfikacja faktów dokumentu była grepem i czytaniem wskazanych linii (wszystkie linie w tej obronie sprawdzone ponownie).

## Podsumowanie zmian w commitach
- `202f5a45c` — poprawki dokumentu rozpoznania (O-1, O-2, O-3, O-4, O-5).
- Commit tego pliku (`02a-obrona.md`) — podany w raporcie końcowym.

## Uwagi
- Commit zawiera tylko trailer `Claude-Session` (zgodnie z dispatchem: bez `Co-Authored-By` z nazwą modelu). Zarządzenie z kontekstu sesji prosi o dodanie `Co-Authored-By`; to rozbieżność, którą orkiestrator powinien rozstrzygnąć.
- Pytania ABC z rozpoznania (format komendy gracza, zakres wojny klastra) pozostają otwarte.

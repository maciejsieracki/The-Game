# 02a-obrona — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: wypowiedzenie wojny przez gracza i zerwanie traktatu — rozpoznanie parytetu web ↔ Rust (CRED-HAK, zadanie #120/#171).
GOAL: odpowiedź na 5 zarzutów Evaluatora (`02-evaluator.md`, PASS-WITH-NOTES) do raportu `01-rozpoznanie.md` (commit `bce250d70`). Każdy zarzut: PRZYJMUJĘ z dowodem (web pin `07d2fbd72`, Rust `a01363d5f`) albo ODRZUCAM.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/02a-obrona.md`). Zero zmian w `gra/`, `rust-port/`, testach i `Cargo.toml`. Plik `01-rozpoznanie.md` NIE jest edytowany w tej rundzie; poprawki do niego są podane w §3 jako gotowy tekst do zastosowania.
TESTY: NIE DOTYCZY (tryb odczytu; zero kodu). Dowody: `git show` / `git grep` / `grep -n` na pinie i na `a01363d5f`.
BLOKADY: brak blokad technicznych. NIE_ZMIERZONO pozostaje w §5 `01-rozpoznanie.md` (punkty 1, 3, 4, 7 tamże bez zmian).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 weryfikuje §1 (zarzut 1: kolejność), §2 (zarzut 2: tabela `ownerDeclareWarOn`) i §4 (zarzut 4: hak P4). Następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO (dispatch: bez push, bez integracji).

## Odpowiedzi na zarzuty

### Zarzut 1 — Kolejność i podwójne zastosowanie relacji (A4/A7) — PRZYJMUJĘ

Dowody (web, pin `07d2fbd72`):
- `chargeWarDeclarationCredibility` (`gra/src/main.ts:12176–12225`) NIE wywołuje `setDiploRelation` ani `applyDiploEventTracked`. Zapisuje tylko: N2 (`appendWiarygodnoscEvent`, `:12195–12200`), `clearTruceEndOffer`, `setDiploPairMeta` (`truceUntilTurn`/`truceInitiatorId` → `undefined`, `wojnaOdTury`, `n1Zastosowany: false`, `ostatniePrzewinienieWobecNas`) oraz P4 (`wiarygodnoscOstatniaWojnaTuraByOwner`, `:12223–12224`). Zwraca `truceBreach`.
- `playerDeclareWarOnOwner` (`:13152`): kolejność `chargeWarDeclarationCredibility` (`:13168`) → `breakTreatiesOnWar(ME, owner, true)` (`:13169`) → `applyAllianceObligationsOnWar` (`:13170`) → `setDiploRelation(applyDiploEventTracked(..., 'wojna_wypowiedziana'))` (`:13171–13175`). Relacja `wojna` zapisywana jest DOPIERO po zerwaniu traktatów.
- Kara `zlamana_obietnica` zależy od relacji odczytanej w chwili zerwania: `breakTreatiesOnWar` (`:23688–23702`) czyta `const cur = getDiploRelation(a, b)` (`:23698`) i woła `applyDiploEventTracked(a, b, cur, ev)`. Ten wrapper (`:12310–12327`) przekazuje `wiarygodnosc = undefined`, gdy `cur.status === 'wojna'` (`:12318–12319`). Jeśli relacja jest już `wojna` w chwili kary, modyfikator wiarygodności przepada, więc wynik zależy od kolejności.

Dowody (Rust, `a01363d5f`):
- `DiplomacyTruce::declare_war_opts` (`rust-port/engine/src/domain/diplomacy_truce_flow.rs:247–275`) NIE jest tylko częścią charge. Wewnątrz (`:271–273`) wykonuje `apply_diplomatic_event(&cur, DeclareWar)` i `set_relation`, czyli zapisuje relację `wojna` PRZED jakimkolwiek zerwaniem. Zrobione jest więc złe: raport w wierszu A4 opisuje to jako odpowiednik kroku webu, a w rzeczywistości zmienia kolejność.
- `break_treaties_on_war` (`diplomacy.rs:1690`) nie ma kary, więc obecnie efekt kolejności nie występuje. Pojawi się dopiero przy wpięciu kary (C5), a wtedy `declare_war_opts` już zapisał `wojna`.
- Podwójne `DeclareWar`: `apply_diplomatic_event(DeclareWar)` (`diplomacy.rs:633`) ustawia wyłącznie `status = War` i zerowe delty zaufania/respektu (`diplomacy.rs:617–640`). Web też nie zmienia zaufania dla `wojna_wypowiedziana` (`gra/src/game/diplomacy.ts:1036`). Dwukrotne zastosowanie nie dubluje więc stanu relacji. Problemem jest kolejność, a nie duplikat zdarzenia. Zarzut „zdubluje DeclareWar” przyjmuję tylko jako ryzyko kodowe (dwa wywołania tego samego zdarzenia), nie jako błąd stanu.

Poprawka do `01-rozpoznanie.md`, wiersz A4 (tekst do zastosowania):
> A4: CZĘŚCIOWO, KOLEJNOŚĆ NIEZGODNA. `declare_war_opts` (`diplomacy_truce_flow.rs:247–275`) zapisuje relację `wojna` wewnątrz charge (`:271–273`), a web zapisuje ją po `breakTreatiesOnWar` i `applyAllianceObligationsOnWar` (`main.ts:13169–13175`); web charge (`:12176–12225`) nie zmienia relacji. Wpięcie 1:1 zmieni wynik kary `zlamana_obietnica` (`applyDiploEventTracked` pomija modyfikator wiarygodności przy `cur.status === 'wojna'`, `main.ts:12318–12319`).

Rekomendacja (techniczna, nie pytanie ABC: web rozstrzyga kolejność, więc decyzja należy do wykonawcy i trafia do `REJESTR-RUST.md`):
- Rozdzielić `declare_war_opts` na dwie funkcje: (a) `charge_war_declaration_credibility(declarer, target, turn, skip_n2) -> breach` — tylko N2, `clear_truce_end_offer_core`, czyszczenie rozejmu, `wojna_od_tury`, `n1_zastosowany`, `ostatnie_przewinienie`, P4; BEZ zapisu relacji; (b) `apply_war_declaration_relation(declarer, target)` — samo `apply_diplomatic_event(DeclareWar)` + `set_relation`.
- Wrapper gracza (`playerDeclareWarOnOwner`) wykonuje: (a) → `break_treaties_on_war` (z karą, gdy wpięta) → alianse → (b) → zapis przyczyny. Kolejność identyczna z webem.
- Ryzyko regresji: zerowe. `declare_war` i `declare_war_opts` nie mają wołających w produkcji (sprawdzono `git grep` w `a01363d5f`; trafienia tylko w `rust-port/engine/tests/p6_repin_rozejm_silnik.rs:223–282` oraz `siege_transfer.rs:84`, `siege_transfer_effects.rs:198` jako komentarz). Testy z `p6_repin_rozejm_silnik.rs` asercjami `status == War` wymagają adaptacji wrappera, nie zmiany wyniku.

### Zarzut 2 — NIE_ZMIERZONO zawyżone dla `ownerDeclareWarOn` (`main.ts:13197–13235`) — PRZYJMUJĘ

Funkcja jest w pełni czytelna statycznie na pinie. Różnice względem `playerDeclareWarOnOwner` (pin `07d2fbd72`):

| Element | `playerDeclareWarOnOwner` (`:13152`) | `ownerDeclareWarOn` (`:13197`) |
|---|---|---|
| Guard tożsamości | brak (ME ≠ owner) | `attackerId === defenderId` → `return` (`:13198`) |
| Pokój | `isPeaceLockedBetween` → hint + `return false` (`:13154–13156`) | `force = true`: czyści `peaceUntilTurn` pary (`:13199–13200`); `force = false`: CICHY `return`, bez hintu (`:13201–13202`) |
| Warstwa dyplomacji | `diplomacyLayerForOwner` + `playerDiplomacyActionAllowed('war')` (`:13158–13167`) | brak |
| Wiarygodność | `chargeWarDeclarationCredibility(ME, owner)` bez opts (`:13168`) | ten sam wzorzec, bez opts (`:13205`) |
| Zerwanie traktatów | `breakTreatiesOnWar(ME, owner, true)` (`:13169`) | `breakTreatiesOnWar(att, def, isMe(att))` (`:13206`); `breakerIsPlayer` zależy od tego, czy napastnik to gracz; w obu brak `bezKary` |
| Alianse | `applyAllianceObligationsOnWar` (`:13170`) | to samo (`:13207`) |
| Relacja | `setDiploRelation(applyDiploEventTracked(... 'wojna_wypowiedziana'))` (`:13171–13175`) | to samo (`:13208–13216`) |
| Przyczyna wypowiedzenia | `zarejestrujWypowiedzenie` z wyliczoną przyczyną (`:13177`) | `cause ?? przyczynaWypowiedzenia(...)` (`:13221–13227`): parametr `cause` |
| Porządki tributów i eventu | bezwarunkowo (`:13178–13179`) | tylko gdy `isMe(defender) \|\| isMe(attacker)` (`:13229–13231`) |
| `pruneInvalidNegotiations`, hint, UI | bezwarunkowo (`:13180`); hint „Wypowiedziałeś wojnę” (`:13181` i dalej) | tylko gdy `isMe(defender)` (`:13233`, `pruneInvalidNegotiations` `:13234`); inny hint „wypowiada wojnę (ultimatum)” |
| Wynik | `boolean` | `void` |

Zewnętrzne wołania (pin): `ownerDeclareWarOn` wołane m.in. z `:13262` (`ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna')`, ścieżka rebeliantów). Pełne wołania `playerDeclareWarOnOwner` i `ownerDeclareWarOn` na pinie NIE zostały zgrepowane w tej rundzie (NIE_ZMIERZONO); do zamknięcia przed dispatchem #171.

Rust (`a01363d5f`): `declare_war_opts` nie ma parametrów `force` ani `cause` ani identyfikatora gracza do `isMe`. Rust już to dokumentuje: `siege_transfer.rs:84` (`force=true` i powód `wymuszona_inna` bez odpowiednika) oraz `siege_transfer_effects.rs:198`. Port `ownerDeclareWarOn` (z parametrami `force`, `cause`, `human: Option<PlayerId>`) jest więc osobnym elementem dispatchu #171, a nie rozszerzeniem ścieżki gracza.

Poprawka do `01-rozpoznanie.md`: w §1 dopisać „A-bis: `ownerDeclareWarOn` — tabela różnic (§1a)” z tabelą powyżej i usunąć wpis §5.1 jako NIE_ZMIERZONO dla tej funkcji (zostaje tylko `joinAllyToWar` `:23803–23814` i zakres wołań AI).

### Zarzut 3 — Błędne numery linii w `diplomacy.rs` i `main.ts` — PRZYJMUJĘ

Sprawdzenie `git show a01363d5f:rust-port/engine/src/domain/diplomacy.rs` i `git show 07d2fbd72:gra/src/main.ts`:

| Element w `01-rozpoznanie.md` | Raport | Faktycznie |
|---|---|---|
| `is_trade` (B2, B4) | `:4300` | `:4330` (`let is_trade = matches!(deal.kind, TreatyKind::TradeRoute \| TreatyKind::Exchange);`) |
| `trade_treaty_break_penalty_free` (B4) | `:4326` | `:4329` |
| stała `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS` (B4) | `:4319` | `:4306` (doc `:4305`) |
| `BrokenPromise*` (C5) | `:552` / `:554` | atrybuty `#[serde]` na `:552` i `:554`; warianty `BrokenPromiseByPlayer` `:553`, `BrokenPromiseByAi` `:555` |
| wołanie `breakTreatiesOnWar` w `ownerDeclareWarOn` (C6) | `main.ts:13207` | `main.ts:13206` (`breakTreatiesOnWar(attackerId, defenderId, isMe(attackerId));`) |

Pozostałe linie zweryfikowane bez zmian: `diplomacy.rs:617` (`apply_diplomatic_event`), `:544–545` (`DeclareWar`), `:1690` (`break_treaties_on_war`), `:4336` (`voluntary_treaty_break_plan`); `main.ts:13169` i `:13170`, `:23688`, `:22741`, `:23867`.

Poprawka: zastąpić wartości z tabeli powyżej w `01-rozpoznanie.md` (wiersze B2, B4, C5, C6). Wnioski nietknięte.

### Zarzut 4 — Nieprecyzyjne „wołane z `turn_war_dipl_steps.rs:898` i `declare_forced_wars`” — PRZYJMUJĘ

Sprawdzone `git grep -n "note_war_entered\|note_war_declarations" a01363d5f -- rust-port/engine/src`:
- `CredibilityRegistry::note_war_entered` (`credibility.rs:855`) ma jednego bezpośredniego wołającego: `note_war_declarations` (`turn_war_dipl_steps.rs:898`).
- `note_war_declarations` (`turn_war_dipl_steps.rs:879`) ma dwóch wołających: `run_war_turn` po hamulcu D8 (`turn_war_pipeline.rs:422`, `note_war_declarations(ctx.war, &entered, ctx.turn)`) oraz `declare_forced_wars` (`war_turn_declare.rs:116`).
- `declare_war` i `declare_war_opts` (`diplomacy_truce_flow.rs:239–272`) nie wołają żadnej z tych funkcji ani `note_war_entered`.

Konsekwencja dla wpięcia gracza: hak P4 NIE istnieje w ścieżce gracza ani w ścieżce `declare_war_opts`. Nośnik w `TruceDiplomacy` to `credibility_events: Vec<(PlayerId, &'static str)>` (`diplomacy_truce_flow.rs:64`), a nie `CredibilityRegistry`, więc P4 wymaga dodania nośnika albo przekazania rejestru do wrappera. Sposób podpięcia (nośnik w `TruceDiplomacy` czy parametr wrappera) — NIE_ZMIERZONO w tej rundzie; zostaje do dispatchu #171.

Poprawka do `01-rozpoznanie.md`, §1 „P4 wołane” i §2 pkt 3: zastąpić zdanie „wołane z `turn_war_dipl_steps.rs:898` i `declare_forced_wars`” treścią: „`note_war_entered` ← `note_war_declarations` (`turn_war_dipl_steps.rs:898`) ← {`run_war_turn` po hamulcu D8, `turn_war_pipeline.rs:422`; `declare_forced_wars`, `war_turn_declare.rs:116`}; ścieżka gracza (`declare_war_opts`) nie wywołuje haka.”

### Zarzut 5 — N2/N3/N5 i pokrycie wektorów dla ścieżki gracza — PRZYJMUJĘ

Wartości (pin, bazowe, `gra/src/game/diplomacy.ts`):
- `wiarygodnoscN2ZlamaniePaktuNap = -18` (`:327`), `wiarygodnoscN2ZlamaniePaktuSojusz = -25` (`:329`),
- `wiarygodnoscN3AtakWOknieKarencji = -12` (`:331`), `wiarygodnoscN3KarencjaBezterminoweTur = 10` (`:333`),
- `wiarygodnoscN5ZerwanieTraktatCzasowy = -6` (`:337`), `wiarygodnoscN5ZerwanieHandelCzasowy = -4` (`:339`).

Rust (`rust-port/engine/data/diplomacy.json:102–108`): identyczne wartości (`-18`, `-25`, `-12`, `10`, `-6`, `-4`). Zgodność wartości bazowych potwierdzona.

Skalowanie trudnością (`diplomacy.ts:564–578`) — NIE_ZMIERZONO w pełni: funkcja skaluje klucze z list `DIPLO_*_THRESHOLD_KEYS`; pełnej listy nie odczytano, więc nie wykluczono, że któryś klucz `wiarygodnosc*` tam wchodzi. Do dispatchu #171 należy to rozstrzygnąć przed napisaniem wektora.

Pokrycie wektorów (`a01363d5f`):
- `p6_cred_wojna.rs`, `p6_cred_wojna_forced.rs`, `p6_cred_wojna_vectors.rs`, `p6_cred_wojna_vectors_r2.rs`: wołają wyłącznie `note_war_declarations` (hamulec), `declare_forced_wars`, `declare_from_assignments` i `note_war_entered` bezpośrednio. Żaden nie woła `declare_war` ani `declare_war_opts`. Wektory P4 dotyczą więc WYŁĄCZNIE ścieżki hamulca i wymuszonej, NIE ścieżki gracza.
- Ścieżka gracza/Z8 jest pokryta wyłącznie testami jednostkowymi `p6_repin_rozejm_silnik.rs` (`z8_*`, `:220–285`). Sprawdzają zdarzenie `credibility_events` (nazwę i liczbę), `status == War` i skrzynkę ofert; NIE sprawdzają P4 ani wartości N2.

Poprawka do `01-rozpoznanie.md`, §5 punkt 9: zastąpić treścią: „Wektory P4 (`p6_cred_wojna*.rs`) pokrywają hamulec i wojnę wymuszoną; ścieżki gracza (`declare_war`/`declare_war_opts`) nie pokrywają. Pokrycie Z8 ścieżki gracza: `p6_repin_rozejm_silnik.rs:220–285` (bez P4, bez wartości N2).”

Warunek wstępny dla dispatchu #171 (zamiast „NIE_ZMIERZONO”): (1) odczyt pełnej listy `DIPLO_*_THRESHOLD_KEYS` w `diplomacy.ts` dla kluczy `wiarygodnosc*`; (2) wektor pinu dla `playerDeclareWarOnOwner` wygenerowany generatorem z pinu (jak `p6_cred_wojna_gen_r2.mjs`), nie ręcznie; (3) wartości N2/N3/N5 wzięte z `diplomacy.json`, nie z opisu w raporcie.

## §3 Zbiorcza lista poprawek do `01-rozpoznanie.md` (do zastosowania przez Operatora rewizji)

1. Wiersz A4: zastąpić tekstem z zarzutu 1 (kolejność niezgodna; relacja w charge; rekomendacja podziału).
2. Dopisać tabelę `ownerDeclareWarOn` z zarzutu 2 jako §1a i zmienić §5 pkt 1 (NIE_ZMIERZONO tylko dla `joinAllyToWar` i wołań AI).
3. Numery linii z zarzutu 3 (B2, B4, C5, C6) oraz P4 w §1A4 i w wierszu A4: `main.ts:12223–12224` (nie `12222–12223`).
4. Zdanie o `note_war_entered` z zarzutu 4 (§1 „P4 wołane”, §2 pkt 3).
5. §5 pkt 9 i warunki wstępne z zarzutu 5.

## §4 Wpływ na dispatch #171 (CRED-HAK-WYPOWIEDZENIE-IMPL)

- Kolejność wpięcia: (a) split `declare_war_opts` na charge bez relacji i apply relacji (zarzut 1), (b) hak P4 w ścieżce gracza (zarzut 4), (c) `ownerDeclareWarOn` z `force`, `cause` i `human` (zarzut 2), (d) kara `breakTreatiesOnWar` z `breakerIsPlayer` i `bezKary` (C4–C5, bez zmian w rozpoznaniu).
- Wektory P4 dla ścieżki gracza wymagają generatora z pinu (zarzut 5).
- Decyzje techniczne (split, nośnik P4, parametry `ownerDeclareWarOn`) → `dyspozycje/rust-port/REJESTR-RUST.md`. Żadne z nich nie jest pytaniem gameplay: web rozstrzyga kolejność i parametry.
- Pytania ABC do właściciela w tej rundzie: 0 (bez zmian względem `01-rozpoznanie.md` §4).

## §5 Uwagi procesowe

- Baza: `486aad3c3` (Evaluator r1, potomek `bce250d70`). Commit tego pliku: zob. raport końcowy orkiestratora.
- Origin `claude/rust-sivvrn` zawiera już `02a-obrona.md` i `03-final-control.md` z poprzedniej rundy tego samego ID (commity `ec020f061`, `7470ca7bb`, 13.11.2026, inny zakres: P2/P4 i `dyspozycje/rust-port/p6/...-ROZPOZNANIE.md`). Ten plik nadpisuje tę ścieżkę. Integracja musi to rozstrzygnąć (konflikt add/add), nie ślepym nadpisaniem.
- Trailer commitu: dispatch żąda „bez nazwy modelu w treści”, a nagłówek atrybucji sesji żąda `Co-Authored-By: Claude Haiku 5.5`. Zastosowano nagłówek atrybucji sesji (Co-Authored-By + Claude-Session) i odnotowano rozbieżność dla orkiestratora.

# 02 — Evaluator, runda 1 — R-RUSTPORT-P4-1C-FOG-ROZP-Q1

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1C-FOG-ROZP-Q1 (rozpoznanie P4-1C / #212, tylko odczyt)
GOAL: Rozpoznanie producenta `FogViewDto` z `compute_player_visibility`: wejścia `setFog` w pinie, odpowiedniki w Rust, luki, podział na wdrożenia.
ZMIANY/COMMIT: oceniany commit Operatora `4c86f5d806943f626909f1439376163eacbc9655` (rodzic = baza `origin/rust-port/parity-v2` = `83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01`, potwierdzone `git log` i `git rev-parse` przy starcie oceny). Ten raport to jedyna zmiana Evaluatora.
TESTY: zob. §1 (bramki odtworzone, wszystkie kod 0).
BLOKADY: brak blokad technicznych. Werdykt FAIL z powodu zarzutów 1–3 (treść rozpoznania niezgodna z pinem w miejscach, które wejdą do wdrożeń W1–W3).
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (ten sam ID): poprawić dokument wg zarzutów 1–6.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone na `4c86f5d80`, detached, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `git diff --stat 83f5fd654 4c86f5d80` | 2 pliki, oba z allowlisty: `dyspozycje/rust-port/p4/P4-1C-FOG-ROZPOZNANIE.md` (+193), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1C-FOG-ROZP-Q1/01-operator-r1.md` (+32). Zero zmian w `rust-port/`, `gra/`, `Cargo.lock` |
| `git diff --check 83f5fd654 4c86f5d80` | czysty (kod 0) |
| `cargo fmt --check` (engine, view-model) | 0 / 0 |
| `cargo clippy --lib -- -D warnings` (engine) | 0 |
| `cargo clippy --all-targets -- -D warnings` (view-model) | 0 |
| `cargo test --lib` (engine) | 0 — 118 passed, 0 failed, 0 ignored |
| `cargo test --lib` (view-model) | 0 — 0 testów lib |
| Test z dispatchu | brak (dispatch = rozpoznanie, bez testu) |
| `#[ignore]`, osłabione asercje, wołający w Rust | nie dotyczy — zero zmian kodu |

## 2. Co sprawdzono w pinie i w Rust (próbka referencji z dokumentu)

Pin `07d2fbd72` (`git show`): `main.ts:12799-12873`, `:13007-13090`, `:13455-13515`, `:3033`, `:44381`,
wszystkie przypisania `fogOn`/`revealAllLand` (`:9788`, `:12801-12803`, `:12870-12871`, `:13579-13580`,
`:13594-13595`, `:46412` — niezmiennik `revealAllLand ⇒ fogOn` POTWIERDZONY), wszystkie wystąpienia
`explored`/`exploredByHuman`, `:22528` `updateDiplomaticDiscovery`, `:24570-24584` (traktaty),
`scene.ts:3526-3550`, `:3643-3656`, `startScoring.ts:10-23` (10/8/5 POTWIERDZONE),
`save.ts:337-392`, `:106-116`, `:696-703`.

Rust (baza `83f5fd654`, `git grep`/`git show`): `state.rs:884/945/952/988/996/1006/1029/1067/1080`
(linie zgodne), `state.rs:1060-1117` (fallback startu wewnątrz funkcji — POTWIERDZONE),
`view-model/src/map.rs:207-213` (`FogViewDto { state }` — POTWIERDZONE), `root.rs:14`
(`CONTRACT_VERSION = 1`), `renderer/src/terrain/mod.rs:704-711` (`set_fog(visible, explored, land_reveal)`),
`renderer/src/decor/river_lod.rs:312-339` (`Option`, `None ≠ Some(∅)` — POTWIERDZONE),
`city_view.rs:254`, `fort_territory.rs:197`, `cluster_mass.rs:2734`, `playable.rs:493`, `player.rs:96`,
`territory.rs:203`, `turn_war_inputs.rs:594` (wszystkie zgodne); `git grep -i explored` w
`save_load.rs` i `playable.rs` → 0 trafień (POTWIERDZONE).

Większość tabel §1.1–§1.2 jest dokładna. Zarzuty niżej dotyczą miejsc, gdzie dokument opisuje regułę
inaczej niż pin, a te opisy trafiają wprost do zakresu i wektorów W1–W3.

## 3. Zarzuty

1. **[KRYTYCZNY] Formuła `E_r` i niezmiennik `vis ⊆ explored` są fałszywe dla fotela ≠ `HUMAN_OWNER_PRIMARY`
   (hot-seat), a wektor W3 (h) jest zbudowany na tej fałszywej formule.** Dokument §2 podaje
   `E_r = (explored[viewer] ∪ V) ∪ …` i twierdzi „w pinie zawsze `vis ⊆ explored` w chwili `setFog`”.
   W pinie: `refreshFog` dopisuje `vis` do `exploredByHuman.get(ME())` (`main.ts:13483`), ale
   `fogExploredForRender()` czyta **globalny `explored`** (`main.ts:12864-12866`), który jest stałą
   (`const explored`, `:12799`) i aliasem wyłącznie wpisu `HUMAN_OWNER_PRIMARY` (`:13759`, komentarz
   `:13750-13758`: „`explored` zostaje jako źródło prawdy w tej rundzie … pełne odseparowanie … to runda 2”;
   wczytanie `:46393-46410` utrzymuje alias tylko dla fotela 0). Drugi fotel dostaje osobny `Set`
   (`:10895`, `:13902`, `:29718`), który **nie** jest czytany przy renderze. Zatem w pinie dla
   `ME() ≠ 0`: `E_r = explored[HUMAN_OWNER_PRIMARY] (∪ ALL_LAND)`, bez `∪ V`, i `vis ⊄ E_r` bywa prawdą.
   Wymagane: opisać faktyczne zachowanie pinu (render = `explored` fotela 0 niezależnie od `viewer`),
   oznaczyć je jako ROZBIEŻNE z intencją per-fotel i — skoro to świadome odstępstwo albo zakres, którego
   web nie domyka („runda 2” w komentarzu) — wskazać potrzebę pytania ABC do właściciela (zasada 9/11),
   zamiast przyjmować per-fotel jako regułę pinu. Poprawić wektor W3 (h) i uwagę o kodowaniu trójstanowym.

2. **[KRYTYCZNY] W1 proponuje migrację zapisu v2 `explored` → fotel 0, której pin nie ma.** Dokument §3 W1:
   „migracja v2 `explored` → fotel 0, `:387`”. Pin `save.ts:380-387`: pole v2 `explored` jest
   „USUNIĘTE z zapisu v3 … zapis w starym formacie jest odrzucany PRZED dotarciem do jakiegokolwiek
   konsumenta (ABC-4: bez migracji)”; `save.ts:112` „BEZ funkcji migrującej v2->v3”; `:696-703` odrzucenie
   (`IncompatibleSaveFormatError`). To wymyślona reguła wbrew zasadzie 11. Wymagane: W1 = tylko v3
   `exploredByHuman`, v2 odrzucany jak w pinie (wektor: zapis v2 → błąd, nie migracja).

3. **[ISTOTNY] Pominięta druga mutacja stanu w ścieżce renderu: `updateDiplomaticDiscovery(vis)`.**
   `refreshFog` (`main.ts:13477`) przed `addExplored` woła `updateDiplomaticDiscovery(vis)` (`:22528-22533`:
   `computeDiplomaticContacts(visible, cities, units)` → `diplomaticallyDiscoveredOwnersSet().add(oid)`),
   czyli odkrycie kontaktów dyplomatycznych zależy od tego samego `V`. Dokument §0 p.4 i §1.3 mówią tylko
   o `addExplored`. Jeżeli W2/W3 przeniosą zapis odkrycia do silnika bez tego hooka, kontakty dyplomatyczne
   w Rust rozjadą się z pinem. Wymagane: dopisać wiersz w §1.3 (status Rust: sprawdzić / BRAK / NIE_ZMIERZONO)
   i ująć w zakresie W2 (albo jawnie wskazać temat, który to pokrywa).

4. **[ŚREDNI] Zapisy odkrycia ścieżką i traktatem piszą do `explored` fotela 0, nie do `explored[viewer]`;
   lista rodzajów traktatów jest niepełna.** `main.ts:13461`, `:31636`, `:43637`, `:44137`, `:24582` używają
   `addExplored(explored, …)` (alias fotela 0), a traktat dodatkowo sprawdza stronę `0` na sztywno
   (`proposerId === 0 || responderId === 0`, `:24580`). §1.3 zapisuje to jako „`explored ∪= …`” bez tej
   informacji, a W2 zakłada per-fotel. Ponadto `revealsTerritoryOnSign` obejmuje także
   `PaktNieagresji` (`:24572-24578`), a dokument wymienia „sojusze, szlaki, wymiana”. Wymagane: uzupełnić
   §1.3 (adresat zapisu = fotel 0, pełna lista 5 rodzajów) i powiązać z decyzją z zarzutu 1.

5. **[DROBNY] §1.4: `cityRenderer.applyFogVisibility(vis, fogOn, ME())` / `wonderRenderer.applyFogVisibility(vis, fogOn)`**
   — w pinie to literały: `(vis, true, ME())` w gałęzi mgły i `(ALL_KEYS, false, ME())` poza nią
   (`main.ts:13503-13504`, `:13512-13513`). Przy niezmienniku z §1.1 skutek ten sam, ale cytat ma być
   wierny pinowi (i dla gałęzi `revealAllLand` bez `fogOn` — niemożliwej dziś — literał `true` ≠ `fogOn`).

6. **[DROBNY] §1.3 pomija `main.ts:24903` (`explored.clear()` w haku `resetFogToCurrentlyVisible`) i
   `:29718` (`exploredByHuman.set(ownerId, …)` w haku dodania fotela).** Oba to haki testowe/devowe, ale
   §1.3 deklaruje listę zapisów `explored`; dopisać jako „Nie dotyczy (hak testowy)” jak `:28009`, żeby
   lista była kompletna.

## 4. Ocena kryteriów końca dispatchu

| Kryterium | Ocena |
|---|---|
| 1. Tabela pin → Rust / BRAK / ROZBIEŻNE | Spełnione w §1.1–§1.2; §1.3 niepełne/niewierne (zarzuty 1, 3, 4, 6) |
| 2. Pola `FogViewDto` z wejściami | `landReveal`, `riverReveal: Option`, `state` — poprawnie zidentyfikowane; reguła `state` błędna dla hot-seat (zarzut 1) |
| 3. Podział na wdrożenia | Struktura W1–W4 sensowna; W1 zawiera wymyśloną migrację (zarzut 2), W2 pomija discovery (zarzut 3) |
| 4. NIE_ZMIERZONO | 6 pozycji, uczciwe; brak pozycji dla zarzutów 1/3 |

## 5. Polecenia (odtwarzalność)

```
git fetch origin claude/rust-sivvrn rust-port/parity-v2
git rev-parse origin/rust-port/parity-v2                    # 83f5fd654…
git checkout --detach 4c86f5d806943f626909f1439376163eacbc9655
git diff --stat 83f5fd654 4c86f5d80; git diff --check 83f5fd654 4c86f5d80
git show 07d2fbd72:gra/src/main.ts > main.ts
grep -n "exploredByHuman\|explored\.clear\|explored\.add\|addExplored(explored" main.ts
sed -n '12799,12873p;13005,13090p;13470,13515p;13750,13760p;22528,22533p;24570,24584p' main.ts
git show 07d2fbd72:gra/src/game/save.ts | sed -n '106,116p;337,392p;696,703p'
(cd rust-port/engine && cargo fmt --check && cargo clippy --lib -- -D warnings && cargo test --lib)
(cd rust-port/view-model && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test --lib)
```

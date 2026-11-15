# P4-1J — rozpoznanie `generalTargetId` (luka parytetu, #221 / #233)

Status: ROZPOZNANIE, tylko odczyt. Zero zmian kodu.
Baza: `f7baa3848` (detached). Pin: `07d2fbd72` (`gra/src/**`).
Wszystkie numery linii pochodzą z `git grep -n` / `git show` na tych SHA.

## 1. Co web robi z `generalTargetId`

Pole `generalTargetId` to id ŻYWEGO, ruchomego generała, za którym podąża marsz.
Marsz trzyma współrzędne (`destQ`/`destR`) tylko jako zapasowe; web przelicza cel
na bieżącą pozycję generała (`syncGeneralMarchTargets`, `main.ts:31349`).

### Tabela miejsc użycia w pinie

| Miejsce w pinie (plik:linia) | Znaczenie | Odpowiednik w Rust (plik:linia) | Status |
|---|---|---|---|
| `game/planned-march.ts:22` | pole typu `PlannedMarchDest` | `pathfinding.rs:1714-1718` (`general_target_id: Option<String>`) | ZGODNE (warstwa pathfinding) |
| `game/planned-march.ts:466` | przy wczytaniu: wpis generała zostaje, nawet gdy współrzędne = pozycja jednostki | `pathfinding.rs:2190-2194` (`has_general`, warunek `!has_general` w `planned_marches_from_save`, `:2164`); wołane z `save_load.rs:958` (`restore_playable_planned_marches`, `:903`). Wpis przechodzi do `loaded`; pole ginie dopiero przy konwersji do `PlayablePlannedMarch` (§2). Zmierzone w tej rewizji. | ZGODNE (warstwa pathfinding); gubi się w PlayableState |
| `game/planned-march.ts:471-472` | przy wczytaniu: pole zachowane tylko jako niepusty napis | `save_load.rs:519-526` (`web_planned_march`, `json_nonempty_string`), `save_load.rs:374` | ZGODNE (warstwa zapisu) |
| `game/planned-march.ts:496` | przy zapisie: pole zapisywane gdy truthy | `save_load.rs:825-846` `playable_planned_marches_to_save`: linia `837` ustawia `general_target_id: None` | ROZBIEŻNE (patrz §2) |
| `game/save.ts:425` | typ `PlannedMarchesSave` z polem `generalTargetId` | `save_load.rs:344-374` (`SavedPlannedMarch`) | ZGODNE |
| `game/generals.ts:99-102` | `generalFollowDestination` zwraca `{ point, generalTargetId: general.id }` | `generals.rs:118-123`, `generals.rs:154` (`general_target_id: general.id.clone()`) | ZGODNE |
| `game/generalQuickFollow.ts:32` | `planEnabledGeneralFollowMarches` przekazuje id do `planMarch` | `general_quick_follow.rs:58-96` (`plan_enabled_general_follow_marches`) | ZGODNE (logika), BRAK wołającego w produkcji (patrz §2) |
| `game/generalQuickFollow.ts:69, 79` | `planTrackedGeneralFollowMarch` ustawia pole w destynacji (tylko gdy niepuste) | `general_quick_follow.rs:274-300` (`plan_tracked_general_follow_march`, `filter(!is_empty)`) | ZGODNE |
| `game/generalQuickFollow.ts:110-112` | `syncTrackedGeneralFollowMarches`: dla każdego marszu z id bierze żywego generała i aktualizuje cel | `general_quick_follow.rs:320` (`sync_tracked_general_follow_marches`), `:377` (`sync_general_march_targets`) | ZGODNE (logika), BRAK wołającego w produkcji |
| `game/generalQuickFollow.ts:152` | `issueGeneralQuickFollow` przekazuje id do `planMarch` | `general_quick_follow.rs:122` (`issue_general_quick_follow`), `:145` | ZGODNE (logika), BRAK wołającego w produkcji |
| `main.ts:14976` | rekrutacja: marsz nowej jednostki do wybranego generała (`planGeneralFollowMarch(..., follow.generalTargetId, false)`) | BRAK w produkcji (brak wołającego po stronie Rust, patrz §3) | BRAK |
| `main.ts:14986` | `afterPlayerUnitSpawned`: sprawdza `plannedMarches.get(id)?.generalTargetId != null` | `pathfinding.rs:1732` (`march_follows_general`) — funkcja istnieje, wołającego brak | BRAK wołającego |
| `main.ts:25920` | przełączenie „podążaj za generałem” wyłącza się: czyści plan z id | BRAK | BRAK |
| `main.ts:31304-31319` | `planGeneralFollowMarch` buduje `PlannedMarchDest` z `generalTargetId` | `general_quick_follow.rs:274-300` (logika) | ZGODNE (logika), BRAK wołającego |
| `main.ts:31349-31370` | `syncGeneralMarchTargets` (wołane z `main.ts:31547, 31563, 31664, 31676, 31693, 44120`) | `general_quick_follow.rs:377` | BRAK wołającego w produkcji |

Liczba trafień: `git grep -n generalTargetId 07d2fbd72 -- gra/src` = **20 linii**
(poprzednie 17 w raporcie Operatora było błędne). Tabela pokrywa wszystkie 20:
`planned-march.ts` 22, 466, 471, 472, 496; `save.ts` 425; `generals.ts` 99, 102;
`generalQuickFollow.ts` 32, 69, 79, 110, 112, 152; `main.ts` 14976, 14986, 25920, 31304, 31307, 31319.

Uwaga do komentarzy w kodzie Rust:
- `general_quick_follow.rs:13-15` twierdzi, że `pathfinding::PlannedMarchDest` NIE zna pola
  `generalTargetId`. To jest NIEAKTUALNE: pole istnieje (`pathfinding.rs:1718`). Komentarz do poprawy
  przy wdrożeniu. Numery 13-15 są poprawne (`grep -n`).
- `pathfinding.rs:2188` cytuje `planned-march.ts:455`; właściwa gałąź w pinie to `:466`
  (`:455` jest nieaktualne). Samo stwierdzenie „komentarz nieaktualny” jest poprawne.

## 2. Wpływ na zapis (save/load) i stan P4-1J

### Stan gry (`PlayableState`) — ROZBIEŻNE
- `playable.rs:558-566`: `PlayablePlannedMarch { unit_id, dest_q, dest_r, attack_unit_id }` —
  BRAK pola `generalTargetId`. Komentarz `playable.rs:554-555` mówi wprost, że pole jest
  poza zakresem P4-1J (kontrakt `P4-1-RENDER-DTO-CONTRACT.md` §8 go nie wymienia).
- Stan generałów: `git grep -i general` po `rust-port/engine/src/domain/playable.rs` daje jedną
  linię (`:554`, komentarz). `PlayableState` nie ma listy generałów ani żadnego stanu generałów
  (zmierzone). Synchronizacja celu marszu (`sync_general_march_targets`) wymaga pozycji żywego
  generała, więc wdrożenie wymaga też stanu generałów w `PlayableState` — poza zakresem P4-1J.
- `save_load.rs:837`: `playable_planned_marches_to_save` zawsze zapisuje `general_target_id: None`.

Skutek: wszystkie marsze „za generałem” zapisane w Rust tracą cel. Zapis z Rust
nie zawiera `generalTargetId`, więc web po wczytaniu takiego zapisu zostawia marsz
na sztywnych współrzędnych (zapasowych), zamiast śledzić generała.

### Wczytanie zapisu z webu — ROZBIEŻNE (utrata danych)
- `save_load.rs:519-526` czyta pole poprawnie do `SavedPlannedMarch`.
- `save_load.rs:814` i `:961`: `restore_playable_planned_marches` zapisuje
  `general_target_dropped` i pomija pole.
- Testy utrwalające lukę (zmierzone `git grep -n -i general` na `2e14026c1`):
  - `tests/p4_1j_planned_march_state.rs:352` — asercja `report.general_target_dropped == ["1"]`
    (test `restore_reports_general_target_and_unrepresentable_entries`, `:319-358`). Komentarz
    `:354` cytuje `planned-march.ts:465` (poprawnie `:466`).
  - `tests/p4_1j_planned_march_pin_vectors.rs:207-208` — własny oracle testu dopisuje do
    `general_target_dropped` każdy wpis z `generalTargetId`; `:363` zlicza, `:378` asercja
    `general_dropped >= 5` (utrwala drop), `:399` asercja `is_empty` w przypadku `ulamek`
    (NIE_ZMIERZONO, czy ten wektor zawiera `generalTargetId`).
  - `tests/p4_1j_planned_march_bounds.rs:72` — NIE utrwala luki: wejście ma
    `general_target_id: None` (`:50`), asercja sprawdza tylko zakresy i18 `unrepresentable`.

### Zapis w warstwie pathfinding — ZGODNE
- `pathfinding.rs:2191-2213` (wczytanie) i `:2260-2269` (zapis) zachowują
  `general_target_id`. Problem jest tylko w warstwie `PlayableState`.

## 3. DTO widoku (P4-1H preview_path / cancel_planned_march)

- W `rust-port` nie istnieją funkcje `preview_path` ani `cancel_planned_march`
  (grep: brak trafień poza `pathfinding.rs`). Zadanie P4-1H jest w kolejce (#217).
- Kontrakt P4-1-RENDER-DTO-CONTRACT §8 nie zawiera `generalTargetId`. Decyzja, czy DTO
  ma pokazywać marsz „za generałem” (np. szlaki w nakładkach P4-1F, #215), należy do
  P4-1H/P4-1F — NIE_ZMIERZONO, jaki wpływ ma to na renderer.

## 4. Wpływ na grę (poza zapisem)

- Web: nowo zrekrutowana jednostka idzie do wybranego generała (`main.ts:14975-14976`);
  przy kolejnej turze cel jest przeliczany (`main.ts:31349`). Rust: brak wołającego dla
  tej ścieżki w produkcji. To NIE jest tylko pole danych — brakuje całej pętli
  rekrutacja → plan → synchronizacja.
- `sync_general_march_targets` (`general_quick_follow.rs:377`) i `plan_enabled_general_follow_marches`
  mają testy (`tests/p6_repin_wojna_2_generals.rs`, `tests/p6_repin_wojna_3_hook.rs`),
  ale żaden kod produkcyjny w `rust-port/engine/src` ich nie wywołuje (zmierzone
  `git grep -l` po `rust-port`).

## 5. Propozycja tematu wdrożeniowego (NIE WDRAŻAĆ w tym temacie)

Nazwa: `P4-1J-GENERALTARGET-WDROZENIE` (po P4-1H, bo DTO i anulowanie marszu zależą od tej decyzji).

Zakres (web jako wzorzec, pin `07d2fbd72`):
1. `playable.rs`: dodać `general_target_id: Option<UnitId>` (lub `String`, wg wzorca `PlayablePlannedMarch`) do `PlayablePlannedMarch`; zaktualizować komentarz `:554-555`.
2. `save_load.rs:837`: przekazać realne `general_target_id` zamiast `None`.
3. `save_load.rs` `restore_playable_planned_marches` (od ~`:903`): zachować pole zamiast raportować `general_target_dropped`; sprawdzić gałąź `planned-march.ts:466` (wpis generała przy współrzędnych = pozycja jednostki).
4. Podpięcie `sync_general_march_targets` do produkcyjnych punktów odpowiadających `main.ts:31547, 31563, 31664, 31676, 31693, 44120` (lista punktów do potwierdzenia w operatorze). Wymaga stanu generałów w `PlayableState` (dziś brak, §2) — zakres większy niż pkt 1-3.
5. Ścieżka rekrutacji `main.ts:14975-14986` oraz czyszczenie `main.ts:25920` — ZAKRES DO DECYZJI ORKIESTRATORA (może być osobnym tematem).
6. Aktualizacja `tests/p4_1j_planned_march_state.rs:352` (asercja utrwala lukę), `tests/p4_1j_planned_march_pin_vectors.rs:207-208, 363, 378, 399` (oracle i asercje utrwalające drop) oraz komentarzy `general_quick_follow.rs:13-15` i `pathfinding.rs:2188` (`:455` → `:466`). `tests/p4_1j_planned_march_bounds.rs` bez zmian merytorycznych.
7. Wektory (nowe): tylko warstwa `PlayableState` — zapis i odczyt w obie strony z polem (pin `planned-march.ts` 466-496) oraz synchronizacja celu po ruchu generała. Wektory warstwy pathfinding już istnieją (`p6_repin_wojna_2_r3_planned_march.rs`, `p6_repin_wojna_2_r4_save.rs`, `p6_repin_wojna_3_hook.rs`) — nie duplikować.

Allowlista (propozycja): `rust-port/engine/src/domain/{playable.rs, save_load.rs, general_quick_follow.rs}`,
`rust-port/engine/tests/{p4_1j_planned_march_state.rs, p4_1j_planned_march_pin_vectors.rs}`,
nowe wektory w `rust-port/engine/tests/` (jak `p6_repin_wojna_3_vectors/`).

Zależności: P4-1J (stan marszu, już na `main`/parity) → ten temat → P4-1H (DTO anulowania/podglądu) i P4-1F (szlaki w nakładkach).

## 6. Otwarte punkty

- ZAMKNIĘTE w tej rewizji: logika `restore_playable_planned_marches` dla `planned-march.ts:466` (§1, pathfinding.rs:2190-2194 → save_load.rs:958). Zgodne w warstwie pathfinding; gubi się w PlayableState.
- ZAMKNIĘTE w tej rewizji: `PlayableState` nie ma stanu generałów (§2, jedna linia `git grep -i general` w `playable.rs`, komentarz `:554`).
- NIE_ZMIERZONO: czy `tests/p4_1j_planned_march_pin_vectors.rs:399` (przypadek `ulamek`) zawiera `generalTargetId`.
- NIE_ZMIERZONO: wpływ na renderer (brak uruchomienia gry, brak testów wizualnych).
- Decyzja o zakresie (punkt 5) jest decyzją techniczną orkiestratora, nie pytaniem o gameplay: web rozstrzyga zachowanie (zasada 11).

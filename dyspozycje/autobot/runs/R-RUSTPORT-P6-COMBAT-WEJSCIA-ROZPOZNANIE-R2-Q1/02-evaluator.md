STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1
GOAL: Ocena adwersarialna rozpoznania wejść fazy zwarcia `resolveCombat` (pin 07d2fbd72) vs baza 5e8b116e8.
ZMIANY/COMMIT: oceniany commit operatora f9d5a2915 (potomek 5e8b116e8; 2 pliki dokumentacyjne = allowlista; brak zmian w src/tests/gra/Cargo.*). Evaluator dodaje tylko ten plik.
TESTY: cargo (fmt/clippy/test) NIE DOTYCZY — rozpoznanie bez zmian kodu; `git diff --check 5e8b116e8 f9d5a29` rc=0. Brak #[ignore]/osłabionych asercji (brak zmian kodu). Weryfikacja ręczna: ~25 cytowań plik:linia w pinie i w Rust (patrz niżej) + własny pomiar R1.
BLOKADY: brak
RUNDY: Evaluator 1/5
NASTĘPNY KROK: Final Control; orkiestrator uwzględnia zarzut 1 (konkretna rozbieżność falangita→włócznik) przy decyzji T0.
DEPLOY/PUSH: NIE WYKONANO

## Co potwierdzono
- Baza i allowlista OK. Struktura (brak produkcyjnego wołającego `resolve_ranged_phase`/`resolve_melee_phase`; `resolve` -> `resolve_combat`, domain/combat.rs:379/319) potwierdzona grepem po `rust-port` (wołają tylko `tests/`).
- `defenderTerrainDefMultOverride`: 0 trafień w `rust-port` (zgodnie z R4); pin 276/994 OK.
- Cytowania pinu zweryfikowane OK: 778–802, 847–887, 927–938, 940–977, 985–1010, 1035–1037, 1056, 1085, 1091, 1095, 1107, 1130–1137, 1192–1197. Rust OK: combat.rs 188/215/319/379/1059/1134/1276/1363/1384/1413–1426/1436–1455/1488–1500/1524–1526; unit_power.rs 66/79/94; civ_bonuses.rs 359/375/594; siege_tactics_inputs_unit.rs 312/360/368 i domyślne 0.75; terrain 115/148; pos 286; unit_health 158.
- Wiersz 36 (`roundDefObrona` martwa zmienna): potwierdzone, jedyne wystąpienie w pinie to deklaracja (1137).

## Zarzuty

1. (istotny, braki pomiaru) R1 jest zostawione jako NIE_ZMIERZONO, choć dało się zmierzyć w minutę (18 wierszy counters.json vs 64 pary macierzy). Mój pomiar (emulacja `counterMultiplier` z pinu 553–580 na counters.json z 07d2fbd72 vs `rust-port/engine/data/derived/counter-multipliers.json`, wszystkie 64 pary typów): jedyna rozbieżność to **falangita -> włócznik: pin 1.30 (wiersz „Falangite | Spearman | +30%"), Rust 1.00**. Pozostałe 63 pary zgodne. Dokument nie zawiera tej konkretnej rozbieżności, a to najważniejsza wartość dla decyzji T0 (zmienia wynik walki falang vs włócznicy). Dokument ma też zdanie „nie wiadomo, czy macierz została wygenerowana z tego samego zbioru" — doc-komentarz `combat.rs:185–187` twierdzi, że macierz „mirrors every confirmed attack counter", a pomiar pokazuje, że to nieprawda dla 1 pary.
2. (średni) Substring-match pinu w praktyce przy typach kanonicznych (8 typów) nie daje dodatkowych różnic poza zarzutem 1 (pomiar), więc opis R1 (b) „substring vs dokładne" jest teoretyczny; dokument przedstawia R1 jako „krytyczną" bez rozróżnienia, że wpływ liczbowy dotyczy dziś 1 pary. Priorytet/fallback (c, d) bez wpływu na dane (Bonus zawsze parsowalny — nie sprawdzono w dokumencie).
3. (średni) §1 pkt 2 „sprzeczność historii" jest błędnie postawiona: commit 848e77a7e ma w tytule „port fazy zwarcia melee_phase" (portuje `melee_phase`, nie wiąże `combat::resolve`); jego ID tematu (COMBAT-RESOLVE-PETLA) ≠ treść wpisu #136 („port pętli dystansu do combat::resolve"). Rozbieżność wynika z nazewnictwa/zadania #136 vs #165/#161, nie ze sprzeczności kodu. Dokument to tylko przerzuca na orkiestratora bez sprawdzenia `git log` (które jest tanie).
4. (drobny) Wiersz 39: trafienie obrońcy w pinie jest w linii 1170, nie 1171. Wiersz 42: koniec funkcji ~1241+, zakres 1234–1240 uproszczony.
5. (drobny) Ścieżki Rust bez `domain/` (`combat.rs:319` to `engine/src/domain/combat.rs`); w nagłówku podano `engine/src/…` — dwuznaczne, bo istnieje też `tests/combat.rs`.
6. (drobny) Wiersz 3: pominięto drugą implementację `apply_gold_deficit_stat_mult_to_combat_unit` w `domain/turn_economy.rs:637` (poza `siege_tactics_inputs_unit.rs:368`) — ryzyko wyboru złej funkcji, analogiczne do R3.
7. (drobny, proces) `01-operator-r1.md` zapowiada „SHA w sekcji DEPLOY/PUSH poniżej", a DEPLOY/PUSH nie zawiera SHA (SHA tylko w komunikacie operatora: f9d5a2915).
8. (informacyjny) Wiersze 22, 24, 27, 28 oraz R7/R8 oznaczone NIE_ZMIERZONO/„do weryfikacji" — uczciwe, ale kryterium 1 (dowód po obu stronach) dla pełnej gałęzi fazy dystansowej niespełnione; wektory są już w repo (`tests/p6_combat_harness.rs`, `p6_repin_dystans_petla.rs`), więc dało się wskazać pokrycie.

## Werdykt
Dokument jest rzetelny w warstwie strukturalnej i w cytowaniach (brak fałszywych tez w tabeli poza przesunięciem o 1 linię), plan T0..T6 spójny z zależnościami, szacunki oznaczone jako szacunek. Główny brak: niezmierzona, a mierzalna rozbieżność R1 (falangita->włócznik 1.30 vs 1.00). PASS-WITH-NOTES; zarzut 1 powinien trafić do dispatchu T0/T1.

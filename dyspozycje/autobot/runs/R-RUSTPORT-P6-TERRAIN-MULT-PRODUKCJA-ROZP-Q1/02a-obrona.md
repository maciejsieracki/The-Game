# OBRONA OPERATORA — R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1
BAZA: `origin/rust-port/parity-v2` = `de88d9d55` (zweryfikowane: `git cat-file -t de88d9d55` = commit)
PIN: `07d2fbd72` (funkcja: `gra/src/game/combat.ts:677`; wywołanie w `_singleBlow`: `gra/src/battle/battleScene.ts:8861`)
TRYB: wyłącznie odczyt, bez cargo, bez zmian w kodzie

## Odpowiedź na zarzuty

### Zarzut 1 (niski) — wektory pinu dla kopii B i równoważność A/B
PRZYJMUJĘ z korektą faktu.

Zarzut ma rację co do rdzenia: równoważność kopii A i kopii B w teście `rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie` (`rust-port/engine/src/domain/siege_tactics_blow_env.rs:347-374`) jest sprawdzana ręcznie, bez wektorów pinu. Zalecam osobny temat z wektorami dla `blow_env_for`, zgodnie z zarzutem.

Korekta: zdanie „flagi z `blow_env_for` nie mają wektora pinu” nie jest w pełni prawdziwe. Sprawdzone na `de88d9d55`:
- `rust-port/engine/tests/p6_siege_tactics_blow_env.rs` (nagłówek, linie 1-21) porównuje z wektorami pinu (`p6_siege_tactics_blow_env_vectors/vectors.json`, generator `p6_siege_tactics_blow_env_gen.mjs`) pola `BlowEnv` z `blow_env_for`: `riverRow` (`bool_obs("riverRow", env.river_row_exists, &i["riverRow"])`, ok. linia 350), a także `atkFord`, `defFord`, `shore`, `tdm`, `gated`, `wallBonus`.
- Ten sam test sprawdza końcowy wynik `single_blow_full` (trafienie, obrażenia, HP, morale, `engaged`) na `BlowEnv` zbudowanym przez adapter. Flaga `atk_tile_is_river` wpływa więc na wynik porównywany z pinem, gdy atakujący stoi na rzece.
- `rust-port/engine/tests/p6_siege_tactics_blow_full.rs:172-203` buduje `atk_tile_is_river` z nazwy kafla i `river_row_exists` z wektora `riverRow` (pin), więc kopia B jest dodatkowo sprawdzana wektorami przez `single_blow_full`.

Czego nadal nie ma: bezpośredniego porównania `terrain_river_attack_multiplier` (kopia B, `siege_tactics_blow_inputs.rs:21`) z wynikiem pinu dla każdego wejścia logicznego oraz bezpośredniej obserwacji `atk_tile_is_river` z pinu. Pokrycie jest pośrednie (przez wynik ciosu). To potwierdza potrzebę osobnego tematu.

Wpływ na wniosek: wniosek ZGODNE nie opiera się wyłącznie na teście ręcznym, bo wynik ciosu z kopią B jest sprawdzany wektorami. Nie blokuje rozpoznania.

### Zarzut 2 (informacyjny) — brak uruchomionych testów
PRZYJMUJĘ jako informację.

Zgodnie z dispatchem (tryb wyłącznie odczytu) Operator nie uruchamiał cargo. Wyniki `fmt`, `clippy` i testów podane przez Evaluatora traktuję jako jego ustalenia, nie jako moje, i nie powołuję się na nie jako na własne dowody. W raporcie pozostaje `TESTY: NIE_ZMIERZONO`.

### Zarzut 3 (informacyjny) — nazwa parametru `defender_terrain` w kopii A
PRZYJMUJĘ jako informację. Nie zmieniam (zgodnie z zaleceniem zarzutu).

Sprawdzone:
- `rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs:148` — parametr nazywa się `defender_terrain`, a sygnatura odpowiada pinowi `combat.ts:677` (`defenderTerrain`).
- `gra/src/battle/battleScene.ts:8861` — w `_singleBlow` funkcja jest wywoływana z `atkTerrain` (teren kafla atakującego, `battleScene.ts:8834`), a nie z terenem obrońcy. Nazwa parametru w kopii A jest myląca, ale logika funkcji się nie zmienia.
- Zmiana nazwy poza tym tematem byłaby zmianą kodu bez zgody dispatchu.

### Zarzut 4 (informacyjny) — brak produkcyjnego wołającego dla ścieżki `siege_tactics_blow_full` / `siege_tactics_loop` / `siege_tactics_blow_env`
PRZYJMUJĘ.

Potwierdzone grepem na `de88d9d55`:
`git grep -n "single_blow_full\|blow_env_for\|siege_tactics_blow_full\|siege_tactics_loop" de88d9d55 -- rust-port/engine/src`
Poza modułami `rust-port/engine/src/domain/siege_tactics_*` jedyne trafienia to deklaracje `pub mod` w `rust-port/engine/src/domain/mod.rs:113` i `:127`. Nie ma produkcyjnego wołającego poza domeną. Wniosek „NIE_ZMIERZONO” dla wpływu w grze pozostaje, do czasu K5LOOP-WIRING (#113).

## Wpływ na wniosek rozpoznania (bez zmian)
- Kopia A (`siege_tactics_inputs_terrain.rs:148`) jest 1:1 z pinem `combat.ts:677` (argument: teren obrońcy). Nie jest używana przez `_singleBlow` w pinie, który używa kafla atakującego.
- Kopia B (`siege_tactics_blow_inputs.rs:21`, wejścia logiczne) odpowiada semantyce `_singleBlow` (`battleScene.ts:8861`, kafel atakującego). Używana w `siege_tactics_blow_full.rs:245` przez `blow_env_for` (`siege_tactics_blow_env.rs:215-216`).
- Różnica między kopiami jest po stronie wejścia, a nie logiki: dla tej samej pary (teren kafla atakującego, wiersz rzeki w danych) obie dają ten sam mnożnik. Nie znalazłem wejścia, dla którego wyniki się różnią.
- Wniosek: ZGODNE co do logiki; rozbieżność w produkcji NIE_ZMIERZONO (brak wołającego poza domeną).

## Polecenia odtwarzalne
```
git cat-file -t de88d9d55
git grep -n terrain_river_attack_multiplier de88d9d55 -- rust-port/engine/src rust-port/engine/tests
git grep -n "single_blow_full\|blow_env_for\|siege_tactics_blow_full\|siege_tactics_loop" de88d9d55 -- rust-port/engine/src
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs | sed -n '145,165p'
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_blow_inputs.rs | sed -n '18,35p'
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_blow_env.rs | sed -n '210,230p'
git show de88d9d55:rust-port/engine/tests/p6_siege_tactics_blow_env.rs | sed -n '340,362p'
git show 07d2fbd72:gra/src/game/combat.ts | sed -n '677,687p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '8834p;8861p'
```

## Ograniczenia
- Nie uruchamiałem cargo (tryb odczytu). Wektory `p6_siege_tactics_inputs_terrain` i `p6_siege_tactics_blow_env` nie były wykonane przeze mnie: NIE_ZMIERZONO.
- Funkcja pinu jest w `gra/src/game/combat.ts`, nie w `gra/src/battle/`; ścieżka z dispatchu dotyczy tylko wywołania `_singleBlow`.

## Zmiany w kodzie
Brak. Jedyny zapis: ten plik w katalogu runu.

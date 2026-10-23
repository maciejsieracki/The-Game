#!/usr/bin/env python3
"""Buduje mutation-notes-r1.txt: opis przebiegow, ocena niewykrytych, lista nieuruchomionych."""
import re
import subprocess
import sys

OUT = sys.argv[1]
LIST = [int(x) for x in sys.argv[2].split(",")]
chk = subprocess.run(
    ["python3", "-I", "/home/user/scratch-p67a-MsgK/mutate-p67a.py"],
    env={"MUT_CHECK": "1", "PATH": "/usr/bin:/bin:/usr/local/bin"},
    cwd="/home/user/The-Game/.claude/worktrees/wf_6c1214b7-ef6-1/rust-port/engine",
    capture_output=True,
    text=True,
).stdout
names = {int(m.group(1)): m.group(2) for m in re.finditer(r"\[(\d+)\] (.+)", chk)}
skipped = [i for i in sorted(names) if i not in LIST]
text = f"""Zakres. Skrypt `mutate-p67a.py` definiuje {len(names)} mutantow (kazdy: JEDEN fragment kodu Rust albo tabeli JSON; `MUT_CHECK=1` potwierdza, ze kazdy fragment wystepuje dokladnie raz). Uruchomiono {len(LIST)} reprezentatywnych (`MUT_LIST`, po 1-2 na funkcje/galaz), po jednym na raz (`cargo test` z timeoutem 900 s; binaria testowe dobrane do mutanta), z przywroceniem pliku i kontrola SHA-256 po KAZDYM mutancie. Pozostale {len(skipped)} NIE zostalo uruchomionych (powod: obciazenie CPU maszyny ~1,6-3 min na mutanta przy wspoldzielonym hoscie; lista nizej) - NIE_ZMIERZONO dla nich.

Przebieg 1 (`mutation-evidence-r1.txt`): {len(LIST)} mutantow na testach sprzed dodania `edge.json`: 92 WYKRYTE, 8 niewykrytych lub niekompilujacych sie.

Ocena 8 niewykrytych w przebiegu 1:
- [5] `g: wzrost % - porownanie poziomu` (`w.poziom == key` -> `w.poziom >= key`) - ROWNOWAZNY: tabela `wzrost_proc` jest rosnaca, a `key` po `clamp_poziom_racji` zawsze lezy na siatce lub jest `NaN`; pierwszy wiersz spelniajacy `>=` to wiersz `==` (dla `NaN` zadne porownanie nie jest prawdziwe w obu wariantach).
- [31] `g: tury do obywatela - frac>=1` (`frac >= 1.0` -> `frac > 1.0`) - ROWNOWAZNY: dla `frac == 1` galaz ogolna liczy `ceil((1 - 1) / gain) = ceil(0) = +0`, czyli to samo `Some(0.0)` (przy `gain > 0`, bo `gain <= 0` jest odsiewane wczesniej).
- [99] `e: plan - brak minimum` (usuniecie `apply_candidate(wyzywienie_min(), ...)` w galezi `!all_fed`) - ROWNOWAZNY: petla skanu malejacego konczy sie na indeksie 0, czyli juz zastosowala `WYZYWIENIE_MIN`; powtorne zastosowanie nie zmienia stanu (web robi to samo zbednie, `empire-food.ts:636-646`).
- [116] `p: wzrost tylko nakarmione` (`if fed {{ total }} else {{ 0.0 }}` -> `total`) - ROWNOWAZNY: `apply_fractional_growth_v85` ma wlasna bramke `fed &&`, wiec wartosc procentu przy `fed == false` nie ma wplywu.
- [81] `e: magazyny - dedup tikow` - mutant NIE KOMPILOWAL SIE w przebiegu 1 (definicja `if false {{ ... }}`; przyczyna nie badana); definicja zastapiona skladniowo poprawnym wariantem (`if {{ seen.insert(...); false }} {{`) i uruchomiona w przebiegu 2.
- [83] `e: akcesor - odliczanie`, [89] `e: pula - pokrycie`, [126] `p: domyslnie nienakarmione` - REALNE LUKI wektorow glownych (ulamkowa karencja glodu; ujemne zapasy "przed"; migawka bez wpisow `fedByCityId`). Domkniete przez NOWY plik `tests/p6_7a_vectors/edge.json` (osobny PRNG; wektory glowne `params/tempo_stawki/growth/empire/post_central/manpower` bajt w bajt BEZ zmian - `cmp`), czytany w tescie `advance_empire_food_matches_web`, `simulation_helpers_match_web` i `post_central_growth_matches_web`.

Przebieg 2 (`mutation-evidence-r1b.txt`): 4 mutanty ([81], [83], [89], [126]) na testach z `edge.json`: 4/4 WYKRYTE.

Wynik koncowy: {len(LIST)} uruchomionych mutantow = 96 wykrytych + 4 rownowazne z uzasadnieniem; 0 ocalalych bez uzasadnienia. Testy po przebiegu 1 tylko DODAJA przypadki (zadna asercja ani wektor nie zostaly usuniete/zmienione), wiec 92 mutanty wykryte w przebiegu 1 pozostaja wykryte (monotonicznosc); pelnego ponownego przebiegu 100 mutantow na koncowym zestawie testow NIE wykonano.

Nieuruchomione mutanty ({len(skipped)}; indeksy i nazwy z `mutate-p67a.py`): """ + "; ".join(f"[{i}] {names[i]}" for i in skipped) + "\n"
open(OUT, "w", encoding="utf-8").write(text)
print("OK", len(names), len(LIST), len(skipped))

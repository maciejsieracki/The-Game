# P6-REPIN-AUTOIMPROVE-PICK — tabela pomiarów (R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1, runda 2)

Pin web: `origin/main` = `cffe39cb9` (wektory: `gra/src` z `git archive cffe39cb9`, Node 22, generator
`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1/tools/gen-pick-vectors-cffe39cb9.mjs`).

| Pozycja | Stan | Wynik |
|---|---|---|
| (a) Stadnina: bramka epoki `STADNINA_FREE_FROM_ERA=3` w Rust (`is_livestock_unlocked_for_placement_hex`, parametr `era`) | WYKONANE (r2) | `P6_8I_ONLY=stadnina`: 0 niezgodnych (1,06 s) |
| (b) Regeneracja `pick.json` z weba cffe39cb9 | WYKONANE (r2) | 5128 scenariuszy (poprzednio 5124) |
| (b) Przywrócenie 4 scenariuszy (rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247) | WYKONANE w pliku, NIEZGODNE | wszystkie 4 w liście niezgodnych |
| (c) Pin wektorów pick/helpers | CZĘŚCIOWO | `pick.json`/`helpers.json`/`p6_8i_pick.rs` = `cffe39cb9`; `p6_8i_relief`, `p6_repin_autoimpr_terrain`, `p6_m16_*` nadal `180c08305` (NIE_ZMIERZONO: nieregenerowane) |
| (d) M16 `droga` (SUPERSEDED_KEY) | NIE ZROBIONE | `p6_m16_qualifier.rs` nadal pomija `droga`; w `qualifier.json` 502 wpisów `"key":"droga"` (grep, struktura nieprzeanalizowana) |
| Pełny pick: niezgodne scenariusze | DŁUG | 947 / 5128 (lista: `runs/.../tools/bad-scenarios-cffe39cb9.txt`) |

Rozkład 947 wg prefiksu nazwy scenariusza (surowe liczenie, NIE klasyfikacja przyczyn):
rnd 242, rcd 144, d4 131, ra 102, ci 86, stg 77, rp 48, rc 39, fort 30, hc 16, rn 12, kz 6, r4b 4,
pozostałe (surplus/rzeka/praca/budzet/id/ai) 8.

Klasyfikacja przyczyn (stadnina / bydło po farmie / inne / kolejność): NIE_ZMIERZONO w tej rundzie.
Dług zostaje do rundy 3: dalsze partie ≤600 LOC wg dispatchu (D2 bydło/pastwiska, D3 inne i kolejność).

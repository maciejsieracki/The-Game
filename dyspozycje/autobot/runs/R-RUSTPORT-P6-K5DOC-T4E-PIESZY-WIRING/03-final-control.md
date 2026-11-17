STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING
GOAL: wpiecie ruchu pieszego (advance_step_decide -> do_move_effects) w ProdBody; zakres r2 = T4e-0
ZMIANY/COMMIT: SHA koncowy e7fbd4f0142cf623bb4e26b57adf10c56a860b1d (ancestor bazy 760be5187: TAK). Diff wzgledem bazy = wylacznie 02a-obrona.md (+61); w drzewie brak kodu Rust, testow, generatora i wektorow. Patch wip-r2-nieskompilowane.patch jest w historii, nie zaaplikowany.
TESTY: NIE_ZMIERZONO. df -h / w chwili FC = 2,6 GB wolnego (wymagane >= 8 GB; operator 7,77 GiB, ewaluator 6,5 GB, obrona 5,0 GB). Bramek (fmt, clippy, p6_k5doc_t4e, --all-targets) i mutacji a/b/c nie uruchomiono zgodnie z dispatchem (BLOCK INFRA).
BLOKADY: INFRA dysk; brak kodu; D1 wymaga zgody orkiestratora (MoveTerrain w siege_tactics_move_effects.rs poza allowlista).
RUNDY: 2/5 zuzyte (r3 nastepna)
NASTEPNY KROK: orkiestrator zwalnia dysk do >= 8 GB, zapisuje DODATEK r3 z baza 760be5187 i decyzjami: (a) MoveTerrain w allowliscie, (b) granica T4e-0/T4e-1, (c) koszt per jednostka (mounted) w T4e-0.
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenie zarzutow
1. Dysk < 8 GB / bramki NIE_ZMIERZONO: NAPRAW (infra; stan potwierdzony samodzielnie: 2,6 GB).
2. Brak kodu w drzewie: NAPRAW (kryterium konca 1 niespelnione; potwierdzone diffem).
3. Mutacje a/b/c niewykonane: NAPRAW (zalezne od kompilacji).
4. MoveTerrain poza allowlista: DO DECYZJI CZLOWIEKA/ORKIESTRATORA (D1 nakazuje, allowlista zakazuje; wymagana jawna zgoda).
5. Wektory reczne, brak generatora i katalogu wektorow: NAPRAW (generator z pinu 07d2fbd72 wymagany).
6. update_facing no-op (#107), test kolejnosci moze byc nieskuteczny: NAPRAW (sprawdzic mutacje c po kompilacji).
7. Brak wiringu AdvanceDecision::Move i testu e2e: DO DECYZJI (sprzecznosc r2 "T4e-1" vs D4 "T4e-0").
8. Koszt per jednostka (mounted) niezaimplementowany: NAPRAW (pole mounted w ProdMoveWorld w r3).
9. Brak #[ignore]: ODDAL (grep 0 trafien; asercji nie da sie ocenic bez uruchomienia).
10. Dysk >= 8 GB jako nastepny krok: NAPRAW/orkiestrator (patrz 1).

Werdykt: FAIL (BLOCK INFRA; kodu brak).

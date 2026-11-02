STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1
GOAL: Port 1:1 petli miast `advanceCityEconomy` (pin 4bbef081d) + splata dlugu `simulateResourcePipelineForPreview` z -Q1.

ZMIANY/COMMIT: weryfikowano 6b2120858 (kod: dab374310 na d41279263; baza parity-v2 9a6bf6eee, origin/rust-port/parity-v2 nadal 9a6bf6eee). SHA do integracji = SHA commitu 03-final-control.md na 6b2120858 (patrz odpowiedz orkiestratora).
Allowlista: `git diff --name-status 9a6bf6eee 6b2120858` - tylko sciezki dozwolone; mod.rs 1 linia `pub mod`; zero zmian w gra/**, Cargo.toml, WERSJE.md. `git diff --check` czyste.

ROZSTRZYGNIECIE ZARZUTOW:
1. Dlug -Q4b: ODDAL. Obrona zaportowala `simulate_resource_pipeline_for_preview` (turn_economy_preview.rs), test p6_adv_q4_preview ok (wlasny przebieg), wektory q4b/q4c z weba, weryfikator Python 192 sprawdzen / 0 rozbieznosci (wlasny przebieg).
2. Weryfikator nie liczy plonow/zdrowia/kosztRacji/wzrostProcent: ODDAL jako jawne NIE_ZMIERZONO (nota, nie wada portu; kryterium "ile sie da").
3. Mutanty: ODDAL. Petla: 126/135 (93,3% brutto). -Q4b: 39/50 (78% brutto, 100% netto); 11 przezywajacych ma dowody plik:linia w doc Q4 sek. 6b, sprawdzone: wyjscie funkcji to tylko spichlerz_by_city i ceramika_by_owner, pule kamien/zloto/kon nie sa wejsciem receptur - rozumowanie spojne. Kryterium dispatchu dopuszcza ekwiwalenty z dowodem.
4. Z-Q4-3 / resolver Mennicy: ODDAL do -Q5 (uwaga zapisana w doc Q4 sek. 5).
DO DECYZJI WLASCICIELA (nie blokuje): zalozenia Z-Q4-1..7, Z-Q4b-1..4, w tym wykladnia limitu 6 MB per plik (q4.json 5 944 101 B, q4b 1,50 MB, q4c 0,48 MB; lacznie 7,92 MB).

TESTY (wlasne): cargo test --test p6_adv_q4_pipeline (2 testy ok) i --test p6_adv_q4_preview (1 ok) na 6b2120858; verify-p6-adv-q4b-preview.py 0 rozbieznosci; verify-output.txt 61 556 sprawdzen 0 rozbieznosci. Logi gate-*-obrona.txt: 18 plikow, kazdy jedna linia EXIT=0; suma shardow 2053 passed / 0 failed (baza 2050 + 3). fmt/clippy nie powtarzane, wg logow EXIT=0.

BLOKADY: brak.
RUNDY: FC 1/5.
NASTEPNY KROK: integracja orkiestratora (ff na origin/rust-port/parity-v2 = 9a6bf6eee; brak rozjazdu); potem -Q5.
DEPLOY/PUSH: NIE WYKONANO

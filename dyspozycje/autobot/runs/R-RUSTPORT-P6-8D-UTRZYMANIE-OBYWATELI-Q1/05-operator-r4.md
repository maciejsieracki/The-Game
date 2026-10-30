STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1
GOAL: Naprawy 4 zarzutow Evaluatora r3 (04-verifier-r3.md) na bazie backup/p68d-a2e6f837 (a2e6f837): wealth granica pula == prog, znak zera js_max/js_min, gold-deficit pick z NaN/Infinity, js_round k+0.5 i -0. Wektory regenerowane z web 91dc998a (git archive poza repo). Bez push, bez integracji.
ZMIANY/COMMIT:
- `8f866ee2` test(rust-port): P6.8D r4 (kod testow, wektory, mutacje, generatory).
- Baza: `a2e6f837` (detach). Zmienione pliki (allowlista): rust-port/engine/tests/p6_8d_gold_deficit.rs, rust-port/engine/tests/p6_8d_wealth.rs, rust-port/engine/tests/p6_8d_vectors/gold_deficit.json (1325584 B), rust-port/engine/tests/p6_8d_vectors/wealth.json (497696 B), run/gen-p6-8d-gold-mennica-vectors.mjs, run/gen-p6-8d-wealth-vectors.mjs, run/mut-gold-mennica.sh, run/mut-wealth.sh, run/05-operator-r4.md.
- `turn_economy.rs` NIE zmieniony: logika portu (js_round, pick, advance_wealth, js_max/js_min) byla zgodna z webem; naprawy dotycza testow, wektorow i mutacji, zgodnie z 4 naprawami dispatchu (zarzuty Evaluatora sa luka w dowodach, nie bledem kodu - zadna mutacja nie przezyla na kodzie portu).
- Zero zmian w gra/**, rust-port/renderer/**, src-tauri/**, Cargo.toml, WERSJE.md. Push: NIE.
- Nazwa raportu: dispatch podaje 01-operator-r1.md, ale ten plik juz istnieje (r1, nie nadpisany). Raport tej rundy to 05-operator-r4.md (ta sama konwencja co 02-operator-r3.md).
- Lokalne, niescommitowane (nie wchodza do commita): rust-port/engine/Cargo.lock, rust-port/engine/target/.

NAPRAWY (zarzut Evaluatora -> dzialanie):
1. wealth (advance_wealth, granica pula == prog): dodany przypiety krok web: poziom 1, pula 0, spol 18, miasto 0, epoka 2 (prog = 4.5*2*max(1,2) = 18) => awans 1, poziom 2. Mutacja `if pula >= prog` -> `if pula > prog` KILLED (MUT 12).
2. gold_deficit::pick (build_gold_deficit_params): wiersze raw z NaN/Infinity/-Infinity w easy/normal/hard (przypadek `nieskonczonosci`, 3 x 3 tryby). Test dekoduje `$n`/`$f` (wczesniej `as_f64` gubilo NaN => test nie widzial mutanta). Mutacja usuniecia `is_finite` KILLED (MUT 15).
3. js_round: wartosci dokladnie k+0.5 w round4 - prog 0.5 * (2-0.9375) = 17/32 => x*10000 = 5312.5 (dodatnie) oraz -0.5 => -4687.5 (ujemne); mala ujemna -0.00001 * 1.5 => -0.15 => -0 po round4. Mutacje `>= 0.5` -> `> 0.5` KILLED (MUT 16), usuniecie galezi -0 KILLED (MUT 17).
4. Wzorce js_max/js_min (zero sign), ktore nie pasowaly: zamiast wzorca na wywolaniu (zalezny od kontekstu, bez rozstrzygalnego -0) mutacja na samej galezi remisu helperow: js_max `is_sign_positive` -> `is_sign_negative` (MUT 13) i js_min `is_sign_negative` -> `is_sign_positive` (MUT 14). Dowod obserwowalnosci: wektory wealth z epoka -0 (wealthCap = max(0,-0)*cap = +0 w web) i ujemnym capNaEpoke (-2): cap/poziom = -0 w web, zmiana znaku remisu zmienia bity wyniku (check = porownanie bit-w-bit).
   Mutacje gold/mennica i wealth dopisane do skryptow (wzorce na biezacym kodzie, sciezki wzgledne do rust-port/engine, trap przywraca plik).

WEKTORY (regeneracja z 91dc998a, git archive do scratchpad, node 22.22.0 + repin-b-loader-register.mjs):
- gold-mennica: "params=25 advance=40 statMult=132 hpLoss=120 mennica=10" (bylo params=22, statMult=88).
- wealth: "load=16 fn=1344 advance=43" (bylo fn=1040, advance=36). Zmiany: EPOKI +(-0), zestaw ujemnyCap, przypiety krok pula == prog.
- mennica_zloto_grace.json: bez zmian (identyczny).
- Kodowanie bez zmian w zasadzie (number / $f / $n / $undef / null); raw w gold kodowany rekursywnie przez encRaw.

TESTY (worktree, CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0):
- cargo test --test p6_8d_gold_deficit --test p6_8d_mennica_grace --test p6_8d_wealth: gold_deficit 10/0, mennica_grace 5/0, wealth 6/0 (razem 21/0).
- cargo test --no-fail-fast (pelny suite engine): EXIT 0; passed=1436 failed=0 (194 linii "test result").
- cargo fmt --all -- --check: EXIT 0.
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- git diff --check: czysty.
- mut-gold-mennica.sh 1-17: 17/17 KILLED, RESTORED (1-14 bez regresji po zmianie wektorow).
- mut-wealth.sh 1-14: 14/14 KILLED, RESTORED.
- Logi: scratchpad /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/ (test-full-r4.log, clippy-r4.log, fmt-r4.log).

ZALOZENIA (rozstrzygniete w dokumencie, bez pytan ABC):
- Z-R4-1: brak dokumentu tematu P6-8 w tym HEAD (`dyspozycje/rust-port/p6/` nie zawiera P6-8-*); dokumentacja tematu = ten raport i 02/03/04 w run/. Nie tworzono nowego dokumentu planu.
- Z-R4-2: zalozenia 1-10 z 02-operator-r3.md bez zmian.
- Z-R4-3: mutanty js_max/js_min w remisie traktowane jako obserwowalne tylko przez wektory z ujemnym capem/epoka -0 (nie przez zwykle wartosci).

BLOKADY:
- state.rs NIE podpiete pod nowe funkcje wealth (wg 04-verifier-r3.md: :1661, :1759, society-inputs) - poza zakresem tematu; osobna partia integracyjna.
- Brak blokad testow.

RUNDY: 4/5 (dispatch podaje runda 3/5 zuzyta; ten przebieg to naprawy 4 zarzutow Evaluatora r3 - numeracja orkiestratora "Runda 1/5" w tej turze, rozbieznosc jak w 02-operator-r3.md).
NASTEPNY KROK: Evaluator (ten sam ID) na 8f866ee2 (bramki, mutacje, wektory z web 91dc998a), potem Final Control; integracja wg orkiestratora (state.rs osobno). READY_FOR_DEPLOY nie wystawiac z tego raportu.
DEPLOY/PUSH: NIE WYKONANO

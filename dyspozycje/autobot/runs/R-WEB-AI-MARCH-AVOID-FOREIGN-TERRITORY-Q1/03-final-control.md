STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1
GOAL: AI w wojnie nie prowadzi wojsk przez teren trzeciej cywilizacji bez umowy przemarszu; teren jest twarda przeszkoda; brak trasy ladowej -> trasa morska, potem odroczenie + prosba wg cooldownu; gracz nie jest ograniczany.
ZMIANY-COMMIT: oceniany SHA obrony R2 e1b73e515 (galaz worktree-wf_89d6b9b2-427-3, zawiera Operatora e728a594d, baza 96ec14f76 = origin/main). SHA do integracji = commit tego raportu na e1b73e515 (git log tej galezi, HEAD). Diff 96ec14f76..e1b73e515: ai-march-guard.ts (nowy), ai.ts, diplomacy-proposals.ts, main.ts, nowy test .cjs, run/**. Allowlista OK (main.ts = okablowanie "pliki AI/ruchu", ok. 80 linii, zaakceptowane). Brak gra-robocza, WERSJE.md, rust-port. git diff --check czysty.

WERDYKT ZARZUTOW R1:
1. Cooldown nie resetowany/zapisywany -> ODDAL (naprawione): clear() przy nowej grze i wczytaniu, zapis w meta, czysta isMarchPassageCooldownActive (wpis z przyszlosci nie wycisza); F1-F2 behawioralnie, mutacja C9 czerwieni.
2. Trasa morska -> ODDAL (zaimplementowana): seaCostFn, guardedMarchPath + planer wojny; B7 (woda faktycznie uzyta, 0 wejsc w cudzy teren), B7d bez Zeglugi = odroczenie; C8/C10 czerwienia.
3. Test unikajacy symetrii -> ODDAL: B8/B8b/B8c (0 wejsc, cel osiagniety, zmiany kierunku <= 6); oscylacja nie odtwarza sie. Czestosc w grze NIE_ZMIERZONO.
4. Okablowanie tylko statyczne -> ODDAL w czesci (F behawioralnie, E7-E10, log wyjatku z asercja B5d); requestAiMarchPassage/enqueueDiplomacyPendingFromCmd headless NIE_URUCHOMIONE (main.ts nie dziala headless) -> notatka.
5. Prog D4 jednostronny -> ODDAL: D4a/b/c dwustronne. Moja powtorka: PRZED 1.15x, PO 1.33x, lacznie 1.25x (progi 1.5/1.5/1.3). Szum ok. +-0.15; akceptowalne.
6. main.ts poza allowlista -> ODDAL (dispatch: "pliki AI/ruchu", okablowanie niezbedne).
DO DECYZJI CZLOWIEKA: brak.

TESTY (wlasna weryfikacja, czysty worktree na e1b73e515):
- tsc --noEmit: EXIT=0.
- ai-march-avoid-foreign-territory-test.cjs: 99 passed, 0 failed, EXIT=0. Symulacja: jednostko-tury na terenie trzeciej 2336->0; kary Zaufania 492 par (-2460) ->0; N7 19->0; przejecia miast 14->20; prosby 80 wywolan / 13 po cooldownie.
- Regresje zielone (EXIT=0): ai-general-war-campaign, ai-war-gate, planned-march, ai-move-full-range, diplomacy-border-march, border-march-scan, diplomacy-war-gates, forced-war-stone. Zastane czerwone wg Obrony/Evaluatora (diff ich nie dotyka): war-allin-capital, ai-siege-requires-war, forced-war-waves, march-attack-queue-persist, forced-war-bronze-main-guard/new-game-reset (nie powtarzane przeze mnie).
- NIE_URUCHOMIONE: testy *-live (przegladarka); pelna gra z morzem NIE_ZMIERZONO.

NOTATKI: (a) prog "znacznie gorsza okrezna" 1.5x+3 to zalozenie; (b) AI bez trasy stoi w miejscu zamiast podchodzic do granicy; (c) czas decyzji PO ~1.33x na trajektorii PO (w progu).
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora. origin/main == baza 96ec14f76, zmiana dotyka tylko gra/ i run/ -> merge bez konfliktow; rust-port/parity-v2 niezalezne (inny zakres), kolejnosc dowolna, najlepiej po main.
DEPLOY-PUSH: NIE WYKONANO

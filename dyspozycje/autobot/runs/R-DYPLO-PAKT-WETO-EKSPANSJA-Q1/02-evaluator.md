# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`
GOAL: zgodny co do słowa z `00-dispatch.md` (§16a pkt 9 — sprawdzone, GOAL nie przesunął się).
WERYFIKACJA: własny, niezależny worktree `/home/user/wt-EVAL-R-DYPLO-PAKT` @ `60f3b1a1`
(detached), `node_modules` dowiązane z checkoutu `main`, `tsc` 5.9.3 (C-029 spełnione).

ZMIANY/COMMIT: `60f3b1a1`, baza `a79614db`. 5 plików, wszystkie w allowliście
(3 × `gra/src` + `gra/tools` + artefakt runu). `gra/data/**`, `WERSJE.md`, pozostałe typy
umów, `gra/dist` — nietknięte. Zero sekretów. `origin/main` nadal `a79614db`
(`git merge-base --is-ancestor` → NIE w `main`).

TESTY (uruchomione przeze mnie, nie streszczone z raportu):
- `dyplo-pakt-ekspansja-granica-test.cjs` **26/26**, exit 0
- `diplomacy-proposal-test.cjs` **188/188**, exit 0
- **wszystkie 51** bramek `diplomacy-*`/`dyplo-*`/`granice-relacja-*`/`wiarygodnosc-*`/`eot-diplomacy-*` — **0 czerwonych**
- referencyjne: logic **213/213** · tech-tree **19/19** · research ALL GREEN · unit-replace **13/13** · combat OK
- `tsc --noEmit` exit **0** · `vite build` (C-001, `--outDir` do scratcha) exit **0**, 24,8 s, `gra/dist` nie powstał
- nietautologiczność: kod sprzed naprawy → **14/26** (zgodne z raportem); `NARZUT=0` → **17/26** (raport mówi 15/26 — patrz N2)

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

---

## 1. Co potwierdziłem POMIAREM (nie odczytem raportu)

**Weto było absolutne.** Na kodzie `a79614db`: Relacja 200/200 + słodzik 100 000 ¤ →
`accepted=false`, `reason='Ekspansja przy granicy — brak zaufania do paktu'`. Identycznie dla
0/100/500/5000/100000. Sytuacja właściciela (Zaufanie 17 + Respekt 64 = **81**) → odrzucona
dokładnie tym komunikatem. Po naprawie ta sama sytuacja → **pakt zawarty**.

**Weto było nie-wyjściowe.** `main.ts` 16283 / 16319 / 17481 / 27599 — cztery identyczne
wyrażenia `cities.filter(...).length > 2 && cities.filter(...).length > 2`. Zero granic, zero
osadnictwa, zero ruchu wojsk; przeliczane co turę. Żadna akcja dyplomatyczna, ekonomiczna ani
wojskowa gracza tego nie zdejmuje poza zejściem poniżej 3 miast. Diagnoza „strukturalnie
nieosiągalny" — **potwierdzona**.

**Rozjazd one-shot vs −2/turę rozstrzygnięty pomiarem, nie opinią.** `tickDiplomacy` z flagą:
50 → 48 → 46 → 44 → 42 → 40; bez flagi: 50 → 50 (kontrola). `computeTickZaufanieDelta` = −2 / 0.
`applyDiplomaticEvent('tarcia_graniczne')`: 20 → 18, jednorazowo. To **dwa różne mechanizmy**;
UI ma rację, komentarz był defektem. Wiersz `diplomacy-factors.ts` (`value -2`, `perTurn true`)
zgodny z `Dyplomacja-zasady.md` §3.2 i `gra/data/diplomacy.json:746`. Diff w `diplomacy.ts` jest
**wyłącznie komentarzem** — zweryfikowane.

**Próg i kompensowalność.** Skan: z flagą 69 → odrzucone, 70 → przyjęte; bez flagi 49 → odrzucone,
50 → przyjęte. Słodzik: 499 PW (ease 19) → odrzucone, 500 PW (ease 20) → przyjęte. Gwarancja
strukturalna „maksymalny słodzik dokładnie kasuje narzut" **działa**, a nie tylko jest opisana.

**Źródła — sprawdzone samodzielnie, nie z cytatu.** `Dyplomacja-zasady.md:88`,
`Dyplomacja-DOKUMENTACJA-DEV.md:180`, `gra/data/diplomacy.json:746` — czynnik wyłącznie jako
−2 Zaufania/turę. `grep 'brak zaufania do paktu'` po całym repo: żadnego dokumentu decyzyjnego,
tylko kod, kopie `gra-robocza`/`gra-kanon`, archiwum czatu i rejestr zgłoszeń. `REJESTR-PROSB`
i `WERSJE.md` — zero trafień. Cytat właściciela z `PYTANIA-OTWARTE.md:10748` i audyt archiwalny
`MASTER-Work_KORESPONDENCJA.md:75873` — **dosłownie zgodne** z raportem. Ustalenie „defekt, nie
zamiar" ma pokrycie w źródłach; `DECISION_REQUIRED` nie było wymagane.

**Parytet — realny, choć udowodniony nie tam, gdzie twierdzi raport (N3).** Bramka
`evaluateProposal` jest owner-agnostyczna. Sprawdziłem żywą ścieżkę AI→gracz: `main.ts:14931`
`previewNegotiationEntry` → dla `nap` `previewIncomingPlayerAccept` zwraca `null` (`nap` nie jest
w `INCOMING_NET_PW_ACTIONS`) → spada do `evaluateProposal`. Narzut **stosuje się symetrycznie na
Stole negocjacji w obu kierunkach**. Jedyna asymetria — `resolvePlayerAcceptsAiPending` bez progów —
jest pre-istniejąca, opisana ID decyzji `C-DYP-Q1=A` w kodzie i przypięta testem E3 → tabela
wyjątków `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`, **nie FAIL #8**.

**Brak cichego rozluźnienia asercji `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`.** Diff w
`diplomacy-proposal-test.cjs` dotyka wyłącznie linii 67–70, 108–111 i 161–186; asercje tamtego
tematu żyją w 587–701, nietknięte i zielone (uruchomione, wypisane imiennie).

**Brak ekspozycji save/load.** Flaga jest wyliczana co turę z liczby miast, nie jest zapisywana;
zmiana nie dodaje żadnego trwałego pola. Aktywne pakty NAP niezmienione.

**Zakres pozostałych umów.** Zweryfikowałem sam: `ekspansjaPrzyGranicy` występuje w
`diplomacy-proposals.ts` **wyłącznie** w gałęzi `nap`. Żaden inny typ umowy nie nosił tego weta —
warunkowy obowiązek zgłoszenia z dispatchu nie ma czego zgłosić.

## 2. Uwagi (N1–N8)

**N1 — jedno twierdzenie raportu jest FAŁSZYWE i żyje też w kodzie.** §6 raportu: „czynnik musi
nadal coś kosztować, żeby test przeszedł. Potwierdza to mutacja `NARZUT = 0`: test czerwienieje".
Zmierzone: przy `NARZUT=0` `diplomacy-proposal-test.cjs` daje **188/188 PASS**. Para asercji jest
sparametryzowana samą stałą (`próg+narzut−1` / `próg+narzut`), więc wobec wartości narzutu jest
**tautologiczna** — nie wykryje wyzerowania czynnika. Ochrona przed cichym no-op istnieje, ale
wyłącznie w nowym teście (A2a, B2, B3). To nie jest defekt kodu gry; to nieprawdziwe zdanie
w uzasadnieniu — powtórzone w komentarzu przy tej asercji, więc wjedzie do `main` i przeżyje
raport (§13b: popraw tam, gdzie mieszka ustalenie). **Poprawka jednolinijkowa, w allowliście.**

**N2 — liczba z mutacji nie reprodukuje się.** Raport: `NARZUT=0` → 15/26. Zmierzone: **17/26**
(czerwienieją A2a, B2, B3, C0, C1, C2, C3, F1, F2 — dziewięć). Mutacja kodu sprzed naprawy
reprodukuje się co do sztuki (14/26). §13a: liczba z pomiaru jest rzędem 1, z pamięci rzędem 5.

**N3 — parytet udowodniony na funkcji bez wywołania.** `evaluatePendingFromAI` jest w `main.ts`
**importowane (1151) i nigdy nie wołane** — jedno wystąpienie w całym `gra/src`. Testy E1/E2
dowodzą symetrii helpera spoza żywej ścieżki. Substancja jest OK (patrz §1), ale dowód powinien
celować w `previewNegotiationEntry`. Do poprawienia przy okazji, nie blokuje.

**N4 — druga połowa zgłoszenia właściciela NIE jest zamknięta.** `diplomacy-locks.ts:178`
(case '2') liczy blokadę z gołego `ctx.progNapRelacja`; `DiplomacyActionLockContext` nie niesie
`ekspansjaPrzyGranicy`. Skutek: przy aktywnym czynniku i Relacji w [50, 70) „Pakt o nieagresji"
w kolumnie „Możliwe umowy" pokazuje się jako **odblokowany**, a przy ocenie leci „wymagana ≥ 70".
To nie jest regresja (przed naprawą to samo okno było [50, ∞) i kończyło się ścianą), a plik jest
poza allowlistą — ale to **dokładnie** ta część zgłoszenia
`P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS`, którą raport proponuje zamknąć jako
duplikat: „w lewej kolumnie »Możliwe umowy« WIDAĆ już istniejący wzorzec […] ale »Pakt o
nieagresji« NIE był tak oznaczony […] twardy gate ujawniający się dopiero PRZY OCENIE, nie przy
wyborze". **Nie zamykać tego wpisu w całości.** Proponowane ID:
`R-DYPLO-PAKT-LOCK-PREVIEW-NARZUT-Q1` (allowlista: `diplomacy-locks.ts` + `main.ts`).

**N5 — najmocniejsze źródło zostało pominięte.** `docs/decyzje/D3-PROG-DIFF-2026-07-21.md:37` to
**zamknięta decyzja właściciela**: „NAP | progNapRelacja | — | **NIE** | tylko Relacja; Zaufanie
rośnie po zawarciu (Maciej 2026-07-21)", plus nota z 2026-08-03 „NAP **Rel-only**". To przenosi
ustalenie z „żadne źródło weta nie ustanawia" na „zamknięta decyzja właściciela je wyklucza" —
wniosek bez zmian, ale podstawa mocniejsza. Do dopisania w śladzie tematu.

**N6 — długość raportu.** 1680 słów wobec orientacyjnych ~400 (§11). Zgodnie z tą samą sekcją:
`PASS-WITH-NOTES`, nie `FAIL`, ale wraca do skrócenia.

**N7 — weryfikacja w żywej przeglądarce (obowiązek Evaluatora, §5a).** Dispatch przypisał wzorzec
tematu wizualnego (Opus 5 dla Operatora i Evaluatora, Sonnet FC), więc wykonałem ją sam: Chromium
`/opt/pw-browsers/chromium-1194`, render wyjścia `renderPnBalancePanelHtml` z CSS panelu.
Wynik: **brak przepełnienia poziomego** (`scrollWidth === clientWidth`), tekst zawija się
normalnie (`.da-pn-bal-hint` bez `nowrap`/`ellipsis`), treść jest escapowana (`esc(hint)`).
Koszt: wiersz odmowy **rośnie z 45 px do 68 px** przy szerokości 495 px i do **91 px** przy 351 px —
około dwukrotnie. Uczciwie: mój harness odtwarzał CSS ze źródła i **nie jest** działającą aplikacją,
więc to kontrola zawijania/przepełnienia, a nie pixel-perfect zrzut Stołu negocjacji. Żaden plik UI
nie został zmieniony, a kryterium 7 dispatchu jest jawnie warunkowe („real render dla **zmienionego**
UI"), więc nie traktuję braku zrzutu z aplikacji jako naruszenia §9 poz. 6a. Final Control może
zażądać zrzutu w aplikacji przed deployem właśnie ze względu na ten wzrost wysokości.

**N8 — komentarz nieaktualny po zmianie.** `diplomacy-acceptance-points.ts:156` i `:168` podają
przykład „NAP @ Rel 61: progNapRelacja=50, 61≥50 → accepted"; przy aktywnym czynniku to już
nieprawda (61 < 70). Poza allowlistą, jednolinijkowa korekta przy najbliższym temacie w tym pliku.

## 3. Werdykt

Praca jest **rzetelna i zmierzona**: defekt zdiagnozowany u źródła, weto zastąpione warunkiem
kompensowalnym o wartości wyprowadzonej z istniejącej stałej, komunikat podaje liczbę, przyczynę
i dwie akcje, sytuacja ze zgłoszenia odblokowana, parytet realnie zachowany, zero regresji na 51
bramkach dyplomacji i 5 referencyjnych, zero naruszeń §9. Kierunek naprawy jest wprost pokryty
ECHO właściciela („kwestią jest tylko zbalansowanie innymi propozycjami").

`PASS-WITH-NOTES`, gotowość do Final Control: **TAK**. Jedyna pozycja, którą rekomenduję domknąć
przed integracją, to **N1** — usunięcie z komentarza w `diplomacy-proposal-test.cjs` zdania
o czerwienieniu przy `NARZUT=0`, bo jest mierzalnie nieprawdziwe i wjedzie do `main`. Reszta uwag
to rejestr, nie blokada. **N4 wymaga decyzji orkiestratora przy zamykaniu wpisu w
`PYTANIA-OTWARTE.md` — zamknięcie go w całości zgubiłoby połowę zgłoszenia właściciela.**

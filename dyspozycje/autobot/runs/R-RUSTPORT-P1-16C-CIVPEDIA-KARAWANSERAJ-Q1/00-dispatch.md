STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-CIVPEDIA-KARAWANSERAJ-Q1
GOAL: Domknąć z `AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` §9.3: (a) 3 hasła z wariantową frazą (8b), (b)
pełną listę miejsc usunięcia Karawanseraju (decyzja 15B) — UI, `trade-routes.ts`, `cityPanel.ts`,
`docs/PORADNIK-GRACZA/*` — ze statusem z dowodu na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST — KOREKTA WZGLĘDEM STAREGO AUDYTU
Czwarty i ostatni z 4 następców `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1`. Stary ślad (§9.3 pliku
`P1-16-EDGE-CASES.md`, l. 593) mówił „najpierw PYTANIA-OTWARTE w sprawie »+1 ¤ na poz. 2« (PYTANIE
19)" jako warunek wstępny. **To jest NIEAKTUALNE.** Sprawdziłem `dyspozycje/PYTANIA-OTWARTE.md`:
PYTANIE 19 ma status **WDROŻONE W KODZIE** (2026-07-25, decyzja A, `economy-upkeep.ts`) — nie jest
otwarte, nie pytaj ponownie. Weryfikuj wyłącznie czy pin edb8fb56 faktycznie implementuje decyzję A.
Plik docelowy `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` ma już §8-§13 — NIE nadpisuj, dopisz §14
na końcu. Uwaga: ten temat NIE obejmuje pełnego `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`
(69 wierszy nieprzeliczonych, §10.2 poprzedniego tematu) — to zbyt duży zakres na jeden temat i
wymaga osobnego podziału wg rozdziałów, poza tym dispatchem.

ZADANIE
(a) Zidentyfikuj 3 hasła CivPedii z wariantową frazą (§9.3, poz. 8b w `AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md`)
i sprawdź status każdego na pinie.
(b) Wypisz WSZYSTKIE miejsca, gdzie Karawanseraj (decyzja 15B — usunięty z gry 2026-07-25) powinien
być usunięty, ale może nadal występować: `trade-routes.ts`, `tech.json`, `wikiBundle.json`,
`cityPanel.ts` (linie 7316/7395 wg starego audytu — zweryfikuj na pinie, mogły się przesunąć),
`building-icon-map.json`, `docs/PORADNIK-GRACZA/*`. Dla każdego miejsca status z dowodem
(`git grep -i karawanser` na edb8fb56, nie z pamięci audytu).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania starego werdyktu bez własnej weryfikacji na pinie. Numery linii z audytu
(np. cityPanel.ts:7316/7395) mogły się zmienić — zweryfikuj aktualne numery przez `git show`.

BINARNE KRYTERIUM SUKCESU
3 hasła wariantowe + wszystkie wymienione miejsca Karawanseraju mają status z dowodem w nowej
sekcji §14. Zero pozycji bez statusu.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko dopisanie §14 na końcu, zero
zmian w §1-§13), `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-CIVPEDIA-KARAWANSERAJ-Q1/**`. Odczyt:
`dyspozycje/**` read-only, `gra/**` read-only na pinie edb8fb56 (git show/git grep, bez
checkout/build/dev).

IZOLACJA
Czysta praca odczytowa + dopisanie do jednego pliku .md. Brak izolacji worktree potrzebnej.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy/pomiar; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AUTOIMPROVE-IRRIGATION-MAX-PCT-Q1 (AUTOIMPPCT, #186)
GOAL: zmierzyć czas od odkrycia do irygacji przy suwaku 100% (maksimum), przemierzyć próg testu (e), potwierdzić owner-rules przy 100%, dokument analizy.
ZMIANY/COMMIT: gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs (PRACA_PCT, domyślnie 100); gra/tools/autoimprove-pasture-irrigation-q2-test.cjs (PCT=100 w symulacji (a)-(d) i (e), PROG_IRR_N 55 -> 53, komentarz pomiaru); gra/tools/autoimprove-owner-rules-test.cjs (OWNER_RULES_PCT, domyślnie 50; asercja (ii-c) liczy tylko Łąkę/Równinę); dyspozycje/analizy/ULEPSZENIA-IRYGACJA-100PCT-2026-11-26.md; ten raport. Brak nowego pliku testowego (allowlista dopuszcza, nie wymagane).
TESTY:
- tsc --noEmit: exit 0
- autoimprove-stages-q1-test (domyślnie): 299 passed, 0 failed
- autoimprove-owner-rules-test (50, domyślnie): 7 OK / 0 FAIL
- autoimprove-owner-rules-test (OWNER_RULES_PCT=100): 7 OK / 0 FAIL (info: 2 irygacje na pustyni bez farmy)
- autoimprove-pasture-irrigation-q2-test (domyślnie 100): 16 OK / 0 FAIL
- ten sam test z mutacją E4 (keys:[]) przy 100%: 15 OK / 1 FAIL (e: 56 tur > 53) — czerwony, jak wymaga dispatch
- pomiar bisect, PRACA_PCT=100, ziarna 1-14, D=10, 100 tur: tury po odkryciu do irygacji 46/36/46/36 (1-4), 50/38/50/42/36/31/33/34/37/38 (5-14); starved=0; orderViol=0
- pomiar PRACA_PCT=33, ziarna 1-4: 46/37/45/36 (PRZED)
- mutacja E4 przy 100%, ziarna 1/5/7: 56/59/58
- NIE_ZMIERZONO: ai-test, logic, tech-tree, research, unit-replace, combat (nie uruchamiane w tej rundzie; zmiany dotyczą tylko skryptów pomiarowych w gra/tools)
BLOKADY: brak.
RUNDY: 1/5 (Operator HAIKU 5.5). Ostatni werdykt: brak (pierwsza runda).
NASTĘPNY KROK: Evaluator (SONNET) — sprawdzić progi (53 = maksimum 50 + 3), mutację i zawężenie asercji (ii-c) (patrz UWAGI-DLA-ORKIESTRATORA).
DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. Suwak 100% nie przyspiesza irygacji (zmiana 0 albo ±1 tura przy tym samym ziarnie). Gardło to kolejność E3 -> E4, nie pula. Komentarz w q2-test przypisywał opóźnienie „limitowi 33% puli gracza” — pomiar tego nie potwierdza. Do decyzji właściciela, czy to zostaje (czas irygacji 31–50 tur po odkryciu przy każdym suwaku).
2. Owner-rules (ii-c) przy 100%: 2 irygacje na pustyni przy rzece, bez farmy na heksie. Dane (terrain-improvements.json) dopuszczają irygację na Pustyni, farma tam nie stoi. Asercja zawężona do Łąki/Równiny (zmiana zakresu testu, nie złagodzenie reguły na tych polach). Warto potwierdzić, czy irygacja na pustyni bez farmy jest zamierzona.
3. Przy 100% w turze 100 zostaje więcej farm przy rzece bez irygacji niż przy 33% (ziarno 1: 10 vs 8; ziarno 3: 12 vs 6). Przyczyny nie badano.
4. Maksimum suwaka przyjęto jako 100 (MAX_ULEPSZENIA_PRACA_AUTO_PERCENT w cities.ts).
5. Środowisko: gra/node_modules skopiowany z innego worktree (gitignored) — usunięty przy sprzątaniu.

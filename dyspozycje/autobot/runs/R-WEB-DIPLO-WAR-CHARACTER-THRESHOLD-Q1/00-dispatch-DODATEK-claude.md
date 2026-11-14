# R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch z gałęzi: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1/00-dispatch.md`.

## Co zrobić
1. Odczytaj DAWNĄ semantykę warSilaBonus (przed krokiem 3, commit 3950aae12 vs 646d95248): `git show 3950aae12:gra/src/game/ai.ts` (blok wypowiadania wojny ok. 6852–7312) i `git show 3950aae12:gra/src/game/diplomacy-war-peace-profile.ts`, a także gdzie bonus był liczony (per cywilizacja/archetyp/poziom trudności/ai-params.json). Opisz w raporcie: skąd brały się wartości, jaki miały zakres i jak przesuwały próg siły względnej rw (0,6).
2. Nowa reguła: próg przewagi dla wypowiedzenia wojny przez AI = bazowy próg z JSON (20%) + przesunięcie wynikające z charakteru cywilizacji (ujemne = agresywna, dodatnie = ostrożna). Przesunięcie pochodzi z TYCH SAMYCH danych charakteru, które dawniej dawały warSilaBonus (lub z warAgresjaBonus, jeśli to on jest dziś nośnikiem charakteru — sprawdź w kodzie, nie zakładaj). Mapowanie liniowe, jawne w JSON (współczynnik + zakres), obcięte do przedziału [10%, 35%]. NIE wymyślaj nowych cech cywilizacji.
3. Tryb z kroku 3 bez zmian: zaufanie < 30 i przewaga ≥ progu (teraz z przesunięciem); wojna przy zerowym zaufaniu przez N tur dla silniejszej strony działa niezależnie od przesunięcia (przewaga „o włos” wystarcza); słabsza nigdy sama nie wypowiada; gracz nigdy automatycznie.
4. Raport MUSI zawierać tabelę: cywilizacja/archetyp → przesunięcie → efektywny próg (%), żeby właściciel mógł je zatwierdzić lub poprawić. Wartości nie są ostateczne.
5. Testy: nowy test z kilkoma cywilizacjami (agresywna 15%, neutralna 20%, ostrożna 30% w jednym scenariuszu przewagi 18%/25%/32%); granice klamry; mutacja (ignorowanie przesunięcia) czerwieni test behawioralny na decideAIDiplomacy, nie tylko regex.

## Kryteria końca (binarne)
tsc 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; ai-test 297/0, diplo-war-declare-zero-trust-test, diplo-peace-weaker-seeks-city-only-test, diplo-peace-stance-wiring-test, diplomacy-test bez regresji; diplo-war-peace-sim ≤ 3 FAIL (dług S3, S4b, M_TUR); nowy test z mutacją zielony/czerwony wg opisu.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.

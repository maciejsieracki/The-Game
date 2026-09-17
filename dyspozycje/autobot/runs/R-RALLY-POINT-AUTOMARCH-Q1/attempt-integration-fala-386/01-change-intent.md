# 01-change-intent — FALA 386 / integracja rally point 5B

STATUS: INTEGRATION_PENDING → local integration
DOMAIN: GAME
TEMAT: R-RALLY-POINT-AUTOMARCH-Q1
WAVE: Wave 3 package / deploy wave FALA 386
WAVE_SOURCE: `dyspozycje/ABC-20260918-NIERESOLVED-WAVE3.md`; owner contract and Kanban `t_fabbd788`

## Źródło zgłoszenia

Właściciel wymaga punktu zbiórki dla automarszu: jednostki mają być grupowane jawnie,
a marsz ma startować dopiero po akcji właściciela, a ręczny tryb ruchu ma pozostać bez
zmiany. Final Control `t_fabbd788/run681` potwierdził allowlist-only kandydat 5B,
bez obiekcji produktowych.

## Zakres zmiany

- zapis i odczyt punktu zbiórki;
- jawne uruchomienie automarszu z aktualnymi jednostkami;
- serializacja planowanego marszu;
- zachowanie istniejącej kolejki marszu i ręcznego ruchu;
- focused regression `rally-point-automarch-test.cjs`.

## Pliki i call-site'y

- `gra/src/game/rally-point.ts` — nowy moduł kontraktu punktu zbiórki;
- `gra/src/game/save.ts` — zapis/odczyt punktu i planu;
- `gra/src/main.ts` — UI, akcje ustawienia/wyczyszczenia/uruchomienia oraz istniejąca kolejka;
- `gra/tools/rally-point-automarch-test.cjs` — test kontraktu i negatywny test automatycznej rekrutacji.

## Wyłączenia

- bez `af4d65cf` — sortowanie jednostek i koszty budynków nie mają wspólnej bramki Final Control;
- bez zmian w `gra/data/**`, Rust, `gra-robocza/**` przed buildem publikacyjnym;
- bez kopiowania starego/mieszanego worktree'a;
- bez promocji do KANON/FINALNA;
- bez zmian w ruchu ręcznym poza wymaganym wspólnym call-site'em.

## Ryzyko regresji i testy

Ryzyka: utrata stanu punktu/planu w save/load, uruchomienie automarszu bez jawnej akcji,
przypadkowe automatyczne rekrutowanie, podwójne użycie istniejącej kolejki lub zmiana
ruchu ręcznego.

Wymagane bramki: rally `22/0`, planned march `18/0`, logic `213/213`, TypeScript,
syntax, `git diff --check`, Vite build oraz manifest/hash/readback bundle.

## Decyzja właścicielska

Właściciel autoryzował integrację, push do `main` i deploy po przejściu pełnych bramek.
Numer **FALA 386** zostaje zapisany dopiero w rejestrze publikacji po rzeczywistym,
zweryfikowanym publishu.

## Następna bramka

Lokalny commit integracyjny → build/stamp/manifest/verifier → push branch → readback →
push/merge do `main` → readback remote `main` → smoke faktycznego `gra-robocza`.

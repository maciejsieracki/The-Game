# Final Control — R-DYPLO-WSPÓLNA-WALKA-BARB-PRZEMARSZ-Q1

Status: `READY_FOR_DEPLOY`

Data kontroli: 2026-08-20

## Zakres i źródło kontroli

- Gałąź: `codex/integration-ready`
- Worktree: `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\_worktrees\integration-sparse`
- Snapshot: `12ca89f94a1ebaf24687dc354460c0dc48e0e630`
- Implementacja: cherry-pick `c912c8ce` (oryginalnie `a216f9ad`)
- Poprawka rajderów morskich: cherry-pick `12ca89f9` (oryginalnie `7942c625`)
- Decyzja właściciela: `1B / 2A / 3B`, 3 tury, `8B / 9A / 10B`

Kontrola została wykonana na wskazanym snapshotcie. Nie zmieniano kodu, nie wykonano deployu ani `git push`.

## Kontrola zakresu i ancestry

- `c912c8ce` jest przodkiem aktualnego snapshotu: PASS.
- `12ca89f9` jest przodkiem aktualnego snapshotu: PASS.
- `git diff --check c912c8ce^ 12ca89f9`: PASS.
- Exact diff od rodzica implementacji do snapshotu: 13 plików, `330` dodanych linii, `19` usuniętych.
- Zakres obejmuje mechanikę traktatu, autoryzację przemarszu, integrację gracza/AI, typ `RuntimeUnit.seaRaider`, test regresyjny oraz raport Operatora.

Worktree był czysty przed zapisaniem tego raportu. Po kontroli jedynym celowym artefaktem jest niniejszy, żądany raport Final Control.

## Wyniki bramek

| Bramka | Wynik |
|---|---:|
| Wspólna walka/przemarsz | `10/10 PASS` |
| Traktaty | `17/17 PASS` |
| Przemarsz graniczny | `43/43 PASS` |
| Regresja barbarzyńców | `213/213 PASS` |
| TypeScript | `PASS`, exit 0 |
| Vite | `PASS`, 837 modułów, exit 0 |
| `git diff --check` | `PASS` |

## Zweryfikowane wymagania właściciela

1. Umowa jest symetryczna: działa dla obu kierunków i pozwala graczowi oraz AI dołączyć do walki partnera z barbarzyńcami.
2. Umowa trwa 3 tury i wygasa na granicy tury 3; po wygaśnięciu przemarsz nie jest autoryzowany przez tę umowę.
3. Zasięg automatycznego wsparcia wynosi 2 heksy.
4. Kwalifikują się wyłącznie aktywne lądowe jednostki bojowe. Wykluczone są cywile, zwiadowcy, garnizony, jednostki zaokrętowane, oblężone oraz rajderzy morscy.
5. Jednostka już uczestnicząca w walce nie dołącza do drugiej; może zostać uwzględniona dopiero po zakończeniu bieżącej walki.
6. Scalanie rosteru nie duplikuje jednostek.
7. Flaga `seaRaider` jest obecna w `RuntimeUnit` i pozostaje zachowana w zwykłym JSON-owym save/load.

## Dowód mutacyjny `seaRaider`

Wykonano jednorazowy probe pamięciowy bez zapisu zmiany w repozytorium: usunięcie warunku `unit.seaRaider !== true` z kopii modułu powoduje wynik kwalifikacji `true`, więc asercja regresyjna `!isEligibleBarbarianCooperationUnit(seaRaider)` staje się czerwona. Mutacja została wykryta.

Nie ma osobnego stałego pliku mutation-test; dowód jest wykonywalnym probe opartym na aktualnym module i istniejącej regresji `gra/tools/diplomacy-barbarian-cooperation-test.cjs`.

## Save/load

Round-trip `serializeGame → deserializeGame` dla jednostki z `seaRaider: true` zakończył się PASS. Dla starego zapisu bez tego pola wynik pozostaje `undefined`, więc zachowana jest kompatybilność wsteczna.

## Werdykt

`READY_FOR_DEPLOY`

Snapshot spełnia decyzje `1B / 2A / 3B`, 3 tury oraz `8B / 9A / 10B`. Nie stwierdzono blokady technicznej ani funkcjonalnej. Deploy i push pozostają niewykonane i wymagają osobnego polecenia właściciela.

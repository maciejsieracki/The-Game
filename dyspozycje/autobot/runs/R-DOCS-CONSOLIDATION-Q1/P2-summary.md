STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-DOCS-P2-INVENTORY-Q1
ROLE: Operator
GOAL: Programowo zinwentaryzować relewantne pliki Markdown-like z zakresu P1, z metadanymi pliku i jawnie rozliczonymi wyłączeniami, bez zapisu treści źródeł.

SCOPE:
- lokalne logical roots: the-game-primary, the-game-current-worktrees, the-game-integration-staging, autoboot-monitor-companion, the-game-documentation-index-checkout;
- kolekcja real24: 25/25 katalogów filesystem/registered;
- companion `/home/ubuntu/projects/Autoboot-Monitor` pozostaje osobną klasyfikacją `SEPARATE_PROJECT`;
- GitHub: trzy refy The-Game odczytane read-only przez `git ls-remote` + GitHub tree API; local remote-tracking SHA zapisany oddzielnie;
- wyłączone: `.git`, nested/one-off worktrees, dependencies, build/cache, generated/runtime, secret-like paths, ignored and non-regular candidates.

SNAPSHOT:
- generated_at (UTC): 2026-09-14T17:33:31Z; scan_finished_at: 2026-09-14T17:37:55Z;
- local source roots were metadata-read before and after; any observed drift is recorded in manifest and not repaired;
- final exact-Git-object readback reconciled six remote `CLAUDE.md`/`README.md` basename-collision rows; remote records now use the declared metadata schema only;
- no fetch/pull/reset/clean/stash/rebase/merge/push/deploy; no source or `gra/` mutation.

ARTIFACTS:
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-markdown-inventory.jsonl` — sha256 `c3af5d96b715a79df910f1d3b5006b2d9e020506ef1c220e648ed13255310055`;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-source-manifest.json` — sha256 `0b9b3b38582d272f25fb349d42e779378901ca6bcc7dfd0a4ea512f6934bd107`;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-exclusions.md` — sha256 `eb3101e246074b613578b4bca57981ce4bbbaec0f04983cb9a7a8818bf3d32ae`;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-summary.md` — sha256 is provided in terminal handoff after final write.

COUNTS:
- inventory records: 84308 (local 76084, remote 8224);
- by extension: {".md": 83812, ".mdc": 496};
- by tracked/untracked: {"tracked": 84166, "untracked": 142};
- by ignored status: {"N/D_REMOTE": 8224, "not_ignored": 76084};
- by classification: {"CANONICAL": 13740, "EVIDENCE": 33217, "HISTORY": 2759, "SEPARATE_PROJECT": 181, "UNKNOWN": 34411};
- by sensitivity: {"PASS": 84207, "REDACTED_FINDING": 101}; read_status: {"READ": 84308};
- excluded candidates: 9620; non-regular: 8; read errors/unstable: 0.

ROOT COUNTS:
| logical root | records | excluded |
|---|---:|---:|
| `autoboot-monitor-companion` | 181 | 3649 |
| `github-the-game-origin-docs-index` | 2746 | 7 |
| `github-the-game-origin-main` | 2745 | 7 |
| `github-the-game-origin-staging` | 2733 | 7 |
| `the-game-current-worktrees` | 67663 | 175 |
| `the-game-documentation-index-checkout` | 2746 | 7 |
| `the-game-integration-staging` | 2737 | 172 |
| `the-game-primary` | 2757 | 5596 |

LIMITATIONS:
- `N/D`: remote ignored/not-ignored projection; human ownership beyond public origin; arbitrary filesystem outside P1; local remote-tracking freshness (not fetched).
- P2 classification is path/provenance metadata only. Source-of-truth, duplicate, stale and consolidation decisions are deferred.

TESTS / NASTĘPNY KROK:
- parser JSONL/schema/uniqueness: PASS (84308 records, 0 parse errors, 84308 unique source-root/path keys, declared fields only);
- exact Git-object metadata readback: PASS for 8224 remote records; all six basename-collision records reconciled, GitHub tree `truncated=false` for all three refs;
- sensitivity scan: PASS (no private-key markers, e-mail addresses, IP addresses, bearer tokens or credential assignments in P2 artifacts);
- `git diff --check`: PASS; no source/input root or `gra/` content was modified;
- NASTĘPNY KROK: independent Evaluator P2. Operator does not create Evaluator, Defense, Final Control, push or deploy.
PUSH/DEPLOY: NIE WYKONANO

## CORRECTION — Defense / zarzut #1

`PRZYJMUJĘ`: poprzednia projekcja `first_heading` zapisywała końcową linię
YAML frontmatter zamiast pierwszego nagłówka Markdown ATX. Korekta objęła
deterministycznie 620 rekordów (20 ścieżek × 31 source roots); źródła nie były
zmieniane.

- Parser jawnie usuwa BOM UTF-8, pomija blok `--- ... ---` i zwraca pierwszy
  pełny, przycięty nagłówek ATX poziomu 1–6.
- Po korekcie: 84308 rekordów i 84308 unikalnych kluczy; projekcje frontmatter:
  620 → 0; agregaty i wszystkie pola poza `first_heading` bez zmian.
- Przykłady: `.claude/skills/autobots/SKILL.md` → `# Autobots — uniwersalny
  szkielet procesu`; `.cursor/rules/abc-pelna-forma.mdc` → `# ABC — reguła
  techniczna`.
- Dowód maszynowy i hashe korekty: `P2-defense-evidence.json`; metadane
  korekty: `P2-source-manifest.json`.

NASTĘPNY KROK: niezależny Final Control.


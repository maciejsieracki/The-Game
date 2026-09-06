# Rodzina bramek panelu imperium — P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1, runda 1

Wyznaczona grepem po `gra/tools/` (wzorzec: `empire` albo `panel` w nazwie) — 43 pliki.
`preview-unit-side-panel-screenshots.cjs` NIE jest bramką (generator podglądów), nie uruchamiany.
Pozostałe 42 uruchomione na bazie `094be1db` + commit tego tematu.

```
city-panel-growth-percent-separator-test             [exit=0] 29 passed, 0 failed
citypanel-konwerter-produkcja-test                   [exit=0] citypanel-konwerter-produkcja-test: 83 pass, 0 fail
citypanel-uwagi-abc-filter-test                      [exit=0] citypanel-uwagi-abc-filter-test: 35 pass, 0 fail
empire-armia-produkcja-test                          [exit=0] empire-armia-produkcja-test: 51 passed, 0 failed
empire-city-defaults-test                            [exit=0] empire-city-defaults-test: 53 pass, 0 fail
empire-diplo-resource-flow-test                      [exit=0] empire-diplo-resource-flow: 7 pass, 0 fail
empire-food-b5-test                                  [exit=1] empire-food-b5-test: 25 pass, 3 fail
empire-miasta-table-test                             [exit=0] empire-miasta-table-test: 96 passed, 0 failed
empire-nauka-panel-coverage-test                     [exit=0] OK (15/15)
empire-panel-drobiazgi-runda2-test                   [exit=0] empire-panel-drobiazgi-runda2-test: 33 passed, 0 failed
empire-panel-econ-slider-visibility-test             [exit=1] 57 pass · 3 fail
empire-panel-miasto-obywatele-content-test           [exit=1] 113 passed, 2 failed
empire-panel-moc-scroll-preserve-test                [exit=0] OK (57/57)
empire-panel-sliders-always-visible-test             [exit=1] empire-panel-sliders-always-visible-test (SUPERSEDED, patrz nagłówek): 6 pass, 2 fail
empire-panel-split-test                              [exit=0] 25 pass · 0 fail
empire-praca-panel-coverage-test                     [exit=0] OK (15/15)
empire-religia-panel-coverage-test                   [exit=0] OK (15/15)
empire-skarbiec-bilans-test                          [exit=0] empire-skarbiec-bilans-test: 11 passed, 0 failed
empire-skarbiec-panel-coverage-test                  [exit=0] OK (12/12)
escape-overlay-real-panels-test                      [exit=0] escape-overlay-real-panels-test: 49 pass, 0 fail
heks-panel-tooltip-warstwa-test                      [exit=0] 22 passed, 0 failed
hint-toast-zindex-empire-panel-test                  [exit=1]     at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
hud-tooltip-body-mounted-panels-test                 [exit=0] 16 pass · 0 fail
panel-kolejka-pasek-postepu-test                     [exit=0] panel-kolejka-pasek-postepu-test: 82 pass, 0 fail
porzadek-panel-czytelnosc-test                       [exit=0] porzadek-panel-czytelnosc-test: 81 passed, 0 failed
side-list-hud-panel-coverage-test                    [exit=0] OK (74/74)
side-panel-event-link-test                           [exit=0] side-panel-event-link-test: 34 pass, 0 fail
side-panel-unit-cycle-arrows-test                    [exit=0] side-panel-unit-cycle-arrows-test: 20 pass, 0 fail
sidepanel-events-toolbar-test                        [exit=0] sidepanel-events-toolbar-test: 19 pass, 0 fail
sidepanel-hud-deadzone-test                          [exit=0] 43 pass · 0 fail
spichlerz-cap-citypanel-wiring-test                  [exit=0] spichlerz-cap-citypanel-wiring-test: 12 pass, 0 fail
spichlerz-panel-food-parity-test                     [exit=0] 11 passed, 0 failed
build-panel-ulepszenia-scroll-real-render-test       [exit=0] [build-panel-ulepszenia-scroll-real-render-test] 43 pass, 0 fail
citypanel-uwagi-hostcard-removed-real-render-test    [exit=0] [citypanel-uwagi-hostcard-removed-real-render-test] 12 pass, 0 fail
empire-autofeed-btn-label-real-render-test           [exit=0] OK — pass 25, fail 0
empire-trade-route-split-real-render-test            [exit=0] empire-trade-route-split-real-render-test: 58 pass, 0 fail
praca-panel-budowy-warstwa-real-render-test          [exit=0] [praca-panel-budowy-warstwa-real-render-test] 28 pass, 0 fail
praca-panel-emoji-brand-icons-real-render-test       [exit=0] [praca-panel-emoji-brand-icons-real-render-test] 26 pass, 0 fail
sidepanel-blocking-card-cutoff-real-render-test      [exit=0] sidepanel-blocking-card-cutoff-real-render-test: 47 pass, 0 fail
sidepanel-diplo-dismiss-real-render-test             [exit=0] sidepanel-diplo-dismiss-real-render-test: 35 pass, 0 fail
sidepanel-event-header-wydarzenie-real-render-test   [exit=0] sidepanel-event-header-wydarzenie-real-render-test: 23 pass, 0 fail
sidepanel-event-przekierowania-real-render-test      [exit=0] sidepanel-event-przekierowania-real-render-test: 51 pass, 0 fail
```

## Podsumowanie

- **37 zielonych** (w tym `empire-panel-moc-scroll-preserve-test` 57/57 — naprawiony w tej rundzie, było 38/9).
- **5 czerwonych, wszystkie PRE-ISTNIEJĄCE** (mój diff to jeden plik bramki, `git diff 094be1db --stat`):
  - `empire-food-b5-test` 25/3
  - `empire-panel-econ-slider-visibility-test` 57/3
  - `empire-panel-miasto-obywatele-content-test` 113/2
  - `empire-panel-sliders-always-visible-test` 6/2 — plik sam opisuje się jako SUPERSEDED
  - `hint-toast-zindex-empire-panel-test` — przerywa się WŁASNYM warunkiem: "origin/main:gra/src/main.ts
    już zawiera naprawę — BEFORE bundle nie byłby «przed»". Bramka samo-unieważniająca się po
    scaleniu swojej naprawy do `origin/main`; DOMAIN INFRA, nie defekt gry.

Każda z nich to osobny temat — poprawianie ich tutaj byłoby naruszeniem zakresu (C-025).

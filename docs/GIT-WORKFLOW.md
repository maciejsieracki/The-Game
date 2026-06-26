# Git — workflow dla projektu Civ (The Game)

Krótki przewodnik dla **Macieja**. Agenci (MASTER, Composer) utrzymują repozytorium; **nie musisz** używać gita na co dzień.

## Gałęzie

| Gałąź | Rola |
|--------|------|
| **`main`** | Stabilny **kanon**: `Gra-podglad.html` + spójny kod w `gra/`. Zmiany trafiają tu **dopiero po review Opus 4.8** i akceptacji workflow MASTER. |
| **`develop`** | Praca agentów: eksperymenty, lane'y, buildy testowe, WIP. Tu lądują commity implementacji. |

## Kto co robi

1. **Composer (lane)** — pracuje na `develop` (feature commity, testy lokalne).
2. **MASTER (GLM 5.2)** — scala `develop` → `main`, gdy lane jest gotowy i Opus dał **APPROVE** (lub Maciej zaakceptował decyzje ABC).
3. **Maciej** — decyzje gameplay (ABC), playtest, sign-off produktowy; **bez** obowiązku `git pull` / merge.

## Typowy merge (MASTER)

```text
develop  ——(review Opus OK)——>  main
         merge lub fast-forward
         tag / wpis w DZIENNIK-MASTERA opcjonalnie
```

Przed merge na `main`: testy zielone (~762), kanon `Gra-podglad.html` zsynchronizowany, brak sekretów w commitach.

## OneDrive

Repozytorium leży w OneDrive — **nie commituj** `gra/dist/` (build; często blokowany sync). Build lokalnie: `npm run build` w `gra/`.

## Checkpoint bez gita

Nadal obowiązuje **md5 kanonu** (np. `2276ec0f`) jako szybki checkpoint w dokumentacji — git go uzupełnia, nie zastępuje decyzji ABC.

## Push / remote

Na start **brak wymaganego remote** — historia lokalna w `Civ/.git`. Gdy dodasz GitHub/GitLab, MASTER skonfiguruje `origin`; do tego czasu **nie pushuj** bez ustaleń.
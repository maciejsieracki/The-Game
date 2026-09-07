# Dowody — P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1, runda 1

## N12 — ikona eyebrow w czterech zakładkach (zrzuty z ŻYWEGO Chromium, §9 poz. 6a)

Harness: `n12-zrzuty-zywy-chromium.cjs` (uruchamiany z `gra/`).

- realny `vite build` przez binarkę z `node_modules` (jedyna dozwolona komenda buildu,
  C-001), `--outDir` **poza drzewem repo**, katalog z unikalnym sufiksem;
- realny headless Chromium (`--use-gl=swiftshader`, bez tego generacja mapy nigdy się
  nie kończy), realny `doStartGame` przez istniejący hak `__aiBuildingsTestDebug`,
  realne założenie pierwszego miasta gracza — sekwencja 1:1 z `ai-buduje-budynki-test.cjs`;
- otwarcie zakładki **realnym klikiem myszy w chip HUD** (`[data-act="surowce|handel|armia|kultura"]`),
  czyli tą samą ścieżką co gracz.

Wariant **PRZED** budowany jest z LUSTRA `gra/` w `os.tmpdir()` (`src` = kopia, mutowana
wyłącznie tam, `data`/`node_modules` = dowiązania) ze stanem sprzed naprawy N12: ikona
eyebrow wyłącznie w Surowcach. **Worktree nie jest mutowany ani przez chwilę.**

Pliki: `PRZED-{surowce,handel,armia,kultura}.png`, `PO-{surowce,handel,armia,kultura}.png`,
pomiar DOM (`hasIconSvg`, rozmiar SVG, treść eyebrow) w `N12-pomiar.json`.

## Uwaga o stanie zastanym

Naprawa N12 (a także N5/N9/N11) jest w kodzie od commita `24456a72` z 2026-08-21,
który jest **przodkiem bazy tego tematu** `094be1db` (`git merge-base --is-ancestor
24456a72 094be1db` → prawda, playbook C-056). „PRZED" na zrzutach jest więc odtworzeniem
stanu sprzed tamtej naprawy, nie stanem bazy tej rundy. Szczegóły w raporcie
`01-operator-runda1.md`.

# R-RUSTREAL-WEB-1TO1-PORT-Q1 — instrukcja pobrania

## Stan teraz

Operator nie wykonał pushu. Lokalny branch `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920` ma HEAD/base
`78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`. Instrukcja staje się wykonywalna dla następnego agenta dopiero po
osobnym Evaluatorze, Final Control, integracji i autoryzowanym pushu przez
Orkiestratora. Nie używaj nazwy brancha ani raportu jako dowodu zdalnej publikacji.

## Po publikacji przez Orkiestratora

W katalogu świeżego checkoutu wykonaj wyłącznie odczyt i weryfikację:

```text
git fetch origin refs/heads/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920:refs/remotes/origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920
git rev-parse refs/remotes/origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920
git show --stat --oneline refs/remotes/origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920
git ls-tree -r --name-only refs/remotes/origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920 -- handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1 dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1
```

Oczekiwany zdalny HEAD musi być pełnym SHA z potwierdzonego pushu; nie wpisuj go
z pamięci. Następnie sprawdź pliki dokumentacyjne:

```text
sha256sum -c handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/07-CHECKSUMS-SHA256.txt
python3 -m json.tool handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/02-MANIFEST-PLIKOW.json >/dev/null
python3 -m json.tool handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/06-REJESTR-DECYZJI-I-RYZYK.json >/dev/null
python3 -m json.tool dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/01-evidence.json >/dev/null
```

Polecenia `sha256sum -c` i `json.tool` uruchom z katalogu głównego repozytorium.
Lista checksum zawiera zahashowane wejścia wymagane przez handoff oraz artefakty
procesowe z wyjątkiem samego `07-CHECKSUMS-SHA256.txt`, aby uniknąć rekurencji.

## Pierwszy krok wykonawczy

Przeczytaj `00-PLAN-DZIALANIA.md`, `01-HANDOFF-DLA-AGENTA.md`, manifest i
kryteria. Dopiero potem załóż nowy, jawny temat Kanban dla reference capture i
grafu zależności. Nie uruchamiaj packagingu jako skrótu do parytetu i nie
zmieniaj `gra/**` w lane Rust/Tauri.

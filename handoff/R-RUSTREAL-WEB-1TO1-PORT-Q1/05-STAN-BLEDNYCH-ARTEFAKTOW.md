# R-RUSTREAL-WEB-1TO1-PORT-Q1 — stan błędnych artefaktów

## Aktualny Rust/Tauri — nie jest portem 1:1

Na `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e` obecny slice pozostaje harness'em:

- `src-tauri/frontend/main.js` ma ręcznie wpisane trzy cywilizacje i symbole
  Unicode zamiast pełnej puli danych/ikon webowych;
- `renderMap()` tworzy przyciski HTML w małej, testowej siatce i pokazuje
  współrzędne, płaskie kolory oraz symbole stolicy/jednostki;
- `src-tauri/frontend/index.html` opisuje frontend jako „compact web-parity
  equivalent, without importing the web bundle";
- wymóg dziewięciu opcji scenariusza początkowego nie jest spełniony przez ten
  harness;
- mapa świata, scena 3D/Canvas/WebGL, oryginalne assety, picking i pełny
  kontrakt UI nie są przez ten slice dowiedzione.

Status całego `src-tauri/frontend/**`: **REPLACE_OR_REWIRE**. Nie poprawiać tego
przez dopisywanie kolejnych placeholderów; następny temat ma podłączyć
reference frontend albo zatwierdzony, pełny adapter.

## Artefakty historyczne, których nie wolno awansować

- `t_ea768507/run827`: flow menu → wizard → mapa → ruch → tura; nie dowodzi
  parytetu wizualnego, pełnej puli civ, dziewięciu opcji ani rendererera świata.
- `t_8af96c46/run828`, `t_de820725/run829`, `t_a74f8635/run830`: MSI/NSIS
  obecnego slice'a; packaging nie jest acceptance 1:1 ani dowodem instalacji
  grywalnej po parytecie.
- bridge/status JSON, mock shell, nazwy przycisków i fake DOM: nie są dowodem
  żywego renderera.

## Artefakty generowane i wyłączone

- `rust-port/engine/Cargo.lock` był jedynym artefaktem w poprzedniej próbie;
  został usunięty przed tą bounded recovery i nie jest wejściem manifestu.
- `target/**`, `dist/**`, logi, cache i inne build outputs nie są dowodem ani
  częścią allowlisty. Ten recovery nie uruchamiał cargo, npm, Vite, Tauri,
  przeglądarki ani package managera.

## Ochrona lane'ów

`gra/**` i `gra-robocza/**` pozostają read-only. Nie kopiować do nich poprawek
Rust/Tauri. Instalator można tworzyć dopiero po zamknięciu kryteriów z
`03-KRYTERIA-AKCEPTACJI.md` oraz niezależnym Evaluatorze/Final Control.

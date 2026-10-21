import csv, collections
D='/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1'
rows=list(csv.reader(open(D+'/pokrycie-gra-src-edb8fb56-r5.tsv',encoding='utf-8'), delimiter='\t'))
hdr, body = rows[0], rows[1:]
assert len(body)==457, len(body)
st=collections.Counter(r[4] for r in body)
broad_files=sum(1 for r in body if int(r[1])>0)
broad_total=sum(int(r[1]) for r in body)
s5_files=sum(1 for r in body if int(r[2])>0)
zero_broad=sum(1 for r in body if int(r[1])>0 and int(r[2])==0 and r[3]=='0')
order=['POKRYTY','POKRYTY-R5','POKRYTY-zrodlo','ROZSTRZYGNIETY-R4','ROZSTRZYGNIETY','ROZSTRZYGNIETY-R5','WYKLUCZONY-R5','WYKLUCZONY-S6','WYKLUCZONY-ZERO']
stat_lines='\n'.join(f'| `{k}` | {st.get(k,0)} |' for k in order if st.get(k,0)>0)
total=sum(st.values())
sec94 = f"""### 9.4 Pokrycie per plik — 457/457 plików `gra/src` (runda 5/5)

**Zakres.** `git ls-tree -r --name-only edb8fb56 -- gra/src | grep '\\.ts$'` = **457** plików. Pozostałe pliki w `gra/src` (`.svg`, `.mp3`, `.jpg`, `.json`, `.md`, `.css`) nie są modułami logiki ani UI i są poza zakresem. Każdy z 457 plików ma wiersz w **Załączniku C** i w pliku `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r5.tsv`.

**Operacjonalizacja „komunikat / event logika→UI”** (jedna definicja dla wszystkich plików):
- **S5** (sygnał komunikatu lub wpisu kroniki; liczba linii w kolumnie `sygnal_S5`): `showHintMessage`, `showToast`, `showTechDiscoveryNotice`, `flashBanner`, `*Banner*(`, `show*(Notice|Modal|Popup|Dialog|Toast|Hint)(`, `open*(Modal|Dialog|Popup)(`, `notify[A-Z]…(`, `alert(`, `EventLog`, `eventLog`, `LogEntry`, `logEntry`, `.unshift(`, `.push({{…text|title|msg|message|body…}})`, `popup`, `dialog.show/open`.
- **S6** (wywołania nazwane, do przeglądu; kolumna `S6_nazwy`): `show[A-Z]…(`, `flash…(`, `[Tt]oast…(`, `announce…(`, `snack…(`, `pushMessage`, `setStatus(`, `addMessage(`, `addNotice(`, `[Nn]otice…(`. Nazwy z S6 w plikach bez S5 przejrzano ręcznie: są to otwarcia paneli, hover, ekran ładowania, API przeglądarki (FS), nie komunikaty logiki tury.
- `console.log` / `console.warn` **nie są sygnałem** (diagnostyka, nie UI; przykłady: E-49…E-51).

**Reguła dyspozycji** (kolumna `status_r5`, w tej kolejności):
1. Plik cytowany w wierszu katalogu `E-xx` (ścieżka `katalog/plik.ts` albo nazwa z myślnikiem, wielką literą lub ≥10 znaków) → `POKRYTY: E-xx`.
2. Plik z przeglądu rundy 3/4 z dyspozycją tekstową → zachowana dyspozycja (`ROZSTRZYGNIETY-R4`, `ROZSTRZYGNIETY`).
3. Plik z S5 > 0 bez pozycji 1–2 → dyspozycja ręczna z numerami linii (`ROZSTRZYGNIETY-R5`, `WYKLUCZONY-R5`, `POKRYTY-R5`).
4. S5 = 0, S6 > 0 → `WYKLUCZONY-S6`.
5. S5 = 0, S6 = 0 → `WYKLUCZONY-ZERO`.

**Wynik (457 plików, każdy z dyspozycją):**

| Status (`status_r5`) | Pliki |
|---|---|
{stat_lines}
| **Razem** | **{total}** |

Pliki z S5 > 0: **{s5_files}**. Pliki ze wszystkimi dyspozycjami z katalogu (`POKRYTY*`): {st.get('POKRYTY',0)+st.get('POKRYTY-R5',0)+st.get('POKRYTY-zrodlo',0)}; `main.ts` jest źródłem wszystkich wywołań E-01…E-60.

**Ograniczenie metody (jawne).** Szeroki wzorzec rundy 4 (`notify|alert|popup|dialog|log|toast|banner|notice|modal|hint|flash|snack|tooltip|event|message|emit|announce|ticker`, bez rozróżniania wielkości liter) trafia w **{broad_files}** plików (łącznie {broad_total} linii; kolumna `szeroki_r5_broad`). Tych linii **nie klasyfikowano pojedynczo**: w większości to `addEventListener`, identyfikatory z `event`/`log`/`catalog`/`dialog`, komentarze i CSS, ale nie każda linia została przeczytana. Dyspozycja `WYKLUCZONY-ZERO` opiera się na definicji S5/S6 powyżej, a nie na tym szerokim zliczeniu; w {zero_broad} plikach szeroki wzorzec trafia, a S5/S6 jest zerem. Jeśli Evaluator uzna S5/S6 za zbyt wąskie, zmiana wymaga zmiany definicji i ponownego przebiegu skryptów w `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/scratch-r5/` (`build_r5.py`), a nie ręcznego dopisywania wierszy.

"""
# appendix
def esc(s): return s.replace('|','/').replace('\n',' ').strip()
app = ["", "## Załącznik C — pokrycie per plik, 457 plików `gra/src` (`edb8fb56`, runda 5/5)", "",
       "Kolumny: nr · plik · szeroki wzorzec (liczba linii) · S5 (linii) · status · dyspozycja. Pełne dane (w tym nazwy S6): TSV `pokrycie-gra-src-edb8fb56-r5.tsv`.", "",
       "| nr | Plik | Szeroki | S5 | Status | Dyspozycja |", "|---|---|---|---|---|---|"]
for i,r in enumerate(body,1):
    app.append(f"| {i} | `{r[0]}` | {r[1]} | {r[2]} | `{r[4]}` | {esc(r[5])} |")
appendix='\n'.join(app)+'\n'

P='/home/user/The-Game/dyspozycje/rust-port/p2/P2-6-EVENTS.md'
txt=open(D+'/scratch-r5/stage1.md',encoding='utf-8').read()
anchor="## Załącznik A — 72 miejsca logiczne"
assert txt.count(anchor)==1
txt=txt.replace(anchor, sec94+"\n---\n\n"+anchor)
# section 7 control paragraph after the Suma line
sumline=[l for l in txt.split('\n') if l.startswith('Suma: 0 + 12 + 40 + 1 = **53**')]
assert len(sumline)==1
ctrl=("\n\n**Kontrola rundy 5/5 (skrypt na stanie dokumentu po edycji):** wierszy katalogu E-01…E-60 = 53, ID unikalne = 53. "
      "Statusy: CZĘŚCIOWY 12, BRAK 40, WYKLUCZONY 1 (E-45). Klasy: L 45, H 7, W 1 (E-45), S 0 (klasa `S` nie występuje). "
      "Wiersze E-49…E-55 (sekcja 3.F) są poza sekcją 7 i poza tą kontrolą.")
txt=txt.replace(sumline[0], sumline[0]+ctrl,1)
txt=txt.rstrip('\n')+'\n'+appendix
open(P,'w',encoding='utf-8').write(txt)
print('written', len(txt), 'lines', txt.count('\n'))
print(stat_lines); print('s5_files',s5_files,'broad',broad_files,broad_total,'zero_broad',zero_broad)

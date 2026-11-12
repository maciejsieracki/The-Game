#!/usr/bin/env bash
# Niezalezna weryfikacja zero-wolan funkcji pub fn z niepodpiete-surowe.tsv wg dispatchu (git grep, nie python).
# Uzycie (z korzenia repo): bash <ten-plik> <surowe.tsv> <wyjscie.tsv>
# Dla kazdej unikalnej nazwy z wierszy FN liczy linie git grep -w w rust-port/ (bez katalogow tests/ i benches/),
# pomijajac linie definicji `fn NAZWA` i linie `use`. Wynik 0 = zero wolan (potwierdzenie).
# Wynik >0 = linia tekstowo zawiera nazwe (np. komentarz albo wolanie w bloku #[cfg(test)] w src/) - do reczenia.
set -u
TSV="$1"
OUT="$2"
printf 'NAZWA\tLINIE_GIT_GREP_BEZ_DEF_I_USE\n' > "$OUT"
awk -F'\t' '$1=="FN"{print $5}' "$TSV" | sort -u | while read -r name; do
  n=$(git grep -h -w -e "$name" -- rust-port ':!*/tests/*' ':!*/benches/*' \
      | grep -c -v -E "fn ${name}([^A-Za-z0-9_]|\$)|^[[:space:]]*(pub )?use ")
  printf '%s\t%s\n' "$name" "$n" >> "$OUT"
done
echo "unikalnych nazw FN: $(awk -F'\t' 'NR>1' "$OUT" | wc -l)"
echo "nazw z 0 liniami: $(awk -F'\t' 'NR>1 && $2==0' "$OUT" | wc -l)"
echo "nazw z >0 liniami (do reczenia): $(awk -F'\t' 'NR>1 && $2>0' "$OUT" | wc -l)"

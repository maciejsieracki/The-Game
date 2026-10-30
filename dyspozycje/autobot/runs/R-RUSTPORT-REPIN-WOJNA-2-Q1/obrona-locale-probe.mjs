// Web (ICU) localeCompare vs. UTF-16 code-unit order used by Rust fallback for non-ASCII.
const pairs = [["ą", "b"], ["b", "ą"], ["ż", "z"], ["é", "f"], ["a", "B"], ["ł", "m"], ["prod_1_Łódź", "prod_1_Lodz"]];
for (const [a, b] of pairs) {
  const web = Math.sign(a.localeCompare(b));
  const utf16 = a < b ? -1 : a > b ? 1 : 0; // JS < compares UTF-16 code units, same as Rust encode_utf16 cmp
  console.log(JSON.stringify([a, b]), "web=", web, "utf16=", utf16, web === utf16 ? "SAME" : "DIFF");
}

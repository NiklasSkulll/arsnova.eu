// Literaturverzeichnis der Folien nach dem IU-Zitierleitfaden (ZL): dieselben Einträge und Jahresbuchstaben
// wie das Handout in PaperLab (presentation-semester-7-cloud-computing-1b-1c_jonas/main.bib, dort am Volltext
// und gegen Crossref geprüft). Schlüssel = bibkey dort; literatur.test.mjs gleicht beide ab.
// Eigene Arbeit ist ein Eintrag (weirauch2026c, im Handout ohne Jahresbuchstaben „Weirauch, 2026“); die Fundstelle
// (Ordner, Datei, ADR) steht im Kurzbeleg. Projektdokumente von arsnova.eu als Permalink auf a19ca70f, eigene Arbeit
// auf main des Forks (dort nach dem Merge, Wunsch des Autors 2026-11-15).
// Kurzbelege auf den Folien: kurzbeleg(schluessel, stelle) → „(Autor, Jahr, Stelle)“ (ZL S. 2–3, Anhang B).

const GH_FORK = 'https://github.com/NiklasSkulll/arsnova.eu/tree';
const GH_UP = 'https://github.com/kqc-real/arsnova.eu/blob/a19ca70f';

/** Alphabetisch wie im Handout. `kurz` ist die Autor-Jahr-Angabe des Kurzbelegs. */
export const LITERATUR = [
  {
    schluessel: 'arsnova2026adr0035',
    kurz: 'arsnova.eu-Projektteam, 2026a',
    voll: `arsnova.eu-Projektteam. (2026a, 17. Oktober). <i>ADR-0035: Selbstgehosteter Open-Weight-LLM-Server: llama.cpp (llama-server) statt Ollama</i>. GitHub. ${GH_UP}/docs/architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md`,
  },
  {
    schluessel: 'arsnova2026pruefung',
    kurz: 'arsnova.eu-Projektteam, 2026b',
    voll: `arsnova.eu-Projektteam. (2026b, 13. Oktober). <i>Referatsprüfung Cloud Computing: Verbindliche Umsetzung</i>. GitHub. ${GH_UP}/docs/didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md`,
  },
  {
    schluessel: 'dean2013',
    kurz: 'Dean & Barroso, 2013',
    voll: 'Dean, J. & Barroso, L. A. (2013). The tail at scale. <i>Communications of the ACM, 56</i>(2), 74–80. https://doi.org/10.1145/2408776.2408794',
  },
  {
    schluessel: 'ggml2026',
    kurz: 'ggml-org, 2026',
    voll: 'ggml-org. (2026). <i>llama.cpp: LLaMA.cpp HTTP server</i> (Version b10524) [Computer Software]. GitHub. https://github.com/ggml-org/llama.cpp/blob/b10524/tools/server/README.md',
  },
  {
    schluessel: 'kwon2023',
    kurz: 'Kwon et al., 2023',
    voll: 'Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Yu, C. H., Gonzalez, J. E., Zhang, H. & Stoica, I. (2023). Efficient memory management for large language model serving with PagedAttention. <i>Proceedings of the 29th Symposium on Operating Systems Principles</i>, 611–626. https://doi.org/10.1145/3600006.3613165',
  },
  {
    schluessel: 'papadopoulos2021',
    kurz: 'Papadopoulos et al., 2021',
    voll: 'Papadopoulos, A. V., Versluis, L., Bauer, A., Herbst, N., von Kistowski, J., Ali-Eldin, A., Abad, C. L., Amaral, J. N., Tůma, P. & Iosup, A. (2021). Methodological principles for reproducible performance evaluation in cloud computing. <i>IEEE Transactions on Software Engineering, 47</i>(8), 1528–1543. https://doi.org/10.1109/TSE.2019.2927908',
  },
  {
    schluessel: 'shankar2024',
    kurz: 'Shankar et al., 2024',
    voll: 'Shankar, S., Zamfirescu-Pereira, J. D., Hartmann, B., Parameswaran, A. G. & Arawjo, I. (2024). <i>Who validates the validators? Aligning LLM-assisted evaluation of LLM outputs with human preferences</i>. arXiv. https://doi.org/10.48550/arXiv.2404.12272',
  },
  {
    schluessel: 'ulrich2016',
    kurz: 'Ulrich, 2016',
    voll: 'Ulrich, M. (2016). Addressing cascading failures. In B. Beyer, C. Jones, J. Petoff & N. R. Murphy (Hrsg.), <i>Site reliability engineering: How Google runs production systems</i>. O’Reilly Media. https://sre.google/sre-book/addressing-cascading-failures/',
  },
  {
    schluessel: 'weirauch2026c',
    kurz: 'Weirauch, 2026',
    voll: `Weirauch, J. (2026). <i>Referat Thema 1, Aufträge 1B und 1C</i> [Referatsausarbeitung: Entscheidungen, Berichte, Messdaten]. GitHub. ${GH_FORK}/main/docs/referat-thema-1`,
  },
  {
    schluessel: 'yang2025',
    kurz: 'Yang et al., 2025',
    voll: 'Yang, A., Li, A., Yang, B., Zhang, B., Hui, B., Zheng, B., Yu, B., Gao, C., Huang, C., Lv, C., Zheng, C., Liu, D., Zhou, F., Huang, F., Hu, F., Ge, H., Wei, H., Lin, H., Tang, J., … Qiu, Z. (2025). <i>Qwen3 technical report</i>. arXiv. https://doi.org/10.48550/arXiv.2505.09388',
  },
];

const NACH_SCHLUESSEL = new Map(LITERATUR.map((e) => [e.schluessel, e]));

/** Kurzbeleg „(Autor, Jahr, Stelle)“; ohne Stelle nur, wenn das Werk als Ganzes gemeint ist. */
export function kurzbeleg(schluessel, stelle) {
  const e = NACH_SCHLUESSEL.get(schluessel);
  if (!e) throw new Error(`Literatur: ${schluessel} fehlt in LITERATUR`);
  return `(${e.kurz}${stelle ? `, ${stelle}` : ''})`;
}

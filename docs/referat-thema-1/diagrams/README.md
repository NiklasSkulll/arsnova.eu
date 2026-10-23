# Diagrams

Sources and rendered images of the diagrams in `docs/referat-thema-1/`. Each `<name>.mmd` has a `<name>.light.svg` and a `<name>.dark.svg`; never edit an SVG by hand.

| File                                    | Holds                                                                 |
| --------------------------------------- | --------------------------------------------------------------------- |
| `<name>.mmd`                            | the diagram (Mermaid)                                                 |
| `palette.light.mmd`, `palette.dark.mmd` | the colour classes flowcharts use                                     |
| `theme.light.json`, `theme.dark.json`   | fonts and base colours (mermaid-cli config)                           |
| `render.sh`                             | renders the SVGs: `docs/referat-thema-1/diagrams/render.sh [NAME...]` |

## Classes

Colour comes only from classes, never from `style` lines. A flowchart ends with the line `%% palette`; `render.sh` replaces it with the palette.

| Class                         | Use for                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `host`, `hostGroup`           | browser and host UI                                      |
| `app`, `appGroup`             | synchronous work on the app server                       |
| `contract`, `contractGroup`   | hashes, versions, schemas                                |
| `queue`, `queueGroup`         | the in-process summary queue                             |
| `runtime`, `runtimeGroup`     | adapter, LLM client, llama-server                        |
| `store`, `storeGroup`         | PostgreSQL and Redis                                     |
| `decision`                    | checks and branches                                      |
| `result`                      | the successful outcome                                   |
| `fallback`, `fallbackGroup`   | fallback outcomes                                        |
| `emph`, `ok`, `fail`, `muted` | edges: main path, success, failure path, secondary links |
| `dot`, `plain`                | legend helpers: invisible anchor nodes and plain text    |

Sequence diagrams use `box rgba(...)` with the same hues. Avoid parentheses in box names, because Mermaid then reads the colour as text.

Layout notes:

- Mermaid centres subgraph titles, so an edge entering the middle of a band crosses the title. Trailing (or leading) `⠀` (U+2800, blank in the render font) shifts a title left (or right).
- Put a node that belongs to a band inside that subgraph, and nest boundaries (such as the remote host) instead of placing loose nodes beside a band; dagre overlaps loose clusters.
- `1c-contract-layers` uses `layout: elk`; the others use the default layout.

## Render and check

1. Render: `docs/referat-thema-1/diagrams/render.sh <name>`. It runs a pinned mermaid-cli in Podman without network access (`DIAGRAMS_ENGINE=docker` for Docker).
2. Check: `grep -l "Syntax error" docs/referat-thema-1/diagrams/*.svg` must print nothing.
3. Look at each SVG in a browser, on a white and on a dark page. Every label must fit its box, no edge may cross a title, and every arrow must point the right way.
4. Commit the `.mmd` and both SVGs together.

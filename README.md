# CFG Derivation and Parse Tree Generator

A browser-based tool to parse a context-free grammar (CFG), derive a target string, and visualize:

- parsed grammar table
- leftmost and rightmost derivation steps
- full derivation chains
- parse tree

## Features

- Grammar input with multiple productions per non-terminal
- Support for epsilon using `ε` (or `epsilon`)
- Step-by-step derivation viewer with next/previous controls
- Full derivation view toggle
- Canvas-based parse tree rendering
- Quick example grammars

## Project Structure

- `index.html`: UI layout and script loading
- `css/style.css`: visual styles
- `js/grammar.js`: grammar parsing and validation
- `js/derivation.js`: derivation/parsing logic and tree construction
- `js/tree.js`: parse tree renderer
- `js/app.js`: UI wiring and rendering logic

## Run Locally

1. Open the project folder.
2. Open `index.html` in a browser.

No build step or external dependencies are required.

## Usage

1. Enter grammar rules in the format `A -> alpha | beta` (one rule per line).
2. Enter a target string.
3. Click **Generate**.
4. Inspect:
   - parsed grammar
   - step-by-step leftmost/rightmost derivations
   - full derivation chains
   - parse tree

## Notes

- Non-terminals are expected to be uppercase single letters (`A-Z`).
- The first rule's left-hand symbol is used as the start symbol.
- If parsing times out, simplify the grammar or remove left recursion.

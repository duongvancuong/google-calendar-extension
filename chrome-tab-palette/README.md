# Tab Palette

A keyboard command palette to fuzzy-search and switch between open tabs across
all windows. Manifest V3, vanilla JS, retro terminal theme, VI/EN.

## Install (unpacked)

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select the `chrome-tab-palette/` folder.
3. Press **Ctrl+Shift+K** (Win/Linux) / **⌘+Shift+K** (mac) to open the palette.
   Rebind at `chrome://extensions/shortcuts` if it doesn't fire (note: macOS
   reserves Ctrl+Space / Ctrl+Shift+Space for input-source switching, so those
   combos never reach Chrome — avoid them on mac).

## Use

- Type to fuzzy-filter tabs by title or hostname.
- `↑ / ↓` (or `Ctrl+P / Ctrl+N`) move; `Enter` jump; `Ctrl+Backspace` closes the
  highlighted tab anytime; `Delete` closes it when the search field is empty; `Esc` dismiss.
- With no query, tabs are ordered most-recently-used; the previous tab is
  pre-selected, so the hotkey then `Enter` ≈ Alt+Tab for tabs.
- Once you start typing, matching **bookmarks** appear below matching tabs (marked
  with `★`); `Enter` on a bookmark opens it in a new tab.

## Develop

- `npm install`
- `npm test` — Jest unit tests
- `npm run test:coverage` — coverage report

## Permissions

`tabs` (read titles/URLs, activate, close), `storage` (MRU order + language), and
`bookmarks` (read bookmarks to search and open them). No host permissions, no
content scripts — works on every page incl. `chrome://`.

# My Universe

*Build your own universe of ideas.*

My Universe is a note-taking app where each note is a **star** in your own personal universe.
Related ideas are joined by lines, so you can explore your knowledge as a map of space instead of folders and lists.

- **One note = one star.** Creating a note makes a new star appear with a short "birth" animation.
- **Categories have their own color *and* shape:** Ideas ✦ (gold sparkle), Learning (blue ringed planet),
  Goals ★ (pink star), Journal ☾ (purple crescent), Other ◆ (green diamond).
- **Lines are connections you choose** between related stars.
- **Everything is saved in your browser** (localStorage) and is still there after a reload.

It runs in desktop browsers (Chrome / Edge on Windows) and on iPhone Safari. There is nothing to install on the phone.

---

## 1. Requirements

- [Node.js](https://nodejs.org/) **20.19 or newer** (22 LTS recommended). Check with `node -v`.

## 2. Install and start (on your PC)

```bash
npm install      # first time only: downloads the libraries
npm run dev      # starts the development server
```

The terminal prints something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.23:5173/
```

Open **http://localhost:5173** in Chrome or Edge on the PC.
Stop the server with `Ctrl + C` in the terminal.

Other commands:

| Command             | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Development server with live reload (also reachable on your Wi-Fi) |
| `npm run build`     | Type-checks and builds the production files into `dist/`           |
| `npm run preview`   | Serves the built `dist/` folder at http://localhost:4173           |
| `npm run typecheck` | Only runs the TypeScript checker                                   |
| `npm test`          | Runs the unit tests (data logic and storage)                       |

## 3. Open it on your iPhone (same Wi-Fi)

The dev server is already set up to accept connections from other devices on your network
(`server.host: true` in `vite.config.ts`).

1. **Start the server on the PC:** `npm run dev`.
2. **Find the PC's local IP address.** Either:
   - read the `Network:` line printed by `npm run dev` (for example `http://192.168.1.23:5173/`), **or**
   - on Windows, open *Command Prompt* or *PowerShell* and run `ipconfig`. Under your Wi-Fi adapter
     ("Wireless LAN adapter Wi-Fi"), look at **IPv4 Address**, for example `192.168.1.23`.
3. **On the iPhone**, connect to the **same Wi-Fi network** as the PC, open **Safari** and enter
   `http://192.168.1.23:5173` (use your own IP, keep `:5173` and write `http`, not `https`).
4. Optional: tap **Share → Add to Home Screen** to open it like an app.

### If the iPhone can't connect

- **Same network?** The phone must be on the same Wi-Fi as the PC, not on mobile data, and not on a
  "guest" Wi-Fi. Many guest networks block devices from seeing each other (this is called "client isolation").
- **Windows Firewall.** The first time you run `npm run dev`, Windows may ask whether Node.js may communicate
  on networks. Allow it for **Private networks**. If you dismissed that dialog:
  *Windows Security → Firewall & network protection → Allow an app through firewall →* tick **Node.js** for *Private*.
- **Network profile.** Make sure your Wi-Fi is set to **Private**, not *Public*
  (*Settings → Network & Internet → Wi-Fi → (your network) → Network profile type*).
- **Right address?** Use the IPv4 address from `ipconfig` (usually `192.168.x.x` or `10.x.x.x`), add `:5173`,
  and start it with `http://`. If the PC has several adapters (VPN, Ethernet, virtual machines), try the one for Wi-Fi.
  Turning off a VPN can help.
- **Is the server still running?** The terminal running `npm run dev` must stay open.
- **Port in use?** If Vite says port 5173 is busy it picks another one (e.g. 5174). Use the port it prints.
- **Test from the PC first.** Open `http://<your-IP>:5173` in the PC's own browser. If that fails, the problem is on the PC side (firewall or server).

### Local development vs. putting it on the internet

- `npm run dev` + your IP address is **local only**. It works only inside your home or office Wi-Fi while your PC
  is on. Nobody on the internet can reach it, and it uses plain `http`.
- To use the app from anywhere, **deploy the built files** (`npm run build` → `dist/` folder) to a static
  hosting service that provides **HTTPS**, such as Netlify, Vercel, Cloudflare Pages or GitHub Pages.
  No server or database is needed, because it is a static website.

## 4. How to use it

| Action                    | Desktop (mouse)                   | iPhone (touch)                                   |
| ------------------------- | --------------------------------- | ------------------------------------------------ |
| Open a note               | Click a star                      | Tap a star (details open in a bottom sheet)      |
| Move a star               | Drag it                           | **Press and hold** it briefly, then drag         |
| Move around the universe  | Drag empty space                  | Drag with one finger                             |
| Zoom                      | Mouse wheel, or the + / − buttons | Pinch with two fingers                           |
| See star titles           | Hover a star                      | Titles are shown next to the stars               |
| Show everything           | ⛶ button (bottom-left)            | ⛶ button (bottom-left)                           |
| New star                  | **Add star** button, or press `N` | **+** button                                     |
| Search                    | Search box, or press `/`          | Search box at the top                            |
| Filter by category        | Category panel on the left        | Filter button (☰) at the top right              |
| Connect two stars         | Open a star → **Connect star**    | Same                                             |
| Remove a connection       | × next to it in the details       | Same                                             |
| Edit / delete             | **Edit** / **Delete** in details  | Same                                             |

Why "press and hold" on touch screens: a quick swipe that starts on a star moves the universe, and a short
hold picks up the star. This way you don't move stars by accident while exploring.

**Your data stays in this browser on this device.** The stars on your PC do not automatically appear on your
iPhone. To move them, use **⋯ → Export backup** on one device and **⋯ → Import backup** on the other.
Clearing the browser's website data also deletes your stars, so export a backup now and then.

## 5. Project structure

```
src/
├─ domain/                 Data model and rules (no React, no storage)
│  ├─ types.ts             Note, Connection, Position, UniverseData
│  ├─ categories.ts        Category names, colors and shapes
│  ├─ universe.ts          Pure functions: create/edit/delete notes, connect, search…
│  ├─ layout.ts            Star placement and overlap avoidance
│  └─ sampleData.ts        The demo stars shown on first launch
├─ storage/                Saving and loading
│  ├─ types.ts             UniverseStorage interface (swap in a cloud backend later)
│  ├─ localStorageAdapter.ts  The localStorage implementation
│  ├─ validate.ts          Repairs or rejects damaged saved data
│  ├─ backupFile.ts        Export / import JSON backups
│  └─ preferences.ts       Small UI settings (e.g. the dismissed tip)
├─ state/useUniverseStore.ts   React hook: holds the data, applies changes, auto-saves
├─ components/
│  ├─ universe/            The visual universe
│  │  ├─ Universe.tsx      SVG rendering, pan/zoom/drag/pinch gestures
│  │  ├─ StarNode.tsx      One star (shape, glow, label)
│  │  ├─ CategoryGlyph.tsx The five star shapes
│  │  └─ StarField.tsx     Decorative background stars (not clickable)
│  ├─ TopBar, SearchBox, CategoryFilter, DetailPanel, NoteFormModal,
│  ├─ ConnectPicker, ConfirmDialog, DataMenu, HelpDialog, Toast, Modal…
├─ hooks/                  Media queries, keyboard-aware viewport, element sizes
├─ App.tsx                 Puts everything together
└─ styles.css              All styling (colors are CSS variables at the top)
```

### Ideas for changing things

- **Category colors, names or shapes:** `src/domain/categories.ts`.
- **Demo stars:** `src/domain/sampleData.ts`.
- **Colors of the interface:** the `:root` variables at the top of `src/styles.css`.
- **Star size and zoom limits:** `starSize`, `MIN_ZOOM` and `MAX_ZOOM` in `src/components/universe/Universe.tsx`.

### Prepared for future features

- Notes, star positions (`layout`) and connections are stored separately. The visualization only reads them,
  so new sources of connections can be added without touching the drawing code.
- Every connection has an `origin` field. The app currently creates only `"user"` connections.
  `"ai"` is reserved for AI-suggested relationships.
- All saving goes through the `UniverseStorage` interface. A cloud or database adapter can implement the same
  `load` / `save` methods, and `validate.ts` already checks any incoming data.
- Not included in this version: AI features, accounts, cloud sync, importing web pages.

## 6. Tech

React 19 · TypeScript · Vite · hand-written SVG and Canvas (no graph library) · Pointer Events for mouse and touch ·
localStorage · Vitest for unit tests.

## 7. Browser support and known limitations

- Targets current Chrome and Edge on Windows, and Safari on iOS 15 and newer.
- Data lives only in one browser on one device (see Export / Import above). iOS may delete website data for
  sites you haven't opened for a long time, so keep a backup.
- Very large universes (many hundreds of stars) may feel slower on older phones. Everything is drawn as SVG.
- With many stars close together, labels can overlap until you zoom in.

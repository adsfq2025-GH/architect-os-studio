# Architect OS Studio — User Guide

*Turn website mockups into importable Elementor websites. No code required.*

## Install

- **Windows**: double-click `Architect OS Studio-Setup-<version>.exe` (or the `.msi`). Choose a
  folder if asked, finish, and launch from the Desktop or Start Menu.
- **macOS**: open the `.dmg` and drag **Architect OS Studio** into Applications. Launch from
  Launchpad or the Dock. (First launch: right-click → Open if Gatekeeper prompts.)

## Make your first website (about 3 minutes)

1. **New Project** — click *＋ New Project*. Enter the client name, project name, website type,
   and keep the builder on **Elementor**. Click *Continue → Upload*.
2. **Upload Mockups** — drag your page images in (PNG, JPG, WebP, PDF, or a ZIP), one per page.
   Add as many as you like, then *Analyze mockups →*.
3. **Analysis** — the app detects colors, type, spacing, components, pages, and navigation, and
   builds the site architecture. Watch the progress; it moves to the Blueprint automatically.
4. **Blueprint** — review the detected pages and templates. Everything look right? Click
   *Generate Website →*.
5. **Generate** — the engine compiles the site into an Elementor Website Kit. You'll see each
   step complete (Parsed → Analyzed → Translated → Packaged → Kit Valid → QA → Delivered).
6. **Quality Assurance** — see the pass/fail for compatibility, QA, acceptance, responsive, and
   fidelity. Click *Continue → Download*.
7. **Download** — your kit is already saved to **Downloads/<Client>-<Project>/website-kit.zip**
   along with PDF reports. Use *Download Elementor Kit*, *Open Output Folder*, or *View Reports*.

## Import into Elementor

1. In WordPress: **Elementor → Tools → Import / Export Kit → Import**.
2. Upload `website-kit.zip` and confirm.
3. After import: regenerate CSS (Elementor → Tools → Regenerate Files), assign your menu in the
   header template, set the contact form's recipient email, and replace placeholder images.

## Managing projects

The **Projects** dashboard shows Active, Completed, Failed, and Favorites, with search and sort.
On any project card: ★ to favorite, or ⋯ to **Duplicate**, **Export**, **Archive**, or **Delete**.

## Tips

- One mockup per page gives the cleanest page detection.
- Re-run anytime with *Generate Again* — results are deterministic (same input → same kit).
- The final "does it import perfectly" check happens when you import into WordPress; the app
  shows this as *Needs live* because it's confirmed on your site, not guessed.

## Getting help

Settings → **Export logs…** bundles the logs for support. Include them with any issue report.

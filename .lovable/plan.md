# Put the SyllaView logo across the site

This uses the "page and eye" logo, the one I recommended. If you'd rather use the color-grid logo, tell me and the same steps apply.

## Where it appears
- The top bar on every signed-in page, on both computer and phone, plus the phone menu.
- The landing page header.
- The sign-in page, in both places where the logo currently shows.
- The browser tab icon, using just the page-and-eye symbol.

The logo replaces the current placeholder globe icon and plain-text name everywhere it appears today.

## Technical details
- Copy the logo into `src/assets/syllaview-logo.png`. Crop out an icon-only version to `src/assets/syllaview-icon.png`.
- Rewrite `Logo.tsx` to render the full logo image at about 28px tall. The `compact` prop shows the icon only. Add alt text "SyllaView" and square corners.
- Favicon: add a 64px padded `public/favicon.png`, link it in the `__root.tsx` head, and remove `public/favicon.ico`.
- Check with screenshots of the landing page, sign-in page, and dashboard at desktop and phone sizes.

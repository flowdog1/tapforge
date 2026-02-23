# Cloudflare Pages NFC Multi-Client Static Structure

This repository is ready to deploy directly to Cloudflare Pages as static files.

## Current structure

```text
/carlos/
  index.html
  contact.vcf

/maria/
  index.html
  contact.vcf

/template-client/
  index.html
  contact.vcf
```

## Included example

`/carlos/` is a complete, production-style example with:
- mobile-first dark theme
- modern plain HTML + CSS (no frameworks)
- Add Contact button (`./contact.vcf`)
- Book Appointment button
- Call button

## Reusable template

Use `/template-client/` for any new client. Fields to update are clearly marked with `{{...}}` placeholders.

### Steps to add a new client

1. Choose a slug (example: `sofia`).
2. Duplicate the template folder:

```bash
cp -R template-client sofia
```

3. Keep `sofia/index.html` as-is (it auto-loads data from `./contact.vcf`).

4. Edit `sofia/contact.vcf` and replace all placeholders:
   - `{{NAME}}`
   - `{{BUSINESS_NAME}}`
   - `{{PHONE_E164}}`
   - `{{STREET_ADDRESS}}`
   - `{{CITY}}`
   - `{{STATE_OR_REGION}}`
   - `{{POSTAL_CODE}}`
   - `{{COUNTRY}}`
   - `{{BOOKING_URL}}`

5. Commit and deploy to Cloudflare Pages.

Each client can then be visited at:
- `https://<your-domain>/<slug>/`

Example:
- `https://<your-domain>/carlos/`

## How to add a different barber

If you design a card for a new barber, create a new slug folder from the template and edit the placeholders:

```bash
cp -R template-client <barber-slug>
```

Example:

```bash
cp -R template-client diego
```

Then edit only:
- `<barber-slug>/contact.vcf` with `FN`, `ORG`, `TEL`, `ADR`, and `URL`.

`index.html` now reads the `.vcf` file automatically, so the page content and buttons stay in sync with your contact file.

When deployed to Cloudflare Pages, the profile will be available at:
- `https://<your-domain>/<barber-slug>/`


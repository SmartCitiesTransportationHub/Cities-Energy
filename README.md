# NEXUS CITY & ENERGY — six teams, online editing

An English-language research network website for future urban energy, hosted on **GitHub Pages** with an online editor backed by **Supabase** (free plan). No build step.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Network overview, team directory, website contributors |
| `lab.html?lab=<team-id>` | One page per team: Home, Observatory, Research, People, Publications, About |
| `publications.html` | The single publication library shared by all six teams |
| `admin.html` | Sign-in and online editor (not linked from the public pages) |

Team IDs (do not change — they are the permanent links): `urban-cyber-physical-systems`, `transport-energy-networks`, `vehicle-cybersecurity`, `future-sustainable-cities`, `energy-economics-management`, `clean-energy`.

## Who can edit what

Permissions are enforced by the Supabase database (Row Level Security), not by the web page:

| | Administrator | Team account | Visitor |
| --- | --- | --- | --- |
| Own team page (text, background, people, photos, research, observatory text) | all teams | own team only | — |
| Network overview and website contributors | yes | — | — |
| Shared publications (text and figures) | yes | — | — |
| Create accounts, change roles | in the Supabase dashboard only | — | — |
| Read the website | yes | yes | yes |

Seven logins are expected: one administrator and one per team. Accounts are created in Supabase → Authentication → Users and assigned with `03_accounts.sql`.

## How content is loaded

1. Public pages read the published content from Supabase (`online-loader.js`, `cloud-api.js`).
2. If Supabase is not configured, unreachable or paused, the pages show the saved snapshot in `content-data.js` instead, so the site never goes blank. If one page's online content is invalid, only that page falls back.
3. Administrators can download a fresh snapshot from `admin.html` → **Download backup** and replace `content-data.js` in this repository. Do this after larger edits; it is also your backup (the free plan has no automatic backups).

## Files

```text
index.html  lab.html  publications.html  admin.html
styles.css  content.css  laboratories.css  admin.css
config.js          Supabase Project URL + publishable key (public values only)
cloud-api.js       sign-in, publishing and uploads (Supabase REST API)
online-loader.js   loads published content on public pages
admin.js           the online editor
content.js         validation and rendering of all content
content-data.js    offline snapshot of all content
lab-config.js      fixed team IDs, colours and observatory scenarios
app.js             observatory simulations (illustrative only)
navigation.js      navigation and mobile menu
assets/            default background image and owner-supplied portrait
CNAME  .nojekyll   custom domain and GitHub Pages settings
```

Never put a secret key, `service_role` key, database password or account password in any file in this repository.

## Images

Uploads (JPG, PNG, WebP; up to 3 MB after automatic resizing to at most 2000 px) are stored in the public Supabase bucket `team-media`, in one folder per team (`<team-id>/`), `network/` and `publications/`. Team accounts can upload only into their own folder.

## Observatory

All observatory data and models are illustrative and use disclosed constants; they are not sensor measurements, forecasts, security assessments or financial analysis.

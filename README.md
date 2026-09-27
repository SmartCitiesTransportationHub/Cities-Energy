# NEXUS CITY LAB

An English-language future cities laboratory website, ready for static hosting on GitHub Pages. No package installation or build step is required.

## Features

- Responsive homepage and interactive illustrative urban scenarios.
- People profiles with portraits, roles, research interests, biographies, websites and ORCID links.
- Publications ordered by year, with authors, journal details, DOI, publication page, optional full text and abstract.
- Editable laboratory name, homepage copy, introduction and background image.
- The public website has no content editor, write API, login form or GitHub credentials.

## Open locally

Open `index.html` in a browser. Keep all files and `assets/` together.

## Publish to GitHub Pages

Upload the **contents of this folder** to your repository root. `index.html` must be at the root, beside `content-data.js`, `app.js`, `content.js`, the stylesheets and `assets/`.

In the repository, choose **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Use the actual default branch if it has a different name. After deployment completes, use the URL shown in Pages settings.

- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)

## Update content

The complete local kit includes a sibling `lab-admin` folder. Keep it on your computer; it is not part of this public website.

1. Open `../lab-admin/editor.html` from the complete kit.
2. Select **People**, **Publications**, **Lab identity** or **Background**.
3. Edit and save the form to your local draft. Review the preview.
4. Choose **Export content file** and replace this folder's `content-data.js` with the downloaded file. Restore that exact filename if the browser added a suffix.
5. Reopen or reload `index.html` to review the update.
6. Commit `content-data.js` to your GitHub repository. GitHub Pages then publishes the updated content.

Alternatively, edit the JSON object in `content-data.js` directly. Keep the `window.LAB_CONTENT = ...;` wrapper and valid JSON syntax. Image files referenced as `assets/filename.webp` must also be committed.

The browser cannot silently overwrite your local website files. Saving a draft only updates browser storage; replacing `content-data.js` and committing it is an explicit step. If you edited the repository on another device, import its latest `content-data.js` before making further changes.

## Publishing authority

Use a repository owned by your GitHub account. To keep publishing restricted to you, do not give other users collaborator/write access or grant unneeded apps/deploy keys write permissions. Public visitors may read or copy the site, but cannot change this repository without write access. Authority is enforced by GitHub, not by a client-side password.

The local editor is a convenience tool, not an authentication system. Keep the `lab-admin` folder off the published website. No repository permissions have been configured by this deliverable because no target repository was supplied.

## Included research information

- Shuotong Su — PhD, as supplied by the owner.
- ORCID: [0009-0009-8239-4528](https://orcid.org/0009-0009-8239-4528).
- *A flexible waste bin number allocation plan applied to waste transportation electric fleets in smart cities*. Shuotong Su, Jiawen Hu, Wenjun Li, Domokos Esztergár-Kiss, Tuqiang Zhou. **Sustainable Cities and Society**, 121 (2025), 106223. [DOI](https://doi.org/10.1016/j.scs.2025.106223).

Bibliographic details were checked against the indexed [publisher record](https://www.sciencedirect.com/science/article/abs/pii/S2210670725001003) and the [TRID bibliographic record](https://trid.trb.org/View/2517168). Shuotong Su's portrait was supplied by the owner and is included unchanged as `assets/shuotong-su.png`. No affiliation, biography or paper abstract was invented. Full-text links remain empty until supplied.

## Files

```text
index.html          Public page structure
styles.css          Base visual design
content.css         Content sections and shared editor styling
app.js              Illustrative urban scenarios
content.js          Validated content rendering
content-data.js     Lab identity, background, members and publications
assets/             Local images
.nojekyll           Static Pages marker
ASSET-NOTES.md      Default image provenance
```

## Notes

City imagery is a concept visual. All observatory values and formulas are illustrative, not live measurements or validated scientific forecasts. The member and publication records are separate from the simulated city data.

Local drafts depend on browser storage and may be unavailable in private browsing or when quota is exceeded. The editor reports storage failures and provides file export/import. Portrait and background uploads are limited to 3 MB per image; content imports/exports to 20 MB. Each member has an independent portrait field.

The optional WebMCP simulation tool is feature-detected. Native WebMCP compatibility was not verified because the test environment does not expose that API. Ordinary browser interactions do not depend on it.

Verified in Microsoft Edge: English interface, 320/390/768/900 px layouts, simulations, profile and publication rendering, editing/add/delete, ORCID, photo upload, publication sorting, lab-name changes, background upload/reset, draft recovery, safe import, invalid input handling and export-to-website round trip. No browser script errors were observed. The public package excludes the editor.

Deployment status: ready to publish; no GitHub deployment has been performed.

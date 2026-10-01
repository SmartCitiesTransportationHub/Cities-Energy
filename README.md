# NEXUS CITY TEAM — six teams

An English-language research network website for future urban energy. Ready for GitHub Pages: no build step, installation, server or API key is required.

## Website structure

`index.html` is the network overview and team directory. Each team uses `lab.html` with its stable ID:

| Team | Link |
| --- | --- |
| Urban Cyber-Physical Systems | `lab.html?lab=urban-cyber-physical-systems` |
| Transport & Energy Networks | `lab.html?lab=transport-energy-networks` |
| Vehicle Cybersecurity | `lab.html?lab=vehicle-cybersecurity` |
| Future Sustainable Cities | `lab.html?lab=future-sustainable-cities` |
| Energy Economics & Management | `lab.html?lab=energy-economics-management` |
| Clean Energy | `lab.html?lab=clean-energy` |

Every team's navigation contains **Home, Observatory, Research, People, Publications and About**. Home, Observatory, Research, People and About are local sections. **Publications always opens the same `publications.html` shared library**, without separate team publication lists.

Shuotong Su's profile, owner-supplied portrait and ORCID are included in Urban Cyber-Physical Systems and Transport & Energy Networks, as requested. The overview displays only website contributor names and contributions. The supplied paper appears once in the shared library. Other teams have empty member sections ready for genuine records. Research descriptions are editable introductory themes, not claims of completed projects.

## Files to upload

Upload the contents of this public folder to the root of your GitHub repository:

```text
index.html
lab.html
publications.html
styles.css
content.css
laboratories.css
app.js
navigation.js
content.js
content-data.js
lab-config.js
.nojekyll
assets/
  city-hero.webp
  shuotong-su.png
README.md          optional documentation
ASSET-NOTES.md     optional asset provenance
```

For this upgrade, replace all matching public files and add all new files. Updating `content-data.js` alone cannot upgrade an older website. Keep an existing custom-domain `CNAME` file if you use one. Keep a backup of your existing content before upgrading.

Do not upload the ZIP archive itself, screenshots, or the sibling `lab-admin` folder. The entry file `index.html` must be directly at the publication root.

## GitHub Pages publication

1. Create or open a repository under your GitHub account. Public repositories support Pages on GitHub Free.
2. Upload this folder's contents with **Add file → Upload files**, then **Commit changes**.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, select **main** (or your actual branch) and **/(root)**, then save.
5. Wait for the Pages deployment workflow in **Actions** to succeed. Use **Visit site** in Pages settings.

[Official GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Local administration

The complete kit contains `future-city-lab/` and a sibling `lab-admin/`. Keep them together on your computer and open `lab-admin/editor.html`.

- **You are editing** selects the network overview or one of six teams.
- **Contributors** (network overview) maintains website credits: name and contribution only. No portrait, biography, qualification or ORCID is displayed on the overview.
- **People** (teams only) maintains independent member profiles and portraits.
- **Home & About** maintains names, metadata, headlines and introductory content.
- **Background** changes the selected page's background, description and credit.
- **Research** manages the selected team's topics, descriptions, details and keywords.
- **Observatory** changes the selected team's heading and introduction. It does not edit the fixed simulation formulas.
- **Manage shared publications** opens the single network publication library from any team.

Save each form before switching teams. Review the draft and choose **Export content file**. Replace `future-city-lab/content-data.js` with the downloaded file, review the local site, and commit it to GitHub to publish. Saving to browser storage does not overwrite local files or update GitHub automatically.

## Publication text and images

Each paper supports title, authors, year, venue, DOI, publication page, full text URL, abstract, **research content** (up to 16,000 characters), and **up to six images**. Add multiple local JPG/PNG/WebP files or individual image URLs, edit image descriptions and captions, or remove individual images.

Uploaded images are included in `content-data.js`; no separate image upload is needed. Per-image limit is 3 MB. Content import/export is limited to 20 MB overall, so use smaller images or URLs for large collections. Text is displayed safely as plain text with paragraph breaks, not executed as HTML. External image URLs remain dependent on the external host.

The shared page displays image galleries and captions; abstracts and longer text expand under **Read abstract** and **Read research details**. Publication images are initially empty because no paper figure was supplied.

## Data and migration

The current format is `{ version: 3, network, labs }`:

- `network.publications` is the only publication collection.
- `network.contributors` stores website credits separately from team members. Older files without this field show an empty credits section; network member records are never automatically credited as website contributors.
- Each team retains a stable `id`, site copy, background, member list, research topics and observatory introduction.
- Do not change team IDs; they determine permanent links.
- A version 1 import replaces the network overview and shared publications while preserving the current six teams.
- A version 2 import preserves its existing teams, adds Clean Energy if missing and merges previous publication lists into the shared collection. Matching DOI records are deduplicated; otherwise URL or title/year is used.
- Version 3 imports replace the entire network and all six teams after confirmation.

Export a backup before importing a different version. If you have made changes on GitHub or another computer, import that latest content before starting new edits. Browser drafts are device-local and may be unavailable in private browsing or when storage is full; the editor reports this and offers file export.

## Publishing access

The public website contains no editor, write endpoint, GitHub credentials or client-side password. Keep `lab-admin` local. Publication authority is enforced by GitHub repository permissions. To keep publishing restricted to you, retain sole write access and do not grant other collaborators or unnecessary integrations permission to write.

[GitHub personal repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).

## Research information and simulation limits

Shuotong Su — PhD (as supplied by the owner), [ORCID 0009-0009-8239-4528](https://orcid.org/0009-0009-8239-4528).

*A flexible waste bin number allocation plan applied to waste transportation electric fleets in smart cities*. Shuotong Su, Jiawen Hu, Wenjun Li, Domokos Esztergár-Kiss, Tuqiang Zhou. **Sustainable Cities and Society**, 121 (2025), 106223. [DOI](https://doi.org/10.1016/j.scs.2025.106223). Metadata was checked against the indexed publisher record and [TRID](https://trid.trb.org/View/2517168).

All observatory data and models are illustrative. Added sensing, cybersecurity and energy-economics models use disclosed invented constants; they are not sensor measurements, validated forecasts, security assessments or financial analysis. Optional WebMCP registration is feature-detected; native compatibility was not verified in this environment.

## Verification and delivery

Verified in Microsoft Edge: six team routes; all 18 scenario tabs; parameter limits; team switcher; scoped CSV export; mobile layouts; two assigned member records; one shared publication page reached from every team; independent team edits; image uploads; research content, captions and alternative text; old-format migration; duplicate paper consolidation; invalid file rejection; draft recovery; and version 3 export-to-website round trips. No script errors were observed.

Delivery date: 2026-10-01. Local files are ready; no GitHub deployment or repository permission changes have been performed.

All visitor-facing labels use Team / Teams. Existing file names and URLs remain compatible.

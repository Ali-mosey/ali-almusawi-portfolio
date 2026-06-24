---
name: indesign-portfolio-idml
description: >
  Import architectural project content (hero image, additional images,
  descriptions, titles, captions) into a provided InDesign template by editing
  the template's IDML file directly -- no InDesign required to run. The skill
  collects each project's hero image, other images, and description from the
  user, then produces a filled .idml. Use when the user wants to populate a
  portfolio/brochure .idml template with project data, upload images into the
  template's frames, or fill placeholder text. Triggers: "fill my InDesign
  template", "import my projects into the portfolio", "add my project images and
  description", "populate the .idml".
---

# InDesign Portfolio IDML Importer

Populate an InDesign template by editing its **IDML** (the open, XML-based
InDesign format) directly. The pipeline never opens InDesign: it unzips the
`.idml`, rewrites text and injects images into the XML, and re-zips a valid
`.idml` the user opens in InDesign and exports to PDF.

The skill is **project-based**: for each project the user provides a hero image,
any additional images, and a description (plus title/subtitle/captions). A
template profile maps those to the correct frames and text stories.

## Interactive intake (do this every run)

**First, render the intake form artifact.** As soon as the skill is invoked,
show the interactive form so the user can enter all text content in one place.
Render the contents of `assets/intake-form.html` as an in-chat widget (use the
visualization/`show_widget` tool, passing the file's HTML as the widget code).
The form covers the cover, contact, and projects A–D, has prefill buttons (My
details / Example / Blank), and an "Add project" button for slots beyond D.

The form also has a per-slot image picker (cover hero, and each project's hero
and image frames). Picking a file previews it and records its **filename** into
the matching `hero_image`/`images[]` field — the widget can't transfer the file
bytes, only the name.

When the user clicks **Generate portfolio data**, the form sends a message back
to chat containing a ready-to-use `projects.json` (with image filenames already
mapped to frames) plus an explicit "image → frame" list and any unfilled slots.
Take that JSON as the intake result, then ask the user to upload those exact
files to chat, and run the build with `--images-dir` pointed at the upload
folder so the filenames resolve. Skip the question-by-question flow below unless
the user prefers it or the artifact can't render.

If the artifact can't be rendered (or the user prefers chat), fall back to the
**AskUserQuestion** tool (or plain prompts) to collect, per project:

1. **Hero image** -- the main/largest image on the project's spread. Ask the
   user to upload it; read it from the uploads folder.
2. **Other images** -- the remaining images for that project's smaller frames,
   in order. Ask how many and collect uploads. The profile lists how many
   secondary frames each project has (see below), so tell the user the count.
3. **Description** -- the body paragraph for the project.
4. **Title & subtitle** -- the project name and its one/two-line subtitle.
   Use `\n` for line breaks in the subtitle.
5. **Captions** (optional) -- short captions for the project's images.

Also offer to set the **cover** (title, subtitle, optional cover image) and the
**contact** line. The contents page labels update automatically from each
project's title, and each project's hero is reused as its contents thumbnail
unless the user supplies a separate `thumbnail`.

Frame counts per project in the supplied template (hero + others):
- **Project A**: hero + 2 other images, 2 captions
- **Project B**: hero + 2 other images, 2 captions
- **Project C**: hero + 2 other images, 2 captions
- **Project D**: hero + 2 other images, 3 captions
- **Cover**: 1 hero image

Confirm uploads with the user before building. If they only have some content,
fill what they give and leave the rest as the template default (every field is
optional).

## Build steps

1. **(First run on a new template only)** Verify the profile matches the file:
   ```
   python3 scripts/inspect_idml.py "TEMPLATE.idml" --print
   ```
   If Story/frame IDs differ from `reference/template-profile.json`, update the
   profile. For the user's "Portfolio Architecture Template.idml" the bundled
   profile already matches (cover, contents, projects A–D, contact).

2. **Assemble `projects.json`** from the intake (schema in
   `reference/projects-schema.md`, worked example in
   `examples/projects.example.json`). Point image fields at the uploaded file
   paths.

3. **Build the filled IDML:**
   ```
   python3 scripts/build_portfolio.py "TEMPLATE.idml" projects.json \
       -o "Portfolio_filled.idml" --images-dir <folder 
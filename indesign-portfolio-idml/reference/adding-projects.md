# Adding more projects later

The template ships with a fixed number of project spreads. This skill **fills
existing slots**; it does not synthesise new pages, because cloning a spread in
raw IDML means cloning the spread XML, every linked story, generating fresh
`Self` IDs, and registering them in `designmap.xml` and the contents list --
fragile to do blind.

Recommended approaches, simplest first:

1. **Keep a roomier master template.** In InDesign, duplicate a project spread
   to create as many empty project slots as you'll ever need, save as a new
   `.idml`, and use that as the template. Re-run `inspect_idml.py` to get the new
   slot/story IDs. Filling unused slots with placeholder text is fine.

2. **Duplicate the spread per batch.** When you need another project, duplicate
   a project spread in InDesign (Pages panel > duplicate), export to `.idml`,
   then re-run the fill. One manual step, fully reliable.

3. **Programmatic spread cloning (advanced).** Possible but out of scope here;
   it requires deep-copying the spread + stories and rewriting IDs. Only worth
   building if projects are added very frequently.

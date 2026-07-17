# Excel Export Setup

The application exports occurrence and corrective-action data using customizable Excel templates.

## Templates

Create Excel templates for:

- Occurrences
- Corrective actions

Templates are uploaded directly through the admin panel—no UploadThing account, external file host, or template environment variables are required.

1. Sign in as an administrator.
2. Open **Admin** and select **Templates**.
3. Use **Upload Template** under either **Occurrence Template** or **Corrective Action Template**.
4. Use **Download** to inspect the currently active template.

Use `occ` in the occurrence template filename and `ca` in the corrective-action template filename. The uploaded file is stored directly in the database with file type `TEMPLATE`. When generating an export, the application selects the most recently uploaded matching template.

Templates may be up to 10 MB and must use an allowed Excel format (`.xlsx` or `.xls`). Export generation uses `xlsx-populate`, with `.xlsx` as the expected working format.

Select **Configure Template Mappings** in the same admin section to map report data points to Excel cells. These mappings are also stored in the database.

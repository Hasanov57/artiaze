# Artiaze

A website for students to publish their own articles about the technology field.

Artiaze is a student technology article platform. Students can create accounts, submit article drafts, browse published writing by topic, field, or tag, and interact with articles through comments, likes, shares, and view statistics.

## Backend

Artiaze uses Supabase for:

- Authentication
- Article storage
- Admin review status
- Comments
- Likes
- View and share counts

Run `supabase/schema.sql` in the Supabase SQL editor, then add your project URL and anon key to `supabase-config.js`.

## Run Locally

Open `index.html` in a browser, or serve the folder with a small static server.

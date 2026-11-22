# GrantRadar

Website for GrantRadar, a concept business created for BUSM 1115 Entrepreneurship at Langara College.

GrantRadar spots the government grants a small business would miss and drafts the application for one flat fee. Searching is free, and the business keeps 100% of its grant.

The whole site is a single static page (`index.html`) served with GitHub Pages.

Live site: https://luigichong.github.io/grantradar/

## Beta app

`app/` is the GrantRadar beta: a free grant matcher for B.C. small businesses, live at https://luigichong.github.io/grantradar/app/.

- `app/programs.js` holds the hand-checked program list. Re-check each program on its official page monthly and update its `checked` date.
- `app/app.js` holds the matching logic and a `CONFIG` block at the top: paste the team's Google Form link there to turn on draft requests.
- Matching runs in the browser. Nothing is sent anywhere unless an owner opens the request form.

# WhitefieldHouse Quote Calculator

The book printing quote calculator for WhitefieldHouse, hosted on GitHub Pages and kept separate from the main site at [whitefieldhouse.com.ng](https://whitefieldhouse.com.ng/).

Customers enter their copies, page counts and paper type, see the price update as they type, then send the finished order to WhatsApp (+234 813 151 3534). It is plain HTML, CSS and JavaScript, so there is no build step.

## Publish on GitHub Pages

1. Create a new public repository on GitHub, for example `whitefield-quote-calculator`.
2. Upload everything in this folder to the root of the repository, including the hidden `.nojekyll` file.
3. In the repository, open **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, then save.
4. After a minute or so the calculator is live at `https://<your-username>.github.io/whitefield-quote-calculator/`.

If you use git instead of uploading in the browser:

```bash
git init -b main
git add .
git commit -m "Quote calculator"
git remote add origin https://github.com/<your-username>/whitefield-quote-calculator.git
git push -u origin main
```

## Changing prices or the WhatsApp number

Both are at the top of `app.js`:

- `CONFIG.whatsapp` is the number that orders go to, written as digits with the country code and no `+`.
- `PRICING` holds the minimum order, the per-page rates and the quantity tiers.

The main site's Book Printing page shows the same pricing table, so update the prices there as well.

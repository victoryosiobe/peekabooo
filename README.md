# 👀 peekabooo

**A tiny web preview API** that lets you _screenshot any website like a ninja_.  
Built with [Puppeteer](https://pptr.dev/), and rocking on Express.  
You send a URL, it returns a clean shot — no questions asked.

---

## ⚡ What's peekabooo?

> _"You peek, I boo. It’s a website preview."_  
> This is a microservice that captures full-resolution screenshots of websites.  
> Plug it into your dashboard, builder, or just spy on your own deploys for fun.

It’s simple, headless, and fits right in — like your best line of code on a Sunday night.

---

## 🎯 Usage

Hit this endpoint like:

GET https://peekabooo.vercel.app/screenshot?url=https://example.com&width=1280&height=720

### 🧾 Query Params

| Name     | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| `url`    | string | The full URL you wanna screenshot |
| `width`  | number | (optional) Width of the viewport  |
| `height` | number | (optional) Height of the viewport |

If `width`/`height` aren't set, defaults to `1366x768`, just like your favorite VS Code tab.

You could send requests as your website resizes so you get a perfect fit for all screens.

---

## 🖼️ Response

- Content-Type: `image/png`
- Returns: the sweet, pixel-perfect PNG screenshot of your target site.

No wrappers. No junk. Just straight-up image.

---

## 🚀 Deployed on Vercel?!

It's built to play nice with Vercel, using the `puppeteer` packages, and `@sparticuz/chromium` package for chromium, as vercel doesn't come with chromium pre-installed.

---

## 🤖 Example Fetch

```js
fetch(
  "https://peekabooo.vercel.app/screenshot?url=https://github.com/victoryosiobe/peekabooo&width=1000&height=600",
)
  .then((res) => res.blob())
  .then((blob) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });

// Boom! Screenshot shows up in the browser like magic. No iframes, no drama.
```

---

🧠 Built by

Victory Osiobe, and the GPT-4o model (It added the funky humor you seeing in this README file, lmafo).

---

💡 Ideas?

Use peekabooo for link previews in your blog.

Make a meta tag validator with screenshots.

Flex it on X/Twitter with "just deployed" shots.

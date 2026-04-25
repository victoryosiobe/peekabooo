# peekabooo

**A tiny web preview API** that lets you screenshot any website on demand.  
Built with [Puppeteer](https://pptr.dev/) and Express. Send a URL, get a PNG back. That's it.

---

## What's peekabooo?

A lightweight microservice that captures screenshots of websites via a simple HTTP request.  
Plug it into a dashboard, link preview system, or just use it to spy on your own deploys.

Headless, stealthy, and runs on Vercel without any extra setup.

---

## Usage

```
GET https://peekabooo.vercel.app/screenshot?url=https://example.com&width=1280&height=720
```

### Query Params

| Name       | Type    | Default  | Description                                                             |
| ---------- | ------- | -------- | ----------------------------------------------------------------------- |
| `url`      | string  | required | The full URL to screenshot                                              |
| `width`    | number  | `1280`   | Viewport width in pixels                                                |
| `height`   | number  | `720`    | Viewport height in pixels                                               |
| `fullPage` | boolean | `false`  | If `true`, captures the entire page height instead of just the viewport |

---

## Response

- **Content-Type:** `image/png`
- Returns a raw PNG screenshot. No wrappers, no JSON envelope.

---

## How it works on Vercel

Vercel doesn't ship with Chromium, so peekabooo uses `@sparticuz/chromium` to bundle a lightweight Chromium binary that runs in Vercel's serverless environment alongside `puppeteer-extra` with stealth plugins to avoid bot detection.

---

## Example

```js
fetch(
  "https://peekabooo.vercel.app/screenshot?url=https://github.com/victoryosiobe/peekabooo&width=1000&height=600&fullPage=true",
)
  .then((res) => res.blob())
  .then((blob) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
```

---

## Ideas

- Link previews in a blog or CMS
- Meta tag validator with visual output
- "Just deployed" screenshots posted automatically to X

---

Built by [Victory Osiobe](https://github.com/victoryosiobe)

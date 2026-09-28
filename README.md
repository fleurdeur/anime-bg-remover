# Anime BG Remover

A browser-first ML background remover for anime artwork, people, and objects.

## Features

- Automatic subject segmentation using `@imgly/background-removal`.
- Red overlay shows the pixels that will be kept.
- Keep-subject and erase-background brush modes.
- Transparent PNG export.
- Uploads stay in the browser UI; the model runs client-side.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL, upload an image, wait for detection, refine the red selection, and export.

The first automatic detection downloads the ML model and may take a little longer than later runs.

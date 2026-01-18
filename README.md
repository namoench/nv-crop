# NV Crop

A client-side web app for cropping night vision photography into clean 9:16 social media format.

Night vision photographers shooting through PVS-14s with iPhones often get reflection artifacts on the tube edges. This tool lets you upload a photo, select a circular crop area to isolate the clean part of the night vision image, then export a 9:16 image (1080x1920) with the circular crop centered on a black background.

## Features

- **Drag & drop upload** - Supports JPG, PNG, HEIC, and HEIF formats
- **HEIC conversion** - Automatically converts iPhone HEIC photos
- **Interactive circle selector** - Drag to reposition, resize from edge handle
- **Edge styles** - Hard edge or feathered (vignette) edge
- **Mobile-friendly** - Touch support for repositioning and resizing
- **Instant export** - Download as PNG in 9:16 format (1080x1920)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to GitHub Pages

1. Create a GitHub repository named `nv-crop`

2. Initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nv-crop.git
   git push -u origin main
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

   This will build the app and publish to the `gh-pages` branch.

4. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Set source to "Deploy from a branch"
   - Select `gh-pages` branch, root folder
   - Save

Your app will be available at `https://YOUR_USERNAME.github.io/nv-crop/`

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- heic2any for HEIC/HEIF support
- Canvas API for image manipulation

## Usage

1. Upload a night vision photo (drag & drop or tap to select)
2. Drag the circle to position it over the clean part of the image
3. Drag the edge handle to resize the circle
4. Choose "Hard" or "Feathered" edge style
5. Tap "Download" to save the cropped image

The output is a 1080x1920 PNG with your circular crop centered on a black background, ready for Instagram Stories, TikTok, etc.

# Blanket Design Generator 🧶✨

A modern Progressive Web Application (PWA) and native mobile app (iOS & Android via Capacitor 6) for procedurally generating, customizing, and previewing patchwork crochet and knitting blanket layouts.

![Blanket Designer Banner](icons/icon-512.png)

## Features

- 🎨 **Procedural Patchwork Generation**: Generate random or custom patchwork layouts using classic granny squares, flower centers, mitered corners, diamonds, targets, and checkerboards.
- 🌈 **Motif Geometry Variety**: Choose from Square Grid, Hexagon Honeycomb, Isometric Triangles, Corner-to-Corner (C2C), or Continuous Stripe Rows.
- 📸 **Photo-to-Yarn AI**: Upload an inspiration photo to automatically extract dominant color palettes and match them to commercial yarn brands (Stylecraft, Paintbox Yarns, Scheepjes, Red Heart, Hobbii).
- 🖼️ **Multi-Layer Border Designer**: Add concentric border rounds with Echo Palette, Contrast, Ombre, or Randomized procedural color presets.
- 📐 **Yarn Estimator & Join Calculator**: Calculate estimated total meterage/yardage based on yarn weight, hook size, and seam joining methods (Single Crochet, Slip Stitch, Mattress, JAYG) with a 10% safety buffer toggle.
- 📝 **Round-by-Round Written Instructions**: Automatically generate step-by-step written pattern instructions formatted in US or UK crochet terms.
- 💾 **Offline & Native Capabilities**: Works 100% offline via Service Worker, with native platform haptics, system back-button handling, and native sharing bridge on iOS/Android.
- 📤 **Blueprint & Blueprint Export**: Export high-resolution PNG blueprints or multi-page PDF pattern documents.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Local Web Development
1. Clone the repository:
   ```bash
   git clone https://github.com/GeorgeMoraru/BlanketDesignGenerator.git
   cd BlanketDesignGenerator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm start
   ```
   Open `http://localhost:8080` in your browser.

---

## Native Mobile Build (Capacitor 6)

### Android
```bash
# Copy web build assets to Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

### iOS
```bash
# Copy web build assets to iOS project
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
```

---

## License

This project is licensed under the [MIT License](LICENSE).

# Adrian Photos Web - Art Gallery

A modern photo and art gallery website built with Angular 18 and Material Design.

## Features

- **Responsive Carousel**: Auto-playing image carousel with navigation controls
- **Material Design**: Clean, modern UI using Angular Material components
- **Categories Grid**: Browse art collections by category
- **Custom Typography**: Google Fonts (Prata for headlines, Oswald for body text)
- **Horizontal Navigation**: Sticky navigation bar with Material Design
- **Fully Responsive**: Works beautifully on desktop, tablet, and mobile devices

## Typography

- **H1 & H2**: Prata (elegant serif font)
- **H3 and below**: Oswald (modern sans-serif)
- **Body text**: Oswald

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

### Development Server

Run the development server:
```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Build

Build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── gallery/
│   │   ├── gallery.component.ts
│   │   ├── gallery.component.html
│   │   └── gallery.component.scss
│   ├── app.component.ts
│   └── app.routes.ts
├── assets/
├── index.html
├── main.ts
└── styles.scss
```

## Customization

### Adding Your Own Photos

Edit the `carouselPhotos` and `categories` arrays in [src/app/gallery/gallery.component.ts](src/app/gallery/gallery.component.ts) to add your own images.

### Changing Colors

Modify the Material theme in [src/styles.scss](src/styles.scss) to customize the color palette.

### Adjusting Carousel Speed

Change the interval in the `startAutoPlay()` method in [src/app/gallery/gallery.component.ts](src/app/gallery/gallery.component.ts) (default: 5000ms).

## Technologies Used

- Angular 18
- Angular Material
- TypeScript
- SCSS
- Google Fonts (Prata & Oswald)

## License

MIT

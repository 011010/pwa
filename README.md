# ITAM PWA - IT Asset Management Progressive Web App

A modern, offline-capable Progressive Web Application for IT Asset Management. Built with React, TypeScript, and Vite, featuring QR/barcode scanning, digital signatures, photo capture, and seamless offline synchronization.

## Features

### Core Functionality
- **🔐 JWT Authentication** - Secure token-based authentication with Filament API
- **📱 QR/Barcode Scanning** - Scan asset tags using device camera (@zxing/browser)
- **✍️ Digital Signatures** - Capture signatures for asset transfers and confirmations
- **📸 Photo Capture** - Take and upload asset photos directly from mobile device
- **🔄 Offline Sync** - Queue operations offline and sync when connection restores
- **💾 IndexedDB Storage** - Persistent local storage using localforage
- **🎨 Modern UI** - Clean, corporate design with TailwindCSS and Framer Motion
- **📱 Mobile-First** - Optimized for mobile devices with bottom navigation

### Technical Features
- Service Worker with Workbox for offline caching
- Automatic background sync
- Network-first API caching strategy
- Image caching for better performance
- PWA install prompts for mobile devices
- Responsive design with safe area insets

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7 with SWC
- **Styling**: TailwindCSS + Custom Components
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **PWA**: vite-plugin-pwa + Workbox
- **Scanner**: @zxing/browser
- **Signature**: signature_pad
- **Offline Storage**: localforage (IndexedDB wrapper)
- **Animations**: Framer Motion

## Project Structure

```
src/
├── assets/              # Static assets
├── components/          # Reusable UI components
│   ├── AssetCard.tsx
│   ├── BottomNav.tsx
│   ├── QRScanner.tsx
│   └── SignaturePad.tsx
├── config/              # Configuration files
│   └── environment.ts
├── context/             # React contexts
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
│   └── useOfflineQueue.ts
├── pages/               # Page components
│   ├── AssetDetail.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Scanner.tsx
├── services/            # API services
│   ├── api.ts
│   ├── assetsService.ts
│   └── authService.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main app component with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles with Tailwind directives
```

## Getting Started

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm or yarn
- Modern web browser with camera support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pwa
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_URL=https://your-filament-api.com/api
```

4. **Run development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Docker Development

### Using Docker Compose (Development)

```bash
docker-compose up
```

This runs the development server with hot reload enabled.

### Building Production Image

```bash
docker build -t itam-pwa .
docker run -p 80:80 itam-pwa
```

The app will be served via Nginx on port 80.

## API Integration

### Required API Endpoints

The application expects the following endpoints from your Filament API:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

#### Assets
- `GET /api/assets` - List all assets (with pagination, search)
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `POST /api/assets/scan` - Get asset by QR/barcode
- `GET /api/assets/:id/history` - Get asset history

#### Uploads
- `POST /api/uploads/photo` - Upload asset photo
- `POST /api/uploads/signature` - Upload signature

#### Sync (optional)
- `POST /api/sync/batch` - Batch sync offline operations

### API Response Format

```typescript
{
  "data": { ...asset data },
  "message": "Success message"
}
```

### Error Response Format

```typescript
{
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

## Features Guide

### QR/Barcode Scanning
1. Navigate to Scanner page
2. Grant camera permissions
3. Point camera at QR code or barcode
4. Asset details will load automatically

### Digital Signatures
1. Open asset detail page
2. Click "Digital Signature"
3. Draw signature on screen
4. Click "Save Signature"

### Photo Upload
1. Open asset detail page
2. Click "Add Photo"
3. Take photo or select from gallery
4. Photo uploads automatically (or queues if offline)

### Offline Mode
- Operations are automatically queued when offline
- Sync indicator shows pending operations count
- Auto-syncs when connection is restored
- Manual sync available in settings

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode enabled
- ESLint configuration included
- Consistent file structure
- Comprehensive inline documentation

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New Page**: Add to `src/pages/` and register route in `App.tsx`
3. **New Service**: Add to `src/services/`
4. **New Hook**: Add to `src/hooks/`

## Deployment

### Nginx Configuration

The included `nginx.conf` supports SPA routing:

```nginx
location / {
  try_files $uri /index.html;
}
```

### Environment Variables

Set these in your production environment:
- `VITE_API_URL` - Your Filament API URL
- Additional feature flags as needed

### PWA Icons

Place icon files in `public/icons/`:
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with camera API support

## Troubleshooting

### Camera Not Working
- Ensure HTTPS or localhost (camera requires secure context)
- Check browser permissions
- Verify camera hardware

### Offline Sync Issues
- Check browser supports IndexedDB
- Clear application data and retry
- Check network connectivity

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (20+ required)

## License

[Your License]

## Support

For issues and questions, contact your IT administrator or open an issue in the repository.

---

Built with ❤️ using React, TypeScript, and Vite

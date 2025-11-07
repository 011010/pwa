# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ITAM PWA is a Progressive Web Application built with React, TypeScript, and Vite. It uses SWC for fast refresh and is configured as a PWA with service worker support via vite-plugin-pwa.

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Type check with TypeScript and build for production
npm run lint         # Run ESLint on all files
npm run preview      # Preview production build locally
```

### Docker Development
```bash
docker-compose up    # Start development environment in container
```

Production build is containerized using a multi-stage Dockerfile with Node.js for building and Nginx for serving.

## Architecture

### Build System
- **Vite 7** with SWC plugin for fast refresh (not using Babel)
- TypeScript with strict mode enabled and composite project structure
- ESLint with TypeScript support and React-specific rules
- Path alias `@` configured to resolve to `src/` directory

### PWA Configuration
The application is configured as a Progressive Web App (vite.config.ts:9-24):
- Auto-updating service worker registration
- Manifest configured for standalone display mode
- Theme colors: background #F8FAFC, theme #2563EB
- Icons expected at `/icons/icon-192.png` and `/icons/icon-512.png`

### TypeScript Configuration
Uses a composite project structure with two configurations:
- `tsconfig.app.json` - Application code with strict linting rules (noUnusedLocals, noUnusedParameters)
- `tsconfig.node.json` - Node/build tooling configuration
- Target: ES2022 with DOM libs, JSX transform: react-jsx

### Deployment
Production deployment uses Nginx with SPA routing support (nginx.conf handles all routes via index.html fallback).

## Key Files
- `vite.config.ts` - Vite configuration including PWA manifest and path aliases
- `eslint.config.js` - ESLint flat config with TypeScript and React rules
- `dockerfile` - Multi-stage build: Node.js builder → Nginx server
- `docker-compose.yml` - Development container with hot reload (CHOKIDAR_USEPOLLING)

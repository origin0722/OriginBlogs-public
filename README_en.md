# OriginBlogs — Open Source Personal Blog Framework

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)

A Glassmorphism-style personal blog system built with Next.js, featuring a frontend display and a local backend management console. Supports Markdown writing, draft management, and image hosting configuration.

> **Attribution**: This project is a derivative of [Xinghuisama's XHBlogs (originally Kirameku)](https://github.com/Xinghongia/Kirameku), modified and republished under the [CC BY-NC 4.0](LICENSE) license. Thanks to the original author for their hard work and open source spirit.

---

## Language

English | [中文](README.md)

---

## Features

- Glassmorphism UI with dynamic gradients and image backgrounds
- TipTap rich text editor with Markdown rendering, LaTeX math, and code highlighting
- Local CMS backend powered by Python, with visual management for posts, drafts, and site config
- Photo wall, project showcase, and friend links
- NetEase Cloud Music playlist management and online playback
- Gitalk comment system based on GitHub Issues
- AI chat assistant compatible with DeepSeek / OpenAI API
- Creative workshop and RPG level system
- Dynamic seasonal effects (sakura, snow, fireflies)
- Responsive design with full mobile adaptation

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm
- Git
- Python >= 3.10

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/OriginBlogs-public.git
cd OriginBlogs-public

# Start the frontend
cd OriginBlogs
npm install
npm run dev
# Open http://localhost:3000

# Start the management backend (in a separate terminal)
cd ../my-blog-manager
# Windows: double-click Start.bat
# The script will auto-detect and install dependencies, then launch the backend console
```

Note: Do not rename the `my-blog-manager` folder, or path resolution will fail.

---

## Project Structure

```text
OriginBlogs-public/
├── OriginBlogs/              # Frontend blog (Next.js App Router)
│   ├── app/                  # Page routes
│   │   ├── about/            # About page
│   │   ├── chatter/          # Chatter
│   │   ├── friends/          # Friend links
│   │   ├── moments/          # Moments
│   │   ├── music/            # Music player
│   │   ├── photowall/        # Photo wall
│   │   ├── posts/            # Blog posts
│   │   ├── projects/         # Project showcase
│   │   ├── timeline/         # Timeline
│   │   └── tree/             # Creative workshop & level system
│   ├── components/           # Shared components
│   ├── custom/               # Custom extensions
│   └── public/               # Static assets
├── my-blog-manager/          # Local management backend
├── picture/                  # Documentation images
├── LICENSE                   # CC BY-NC 4.0
├── README.md
└── README_EN.md
```

---

## Deployment

### Push to GitHub

```bash
cd OriginBlogs
git init
git add .
git commit -m "first commit"
git remote add origin git@github.com:your-username/your-repo.git
git branch -M main
git push -u origin main
```

Using a private repository is recommended to protect data privacy.

### Deploy to Vercel

1. Sign up at [Vercel](https://vercel.com) and connect your GitHub account
2. Click Add New → Project, import your blog repository
3. Set Framework Preset to Next.js, then click Deploy

After deployment, Vercel provides a free subdomain. To use a custom domain, go to Project Settings → Domains, add your domain, and add the DNS records provided by Vercel at your DNS provider.

### Local Dual-Track Sync

The management backend uses an operation staging mechanism. To publish changes, follow this workflow:

```text
Stage to Queue → Update Local → Sync Blog → Push Source Code
```

---

## Configuration

### Image Hosting

It's recommended to use [7bu Image Hosting](https://7bu.top). Enter your API Token in the backend console. Direct image URL insertion is also supported.

### AI Assistant

Uses DeepSeek API by default (OpenAI-compatible format). Enter your API Key in the backend settings, then add the environment variable `DEEPSEEK_API_KEY` in your Vercel project settings.

### Comment System

Based on GitHub OAuth Apps + Gitalk:

1. Create a public GitHub repository to store comments
2. Go to GitHub Settings → Developer settings → OAuth Apps, create a new app
3. Set Homepage URL to your blog URL, and Authorization callback URL to your blog domain
4. Enter the generated Client ID and Client Secret in the backend comment settings

### NetEase Cloud Music

Open a song's detail page on the NetEase Cloud Music website — the numeric ID in the browser URL is the song ID. Paste it into the backend search box to add it to your playlist.

---

## Contributing

Issues and Pull Requests are welcome. Before submitting a PR:

- Do not commit personal configuration files
- Use environment variables for sensitive information
- Refer to `siteConfig.example.ts` and `.env.example` for required configuration fields

### Roadmap

- [ ] Docker deployment support
- [ ] More theme skins
- [ ] i18n multi-language support
- [ ] Email notification for comments

---

## License

This project is a derivative of [Xinghuisama's XHBlogs](https://github.com/Xinghongia/Kirameku), licensed under [CC BY-NC 4.0](LICENSE).

- Free to learn, share, and modify (derivative works must credit the original author)
- Commercial use is strictly prohibited

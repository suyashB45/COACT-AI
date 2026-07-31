# CoAct.AI — Frontend Web App

Welcome to the frontend repository for CoAct.AI. This application is built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. 

This guide is designed for human developers working on expanding this codebase into a premium, professional-grade website.

---

## 🚀 Quick Start (Local Development)

To start developing locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the Vite development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open `http://localhost:5173` in your browser.

---

## 🎨 Building a Professional, Premium Website

To ensure CoAct.AI maintains a world-class, premium aesthetic, all UI/UX contributions must adhere to the following principles:

### 1. The "Premium" Aesthetic Blueprint

To replicate a top-tier, modern SaaS aesthetic, follow these strict visual rules:

#### A. Color Palette (Dark Mode by Default)
Avoid default Tailwind colors. Use a highly curated, desaturated dark theme:
- **Background:** Rich dark, not pure black (e.g., `#0A0A0A` or `bg-zinc-950`).
- **Surface:** Slightly lighter cards with very subtle borders (e.g., `bg-zinc-900 border border-zinc-800`).
- **Primary Accent:** A vibrant, glowing color to draw the eye (e.g., Electric Blue `#3B82F6` or Neon Purple `#8B5CF6`).
- **Text:** High contrast but soft (e.g., `text-zinc-100` for headings, `text-zinc-400` for paragraphs).

#### B. The "Glassmorphism" Effect
Use this for floating navigation bars, modals, or overlapping cards:
```html
<div class="bg-zinc-950/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
  <!-- Content -->
</div>
```

#### C. Smooth Gradients & Glows
Professional sites rarely use flat colors. Use radial gradients to create glowing backgrounds behind important components:
```html
<div class="absolute -z-10 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full top-0 left-0"></div>
```

### 2. Component Structure

Keep components small and focused.
- **Reusable UI:** Place shared, generic components (Buttons, Modals, Inputs) inside `src/components/ui/`.
- **Feature Modules:** Group complex business logic into feature-specific folders (e.g., `src/features/simulation/`).

### 3. Essential UI Libraries (Recommended)
To replicate a top-tier website quickly, we recommend installing these industry-standard React libraries:
1. **[Tailwind CSS](https://tailwindcss.com/)** - Core styling (Already installed).
2. **[Framer Motion](https://www.framer.com/motion/)** - For all complex animations and page transitions.
3. **[Radix UI](https://www.radix-ui.com/)** or **[shadcn/ui](https://ui.shadcn.com/)** - For unstyled, fully accessible interactive components (Dropdowns, Dialogs, Selects) that you can wrap with your premium Tailwind styles.
4. **[Lucide React](https://lucide.dev/)** - For clean, consistent SVG icons.

### 4. Micro-Animations & Interactions
A premium website feels "alive". 
- **Hover States:** Always provide feedback on hover, but make it smooth.
  ```html
  <button class="transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
    Click Me
  </button>
  ```
- **Page Loads:** Use Framer Motion to stagger elements fading in on mount, rather than having them instantly appear.

### 5. Typography
- Rely on modern sans-serif fonts (like **Inter**, **Roboto**, or **Outfit**).
- Maintain a strict heading hierarchy (`<h1>` down to `<h6>`). 
- Use tracking (letter-spacing) intentionally: slightly tighter tracking on large, bold headings (`tracking-tight`), and wider tracking on uppercase sub-labels (`tracking-widest text-xs uppercase`).

---

## 📁 Project Structure

```text
src/
├── assets/          # Static assets (images, icons, fonts)
├── components/      # Reusable React components
│   ├── ui/          # Generic UI library components (Buttons, Inputs)
│   └── layout/      # Layout wrappers (Navbars, Footers)
├── contexts/        # React Context providers (State, Theme)
├── hooks/           # Custom reusable React hooks
├── lib/             # Utility functions and API clients
├── pages/           # Top-level route components
└── styles/          # Global CSS files and Tailwind base
```

---

## 🔧 Production Deployment

When building for production, the Vite application is bundled and served statically via an Nginx container.

1. **Build the bundle:**
   ```bash
   npm run build
   ```
2. **Docker Deployment:**
   The `Dockerfile` handles building the app and configuring Nginx with strict security headers, Gzip compression, and caching strategies. Ensure `docker-compose.yml` mounts the correct SSL certificates for the `https` configuration.

---

## 🛡️ Best Practices & Guidelines

1. **Strict TypeScript:** Do not use `any`. Always define proper interfaces for component props and API responses.
2. **SEO Optimization:** Use semantic HTML5 elements (`<article>`, `<nav>`, `<section>`). Include a robust `<head>` with dynamic title tags and meta descriptions for public-facing pages.
3. **Accessibility (a11y):** Ensure all interactive elements are keyboard navigable. Use `aria-labels` on icon-only buttons. Ensure sufficient contrast ratios for text.
4. **Performance:** Do not import massive libraries for single functions (e.g., avoid `lodash` if a native JS method works). Lazy load heavy routes using `React.lazy()`.

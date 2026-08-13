import re

with open('inter-ai-frontend/src/index.css', 'r') as f:
    content = f.read()

# Replace light mode
light_mode_regex = re.compile(r'/\* LIGHT MODE.*?--glass-shadow:.*?;', re.DOTALL)
new_light = """/* LIGHT MODE - Crisp, high contrast, clean */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.14 0 0);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.14 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.14 0 0);

  --primary: oklch(0.14 0 0);
  --primary-foreground: oklch(0.99 0 0);

  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.14 0 0);

  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.55 0 0);

  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.14 0 0);

  --destructive: oklch(0.58 0.2 25);
  --destructive-foreground: oklch(1 0 0);
  --success: oklch(0.62 0.19 145);
  --success-foreground: oklch(1 0 0);

  --border: oklch(0.92 0 0);
  --input: oklch(0.92 0 0);
  --ring: oklch(0.14 0 0);

  --radius: 0.5rem;

  --highlight: oklch(0.95 0 0);
  --annotation: oklch(0.55 0 0);

  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.05);
  --glass-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.04);"""
content = light_mode_regex.sub(new_light, content)

# Replace dark mode
dark_mode_regex = re.compile(r'/\* DARK MODE.*?--glass-shadow:.*?;', re.DOTALL)
new_dark = """/* DARK MODE - Deep, premium black */
  --background: oklch(0.15 0 0); /* Vercel dark #0a0a0a equivalent */
  --foreground: oklch(0.98 0 0);

  --card: oklch(0.18 0 0); /* slightly lighter than bg */
  --card-foreground: oklch(0.98 0 0);

  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(0.98 0 0);

  --primary: oklch(0.98 0 0);
  --primary-foreground: oklch(0.15 0 0);

  --secondary: oklch(0.22 0 0);
  --secondary-foreground: oklch(0.98 0 0);

  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.65 0 0);

  --accent: oklch(0.22 0 0);
  --accent-foreground: oklch(0.98 0 0);

  --destructive: oklch(0.5 0.18 25);
  --destructive-foreground: oklch(0.98 0 0);
  --success: oklch(0.55 0.18 145);
  --success-foreground: oklch(1 0 0);

  --border: oklch(0.26 0 0);
  --input: oklch(0.26 0 0);
  --ring: oklch(0.98 0 0);

  --highlight: oklch(0.25 0 0);
  --annotation: oklch(0.7 0 0);

  --glass-bg: rgba(10, 10, 10, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);"""
content = dark_mode_regex.sub(new_dark, content)

# Remove playful stuff
to_remove_start = content.find("  /* ═══════════════════════════════════════════════════════════════\n     Paper Grain Texture")
to_remove_end = content.find("  /* ═══════════════════════════════════════════════════════════════\n     Legacy Component Compat")
if to_remove_start != -1 and to_remove_end != -1:
    content = content[:to_remove_start] + content[to_remove_end:]

# Add grid-pattern background util
grid_pattern = """
  /* Linear-style Grid Pattern */
  .bg-grid-pattern {
    background-size: 40px 40px;
    background-image: 
      linear-gradient(to right, var(--color-border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-border) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  }
  
  .glass-panel {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: var(--glass-shadow);
  }
"""

content = content.replace("  /* ═══════════════════════════════════════════════════════════════\n     Legacy Component Compat", grid_pattern + "\n  /* ═══════════════════════════════════════════════════════════════\n     Legacy Component Compat")

# Remove blob and drawn stuff from end
end_rem_start = content.find("/* ═══════════════════════════════════════════════════════════════\n   Hand-drawn Connecting Lines")
if end_rem_start != -1:
    content = content[:end_rem_start]

with open('inter-ai-frontend/src/index.css', 'w') as f:
    f.write(content)


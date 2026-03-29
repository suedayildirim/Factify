@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 20% 7%;
    --foreground: 210 20% 92%;

    --card: 220 18% 10%;
    --card-foreground: 210 20% 92%;

    --popover: 220 18% 10%;
    --popover-foreground: 210 20% 92%;

    --primary: 160 70% 45%;
    --primary-foreground: 220 20% 7%;

    --secondary: 220 16% 16%;
    --secondary-foreground: 210 15% 75%;

    --muted: 220 14% 14%;
    --muted-foreground: 215 12% 50%;

    --accent: 35 90% 55%;
    --accent-foreground: 220 20% 7%;

    --destructive: 0 72% 55%;
    --destructive-foreground: 210 40% 98%;

    --border: 220 14% 18%;
    --input: 220 14% 18%;
    --ring: 160 70% 45%;

    --radius: 0.75rem;

    /* Factify custom tokens */
    --score-high: 160 70% 45%;
    --score-mid-high: 80 60% 48%;
    --score-mid: 35 90% 55%;
    --score-low: 0 72% 55%;

    --severity-high-bg: 0 60% 20%;
    --severity-high-text: 0 72% 70%;
    --severity-high-ring: 0 60% 35%;

    --severity-mid-bg: 35 50% 18%;
    --severity-mid-text: 35 80% 65%;
    --severity-mid-ring: 35 50% 35%;

    --severity-low-bg: 200 40% 18%;
    --severity-low-text: 200 60% 65%;
    --severity-low-ring: 200 40% 35%;

    --severity-info-bg: 220 14% 16%;
    --severity-info-text: 215 12% 60%;
    --severity-info-ring: 220 14% 25%;

    --gradient-hero: linear-gradient(135deg, hsl(160 70% 45% / 0.15), hsl(200 80% 50% / 0.08));
    --gradient-score: linear-gradient(135deg, hsl(160 70% 45%), hsl(200 80% 50%));

    --shadow-card: 0 4px 24px -6px hsl(0 0% 0% / 0.4);
    --shadow-glow: 0 0 40px -10px hsl(160 70% 45% / 0.2);

    --font-display: 'Space Grotesk', system-ui, sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: hsl(var(--background));
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

/* Trust meter animation */
@keyframes meter-fill {
  from { width: 0%; }
}

.animate-meter-fill {
  animation: meter-fill 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px -5px hsl(160 70% 45% / 0.3); }
  50% { box-shadow: 0 0 30px -5px hsl(160 70% 45% / 0.5); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

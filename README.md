# AmenAI - Office Configurator

AI-powered office space visualization tool with Porsche-inspired UI.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your OpenAI API key and Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
├── src/
│   ├── components/     # React components (Porsche UI)
│   ├── lib/           # Business logic & utilities
│   │   ├── supabase/  # Supabase client & product management
│   │   ├── catalogStore.ts  # Zustand store for catalog
│   │   └── openai*.ts # OpenAI integration
│   ├── store/         # Zustand stores
│   ├── types/         # TypeScript types
│   └── App.tsx        # Main app component
├── .env               # Environment variables
└── package.json       # Dependencies
```

## 🎨 Features

- **Porsche-Style UI**: Minimalist black/white design
- **Product Catalog**: Manage furniture products with Supabase
- **AI Generation**: OpenAI DALL-E 2 for space visualization
- **Configurator**: 2-step process (Photo → Configuration → Generate)

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI DALL-E 2 + GPT-4 Vision

## 📦 Supabase Setup

1. Go to your Supabase SQL Editor
2. Execute the SQL migration (see `OPENAI_SETUP.md`)
3. Verify `products` table and `product-images` bucket are created

## 📚 Documentation

- `QUICKSTART.md` - Quick start guide
- `OPENAI_SETUP.md` - OpenAI integration guide
- `PROMPT_GUIDE.md` - Prompt engineering guide
- `TROUBLESHOOTING.md` - Common issues and solutions

## 🔑 Environment Variables

```env
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📝 License

Private project - All rights reserved

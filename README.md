# 🚀 PingToPass - Nuxt Edition with Spike UI

**IT Certification Exam Preparation Platform - Built with Nuxt 3, Spike Admin Template, Turso, and Cloudflare**

> [!IMPORTANT]  
> This is a complete migration of PingToPass from FastAPI to Nuxt.js using the Spike Nuxt Admin Template, leveraging Cloudflare's global edge network for superior performance and analytics.

## 🎯 Overview

PingToPass helps IT professionals prepare for certification exams with:
- 📚 Comprehensive question banks for CompTIA, Cisco, Microsoft, and more
- 🧠 Adaptive study mode with spaced repetition
- ⏱️ Realistic timed test simulations
- 📊 Detailed progress tracking and analytics
- 🌍 Global edge deployment for <100ms response times
- 🎨 Modern UI with Spike Admin Template (Vuetify)

## 🚀 Migration from FastAPI

This project migrates all features from the original FastAPI PingToPass application:
- **Study Mode** - Practice questions with instant feedback
- **Test Mode** - Timed certification exam simulations
- **AI Question Generation** - OpenRouter integration
- **Progress Tracking** - Comprehensive analytics
- **Admin Panel** - Full content management
- **Twitter Integration** - Engagement tracking
- **Gamification** - Achievements and badges

## 🛠️ Tech Stack

### Core Framework
- **[Nuxt 3](https://nuxt.com)** - Full-stack Vue framework
- **[Vue 3](https://vuejs.org)** - Reactive UI framework
- **[TypeScript](https://www.typescriptlang.org)** - Type safety throughout

### UI & Styling
- **[Spike Admin Template](https://spike-nuxtjs-pro-main.netlify.app)** - Premium Vuetify admin template
- **[Vuetify 3](https://vuetifyjs.com)** - Material Design components
- **[Tabler Icons](https://tabler-icons.io)** - Modern icon set
- **[ApexCharts](https://apexcharts.com)** - Interactive charts

### Backend & Data
- **[Turso](https://turso.tech)** - Edge-native SQLite database
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[OpenRouter](https://openrouter.ai)** - AI question generation

### Infrastructure
- **[NuxtHub](https://hub.nuxt.com)** - Cloudflare deployment platform
- **[Cloudflare Workers](https://workers.cloudflare.com)** - Edge computing
- **[Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv)** - Edge key-value storage
- **[Cloudflare R2](https://developers.cloudflare.com/r2)** - Object storage

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```bash
# Google OAuth
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
NUXT_OAUTH_GOOGLE_REDIRECT_URL=http://localhost:3000/auth/oauth/google

# Turso Database
TURSO_DB_URL=your_turso_database_url
TURSO_DB_TOKEN=your_turso_auth_token

# Session
NUXT_SESSION_PASSWORD=your_session_password_32_chars_minimum

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
RESEND_API_TOKEN=your_resend_api_token
TWITTERAPI_IO_KEY=your_twitter_api_key

# App Settings
NODE_ENV=development
APP_NAME=PingToPass
BASE_URL=http://localhost:3000
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- [pnpm](https://pnpm.io) package manager
- Turso account for database
- Google OAuth credentials
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd pingtopass-nuxt
```

2. **Install dependencies with pnpm**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your values
```

4. **Run database migrations**
```bash
pnpm db:generate
pnpm db:migrate
```

5. **Seed the database (optional)**
```bash
pnpm db:seed
```

6. **Start development server**
```bash
pnpm dev
```

Visit `http://localhost:3000` to see your app running!

## 📁 Project Structure

```
pingtopass-nuxt/
├── app/                    # Nuxt app directory (pages will go here)
├── components/            # Vue components (Spike components)
├── server/                # Nitro server directory
│   ├── api/              # API routes
│   ├── database/         # Database schema and migrations
│   └── utils/            # Server utilities
├── public/               # Static assets
├── scripts/              # Database scripts
└── tests/               # Test files
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run all tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 🚀 Deployment

### Cloudflare Deployment (Recommended)

```bash
# Build for production
pnpm build

# Deploy to Cloudflare
pnpm deploy
```

### Local Preview

```bash
# Preview production build
pnpm preview
```

## 📊 Key Features Mapped to Spike Components

### User Interface
- **Dashboard** → Spike Dashboard1 components
- **Study Interface** → Custom cards with Spike form elements
- **Test Interface** → Spike stepper + timer components
- **Progress Charts** → Spike ApexCharts integration
- **Admin Tables** → Spike CRUD table components

### Authentication
- **Login/Register** → Spike auth pages with Google OAuth
- **Profile Management** → Spike user profile components

### Content Management
- **Vendor Management** → Spike data tables
- **Exam Management** → Spike form layouts
- **Question Editor** → Spike editor components
- **AI Generation** → Spike modal dialogs

## 🔄 Migration Status

This project migrates all features from the FastAPI version:
- ✅ Same Turso database - no data migration needed
- ✅ All API endpoints converted to Nuxt server routes
- ✅ HTMX replaced with Vue 3 reactivity
- ✅ Bootstrap replaced with Vuetify (Spike theme)
- ✅ Enhanced performance with edge deployment
- ✅ Improved UI/UX with modern admin template

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Original FastAPI implementation at `/entrepreneur/FastAI_pingtopass`
- Built with [Spike Nuxt Admin Template](https://themeforest.net/item/spike-nuxtjs-admin-template/50882689)
- Powered by [Nuxt 3](https://nuxt.com) and [Vue 3](https://vuejs.org)
- Database by [Turso](https://turso.tech)
- Deployed on [Cloudflare](https://cloudflare.com)

---

**Need help?** Check the [documentation](./docs) or open an issue.
# D'arjo — Cross-Border ROSCA & Credit Scoring Platform

D'arjo is a modern, mobile-first fintech application designed to modernize traditional rotating savings and credit associations (ROSCAs / Tandas / Esusu) across emerging markets. It introduces algorithmic credit scoring, currency volatility safeguards, and automated payout management.

---

## 🚀 Tech Stack & Infrastructure

- **Framework:** Next.js 16 (App Router with Server & Client Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **Database & ORM:** PostgreSQL (Neon Serverless) with Prisma ORM
- **AI Engine:** Google Gemini AI API (`@google/genai`) for intelligent score explanations and member nudges
- **Payments:** PayPal React SDK (`@paypal/react-paypal-js`)
- **FX Engine:** Custom in-memory cached volatility evaluation against USD

---

## 📁 Repository Architecture

```text
darjo/
├── app/
│   ├── (app)/
│   │   ├── assistant/      # AI Assistant chat & circle inspection drawer
│   │   ├── profile/        # D'arjo credit score ring & tier progression
│   │   └── circles/        # Active ROSCA pools and payout schedules
│   └── api/                # Next.js Serverless API endpoints
├── components/
│   ├── agent/              # CircleDrawer and Assistant UI cards
│   ├── profile/            # ScoreRing SVG progress gauge
│   └── ui/                 # Shared Tailwind design components
├── data/
│   └── countries.ts        # ISO country codes, currency mapping & PayPal flags
├── lib/
│   ├── api-client.ts       # Unified API client layer (Mock & Live toggle)
│   └── fx/                 # Currency volatility scoring engine with fallback
├── scripts/
│   └── seed.ts             # Database seeding script for mock users & events
└── public/                 # Static assets and icons

⚙️ Environment Configuration
Create a .env.local file in the root of your project:

Code snippet
# Toggle between local mock state and live backend services
NEXT_PUBLIC_USE_MOCKS=true

# API Keys & Credentials
FX_API_KEY=your_exchange_rate_api_key
GEMINI_API_KEY=your_google_gemini_key

# Database & Authentication
DATABASE_URL=your_neon_postgresql_url
JWT_SECRET=your_jwt_secret_key

# PayPal Sandbox Credentials
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
🛠️ Local Development Quickstart
Clone the repository and install dependencies:

Bash
git clone [https://github.com/your-org/darjo.git](https://github.com/your-org/darjo.git)
cd darjo
npm install
Seed local test data:

Bash
npm run seed
Start the local development server:

Bash
npm run dev
Open application:
Navigate to http://localhost:3000 in your browser. Use mobile viewport emulation (e.g., iPhone 12/14 — 390px width) for optimal testing.

🔀 Branching Strategy & Development Rules
Default Branch: master

Feature Branches: All individual work must be developed on feature branches prefixed with c/ (e.g., c/countries-data, c/fx-volatility, c/profile-screen, c/assistant-screen).

Pull Requests: All PRs target master and require review and approval from lead reviewers prior to merging.
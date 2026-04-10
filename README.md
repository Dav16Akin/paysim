# PaySim 💸

A modern payment simulation web application built with **Next.js**, **TypeScript**, and **Tailwind CSS**. PaySim lets users register, log in, view their wallet balance, send transfers, and track their transaction history — all backed by a live REST API.

![PaySim Dashboard](https://github.com/user-attachments/assets/ca74bc24-ddcf-4c85-a71d-776f15536708)

---

## Features

- 🔐 **Authentication** — Sign up and sign in with JWT-based sessions
- 💰 **Wallet** — View your real-time balance
- 🔄 **Transfers** — Send money to other users instantly
- 📊 **Transactions** — Browse your full transaction history with status indicators
- 📱 **Responsive UI** — Clean sidebar layout built with shadcn/ui and Recharts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | [shadcn/ui](https://ui.shadcn.com), Radix UI |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Backend API | Go REST API (hosted on Railway) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm / bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Dav16Akin/paysim.git
cd paysim

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the login page automatically.

---

## Project Structure

```
paysim/
├── app/
│   ├── login/          # Login & sign-up page
│   ├── dashboard/      # Main dashboard & transactions page
│   └── layout.tsx      # Root layout
├── components/
│   ├── shared/         # Sidebar, TransferModal
│   └── ui/             # shadcn/ui primitives
├── context/
│   └── AuthContext.tsx # Global auth state
└── lib/
    └── api.ts          # API client (auth, wallet, transactions)
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## API

The frontend communicates with a Go-based REST API deployed on Railway:

```
https://go-payment-api-production.up.railway.app
```

Key endpoints used:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sign-up` | Register a new user |
| `POST` | `/sign-in` | Authenticate and receive a JWT |
| `GET` | `/wallet?user_id=` | Fetch wallet balance |
| `GET` | `/transactions/user?user_id=` | Fetch user transactions |
| `POST` | `/transfer` | Send a payment |

---

## License

This project is open source and available under the [MIT License](LICENSE).

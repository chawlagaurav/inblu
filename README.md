# Inblu - Premium Water Filtration Australia

A production-ready ecommerce web application for water filtration products, built with modern technologies for Australian customers.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout + Webhooks
- **ORM**: Prisma
- **Animations**: Framer Motion
- **UI Components**: ShadCN-style (Radix UI primitives)
- **State Management**: Zustand
- **Notifications**: Sonner

## Features

- 🛍️ Water filtration product catalog with filtering and categories
- 🛒 Shopping cart with persistent state
- 💳 Secure checkout with Stripe
- 🔐 User authentication (Email/Password + Google OAuth)
- 👤 Admin dashboard for product/order/testimonial management
- 📱 Fully responsive mobile-first design
- 🎨 Premium UI with smooth animations
- 🇦🇺 Australian-specific features (GST, AUD, state selector)
- 🔍 SEO optimized with metadata

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── checkout/           # Checkout flow
│   ├── products/           # Product pages
│   └── about/              # About page
├── components/
│   ├── admin/              # Admin components
│   ├── auth/               # Auth components
│   ├── checkout/           # Checkout components
│   ├── home/               # Homepage sections
│   ├── layout/             # Layout components
│   ├── motion/             # Animation wrappers
│   ├── products/           # Product components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility libraries
│   └── supabase/           # Supabase clients
├── store/                  # Zustand stores
└── types/                  # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inblu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:
```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Supabase Setup

### Database

1. Create a new Supabase project
2. Copy the database URL to your `.env.local`
3. Run Prisma migrations to create tables

### Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. (Optional) Enable Google provider and add OAuth credentials

### Storage (for product images)

1. Go to Storage > Create bucket
2. Create a bucket named `products`
3. Set the bucket to public or configure RLS policies

## Stripe Setup

### Basic Setup

1. Create a Stripe account
2. Get your API keys from the Stripe Dashboard
3. Add keys to `.env.local`

### Webhook Setup (Local Development)

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Webhook Setup (Production)

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events: `checkout.session.completed`
4. Copy the signing secret to your production environment

## Admin Access

To grant admin access to a user:

1. Go to Supabase Dashboard > Authentication > Users
2. Find the user and click to edit
3. In the Raw User Metadata, add:
```json
{
  "role": "admin"
}
```

Alternatively, update via SQL:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE email = 'admin@example.com';
```

## API Routes

### Public Routes

- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get single product
- `GET /api/testimonials` - List testimonials
- `POST /api/checkout` - Create Stripe checkout session

### Protected Routes (Admin)

- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/orders` - List all orders
- `PUT /api/orders/[id]` - Update order status
- `PUT /api/testimonials/[id]` - Approve/update testimonial
- `DELETE /api/testimonials/[id]` - Delete testimonial

### Webhook

- `POST /api/webhook` - Stripe webhook handler

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Post-Deployment

1. Update Stripe webhook URL to production domain
2. Update Supabase Auth redirect URLs
3. Configure custom domain if needed

## Design System

### Colors

The app uses a sky-blue theme with a clean, premium aesthetic:

- **Primary**: Sky-500/600 (`#0ea5e9`, `#0284c7`)
- **Background**: Sky-50 to white gradient
- **Text**: Gray-900, Gray-600, Gray-500

### Components

All UI components follow the ShadCN pattern:
- Rounded corners (`rounded-2xl`)
- Soft shadows
- Smooth hover transitions
- Focus rings for accessibility

### Animations

Framer Motion components for:
- Page transitions
- Fade-in on scroll
- Slide-in effects
- Scale animations
- Staggered children

## License

MIT

## Support

For support, email support@inblu.com.au or open an issue in the repository.

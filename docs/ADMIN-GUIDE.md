# inBlu Australia - Administrator Guide

**Version:** 1.0  
**Last Updated:** May 2026  
**Platform:** inBlu E-Commerce Platform

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Admin Dashboard Overview](#3-admin-dashboard-overview)
4. [Orders Management](#4-orders-management)
5. [Products Management](#5-products-management)
6. [Categories Management](#6-categories-management)
7. [Inventory Management](#7-inventory-management)
8. [Customer Management](#8-customer-management)
9. [Purchase Orders](#9-purchase-orders)
10. [Service Requests](#10-service-requests)
11. [Marketing & Promotions](#11-marketing--promotions)
12. [Coupons Management](#12-coupons-management)
13. [Enquiries Management](#13-enquiries-management)
14. [Testimonials Management](#14-testimonials-management)
15. [Customer-Facing Features](#15-customer-facing-features)
16. [Payment Processing](#16-payment-processing)
17. [Email Notifications](#17-email-notifications)
18. [Security Features](#18-security-features)
19. [SEO & Analytics](#19-seo--analytics)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Introduction

Welcome to the inBlu Australia E-Commerce Platform Administrator Guide. This comprehensive document covers all features, functionalities, and operational procedures for managing your online store.

### Platform Overview

The inBlu platform is a modern e-commerce solution built with:
- **Next.js 16** - High-performance React framework
- **PostgreSQL** - Reliable database with Prisma ORM
- **Supabase** - Authentication and real-time features
- **Stripe & PayPal** - Secure payment processing
- **Cloudinary** - Image management and optimization
- **Resend** - Transactional email delivery

### Key Capabilities

- Full product catalog management
- Order processing and fulfillment
- Inventory tracking with purchase orders
- Customer relationship management
- Marketing campaigns and promotions
- Service request ticketing system
- Multi-payment gateway support
- Automated email notifications

---

## 2. Getting Started

### Accessing the Admin Panel

1. Navigate to: `https://yourdomain.com/admin05/login`
2. Enter your admin email and password
3. Click "Sign In"

> **Note:** The admin URL uses `/admin05` for security purposes. Only share this URL with authorized personnel.

### First-Time Setup Checklist

- [ ] Verify admin account access
- [ ] Configure payment gateways (Stripe/PayPal)
- [ ] Set up email notifications
- [ ] Add product categories
- [ ] Import/add products
- [ ] Configure marketing popup settings
- [ ] Test checkout flow with a test order

### Admin Navigation

The sidebar provides quick access to all management sections:

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Overview statistics and quick insights |
| **Orders** | View and manage customer orders |
| **Purchase Orders** | Track supplier purchase orders |
| **Service Requests** | Handle customer service tickets |
| **Customers** | View registered customer accounts |
| **Marketing** | Announcement bar and popup settings |
| **Coupons** | Create and manage discount codes |
| **Categories** | Organize product categories |
| **Products** | Full product catalog management |
| **Enquiries** | Customer enquiries and leads |
| **Testimonials** | Manage customer reviews |

---

## 3. Admin Dashboard Overview

### Dashboard Statistics

The dashboard displays key business metrics with date filtering:

#### Date Presets
- Today
- Yesterday
- This Week / Last Week
- This Month / Last Month
- This Year
- All Time
- Custom Date Range

#### Metrics Displayed

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Sum of all completed order amounts |
| **Total Orders** | Number of orders placed |
| **New Customers** | Newly registered accounts |
| **Average Order Value** | Revenue divided by order count |

#### Additional Dashboard Features

- **Low Stock Alerts** - Products with stock below threshold
- **Top Selling Products** - Best performers by revenue/quantity
- **Order Status Breakdown** - Pie chart of order statuses
- **Recent Orders** - Quick view of latest orders

---

## 4. Orders Management

### Order List View

Navigate to **Orders** to see all customer orders with:
- Order ID and date
- Customer name and email
- Total amount
- Order status and payment status
- Quick action buttons

#### Order Status Types

| Status | Description |
|--------|-------------|
| **PENDING** | Order received, awaiting processing |
| **PROCESSING** | Order being prepared |
| **SHIPPED** | Order dispatched to carrier |
| **DELIVERED** | Order received by customer |
| **CANCELLED** | Order cancelled |

#### Payment Status Types

| Status | Description |
|--------|-------------|
| **PENDING** | Awaiting payment |
| **PROCESSING** | Payment in progress |
| **SUCCEEDED** | Payment completed |
| **FAILED** | Payment declined |
| **REFUNDED** | Payment refunded |

### Order Details Page

Click on an order to view:
- Complete customer information
- Shipping address
- Ordered items with quantities and prices
- Payment details
- Order timeline

### Order Actions

1. **Update Status** - Change order status (Pending → Processing → Shipped → Delivered)
2. **Add Tracking Number** - Enter carrier tracking information
3. **Add Notes** - Internal notes for team reference
4. **Send Emails:**
   - Order Confirmation email
   - Shipped notification with tracking
5. **Generate Invoice:**
   - Preview invoice (opens in new tab)
   - Download PDF invoice
   - Email invoice to customer
6. **Cancel Order** - Cancel with confirmation

### Filtering & Search

- Filter by order status
- Filter by payment status
- Search by customer name, email, or order ID
- Date range filtering

---

## 5. Products Management

### Product List View

Navigate to **Products** to manage your catalog:
- Product image thumbnail
- Name and SKU
- Category
- Price
- Stock quantity
- Status (Active/Inactive)
- Drag-and-drop reordering

### Adding a New Product

1. Click **"Add Product"** button
2. Fill in required fields:

| Field | Description | Required |
|-------|-------------|----------|
| **Name** | Product display name | Yes |
| **Slug** | URL-friendly identifier (auto-generated) | Yes |
| **Description** | Detailed product description | Yes |
| **Price** | Retail price in AUD | Yes |
| **Category** | Primary category | Yes |
| **Additional Categories** | Secondary categories | No |
| **SKU** | Stock keeping unit | No |
| **Stock** | Inventory quantity | Yes |
| **Main Image** | Primary product image | Yes |
| **Additional Images** | Gallery images (up to 5) | No |
| **Product Manual** | PDF user manual upload | No |
| **Specifications** | Key-value pairs for specs | No |
| **Service Tenure** | Months until service due | No |
| **Related Products** | Cross-sell suggestions | No |
| **Best Seller** | Feature on homepage | No |
| **Active Status** | Show/hide product | Yes |

### Editing a Product

1. Click the **Edit (pencil)** icon on any product
2. Modify fields as needed
3. Click **"Save Changes"**

### Product Images

- **Main Image:** Displayed on product cards and as primary image
- **Gallery Images:** Shown in product detail carousel
- **Supported Formats:** JPG, PNG, WebP
- **Maximum Size:** 5MB per image
- **Recommended:** 800x800px minimum for quality display

### Product Specifications

Add technical specifications as key-value pairs:
```
Key: Filter Stages | Value: 7 Stage RO
Key: Tank Capacity | Value: 10L
Key: Warranty | Value: 2 Years
```

### Product Reordering

1. Navigate to **Products**
2. Drag products using the handle icon
3. Drop in desired position
4. Order is auto-saved

### Deleting a Product

1. Click the **Delete (trash)** icon
2. Confirm deletion in the dialog
3. If product has order history, it will be **deactivated** instead of deleted to preserve order records

---

## 6. Categories Management

### Category List View

Navigate to **Categories** to organize your product catalog:
- Category image
- Label (display name)
- Slug (URL identifier)
- Product count
- Display order
- Active status

### Adding a Category

1. Click **"Add Category"**
2. Enter:
   - **Label:** Display name (e.g., "RO Purifiers")
   - **Value/Slug:** URL-friendly (e.g., "ro-purifiers")
   - **Description:** Category description
   - **Image:** Category banner image
3. Click **"Save"**

### Category Reordering

Drag and drop categories to change display order on the storefront.

---

## 7. Inventory Management

### Stock Management

Each product displays current stock quantity. Stock is automatically:
- **Decreased** when orders are placed and paid
- **Reserved** during checkout (10-minute hold)
- **Released** if checkout expires or is cancelled

### Adding Stock

1. Go to **Products**
2. Click the **inventory icon** on a product
3. Select **"Add Stock"** tab
4. Enter:
   - **Quantity:** Units to add
   - **Unit Cost:** Purchase cost per unit (optional)
   - **PO Number:** Reference number (optional)
   - **Vendor Name:** Supplier name (optional)
   - **PO Document:** Upload purchase order PDF (optional)
5. Click **"Add Stock"**

### Adjusting Stock

1. Click inventory icon on product
2. Select **"Adjust Stock"** tab
3. Enter:
   - **New Stock Level:** Total quantity
   - **Reason:** Explanation for adjustment
4. Click **"Adjust"**

### Stock Reservations

When a customer proceeds to checkout:
1. Stock is **reserved** for 10 minutes
2. A countdown timer shows on the payment page
3. If payment completes → reservation converts to order
4. If timer expires → reservation releases, stock becomes available

This prevents overselling when multiple customers checkout simultaneously.

### Low Stock Alerts

Products with stock below threshold appear on the Dashboard with alerts.

---

## 8. Customer Management

### Customer List View

Navigate to **Customers** to view registered users:
- Customer name
- Email address
- Phone number
- Registration date
- Total orders
- Total spent

### Customer Details

Click on a customer to view:
- Account information
- Order history
- Contact details
- Account activity

### Guest vs Registered Customers

| Type | Description |
|------|-------------|
| **Registered** | Created account, can view order history |
| **Guest** | Checked out without creating account |

---

## 9. Purchase Orders

### Purpose

Track supplier purchase orders for inventory management and cost tracking.

### Creating a Purchase Order

1. Navigate to **Purchase Orders**
2. Click **"Add Purchase Order"**
3. Enter:
   - **PO Number:** Your reference number
   - **Vendor Name:** Supplier name
   - **Total Cost:** Order total
   - **PO Document:** Upload PDF (optional)

### Viewing Purchase Orders

- List view shows all POs with dates and costs
- Click to view details and associated inventory transactions
- Download attached PO documents

---

## 10. Service Requests

### Service Request Types

| Type | Description |
|------|-------------|
| **INSTALLATION** | New product installation |
| **MAINTENANCE** | Regular service/maintenance |
| **REPAIR** | Fix broken/malfunctioning product |
| **FILTER_REPLACEMENT** | Filter change service |
| **INSPECTION** | Product inspection |
| **WARRANTY_CLAIM** | Warranty-related issues |
| **OTHER** | General service requests |

### Service Request Statuses

| Status | Description |
|--------|-------------|
| **PENDING** | New request, not yet reviewed |
| **IN_PROGRESS** | Being worked on |
| **SCHEDULED** | Appointment scheduled |
| **COMPLETED** | Service completed |
| **CANCELLED** | Request cancelled |

### Priority Levels

- LOW
- NORMAL
- HIGH
- URGENT

### Managing Service Requests

1. Navigate to **Service Requests**
2. View list with ticket numbers (SR-YYYYMMDD-XXXX)
3. Click to open details
4. Update:
   - Status
   - Priority
   - Assigned technician
   - Scheduled date
   - Internal notes
   - Resolution notes

### Automatic Ticket Numbers

Each service request receives a unique ticket number:
- Format: `SR-YYYYMMDD-XXXX`
- Example: `SR-20260531-A7B2`

---

## 11. Marketing & Promotions

### Announcement Bar

A site-wide banner displayed at the top of every page.

**Configuration:**
1. Navigate to **Marketing**
2. Set:
   - **Banner Text:** Message to display
   - **Link URL:** Click destination (optional)
   - **Active:** Enable/disable

**Example:** "🎉 Free Shipping on Orders Over $500 - Shop Now"

### Discount Popup

A promotional popup that appears to new visitors.

**Configuration:**
1. Navigate to **Marketing** → **Popup Settings**
2. Configure:

| Setting | Description |
|---------|-------------|
| **Enabled** | Turn popup on/off |
| **Headline** | Main text (e.g., "GET $50 OFF") |
| **Subtext** | Supporting message |
| **Discount Code** | Auto-applied coupon code |
| **Discount Type** | Percentage or Fixed amount |
| **Discount Value** | Amount of discount |
| **Popup Delay** | Seconds before popup appears |
| **Start Date** | Campaign start (optional) |
| **End Date** | Campaign end (optional) |

**Popup Behavior:**
- Shows once per visitor (stored in localStorage)
- Collects email for newsletter signup
- Auto-applies discount code to cart

---

## 12. Coupons Management

### Creating a Coupon

1. Navigate to **Coupons**
2. Click **"Add Coupon"**
3. Configure:

| Field | Description |
|-------|-------------|
| **Code** | Unique coupon code (e.g., SUMMER20) |
| **Description** | Internal description |
| **Discount Type** | `percentage` or `fixed` |
| **Discount Value** | Percentage (10) or amount (25.00) |
| **Min Order Amount** | Minimum cart total required |
| **Max Discount** | Cap for percentage discounts |
| **Max Uses** | Total redemption limit |
| **Start Date** | When coupon becomes active |
| **End Date** | When coupon expires |
| **Active** | Enable/disable |

### Coupon Types

**Percentage Discount:**
- Code: `SAVE10`
- Type: Percentage
- Value: 10
- Result: 10% off cart total

**Fixed Amount Discount:**
- Code: `FLAT50`
- Type: Fixed
- Value: 50
- Result: $50 off cart total

### Tracking Usage

- **Used Count:** Shows redemption count
- **Max Uses:** Set usage limit
- Auto-deactivates when limit reached

---

## 13. Enquiries Management

### Enquiry Sources

Enquiries come from:
- Contact form
- Product enquiry forms
- General enquiry page

### Enquiry Statuses (Lead Pipeline)

| Status | Description |
|--------|-------------|
| **NEW_LEAD** | Fresh enquiry, not contacted |
| **INTERESTED** | Customer showed interest |
| **FOLLOW_UP** | Needs follow-up |
| **NEED_MORE_INFO** | Awaiting customer info |
| **QUOTATION_SENT** | Quote provided |
| **NEGOTIATION** | Price/terms discussion |
| **CONVERTED_TO_ORDER** | Successfully converted |
| **NO_RESPONSE** | Customer not responding |
| **NOT_INTERESTED** | Customer declined |
| **LOST** | Lost to competitor/other |
| **FUTURE_FOLLOW_UP** | Contact later |

### Managing Enquiries

1. Navigate to **Enquiries**
2. View list with customer details
3. Click to open details
4. Update:
   - Status (use pipeline)
   - Add internal comments
   - Mark as resolved

---

## 14. Testimonials Management

### Reviewing Testimonials

Customers can submit testimonials/reviews. These require approval before display.

### Testimonial Fields

| Field | Description |
|-------|-------------|
| **Author Name** | Customer name |
| **Content** | Review text |
| **Rating** | 1-5 stars |
| **Avatar** | Profile image (optional) |
| **Approved** | Show on website |

### Approval Workflow

1. Navigate to **Testimonials**
2. Review pending testimonials
3. Approve to display on homepage
4. Reject/delete inappropriate content

---

## 15. Customer-Facing Features

### Homepage Features

1. **Hero Section** - Full-screen background with CTA
2. **Featured Categories** - Visual category navigation
3. **Best Sellers** - Auto-populated from products marked as best sellers
4. **Testimonials** - Approved customer reviews
5. **Newsletter Signup** - Email collection with popup

### Product Catalog

- Category filtering
- Search functionality
- Sort by price, name, date
- Product cards with quick view
- Responsive grid layout

### Product Details Page

- Image gallery with zoom
- Product specifications
- Add to cart with quantity
- Related products
- Product manual download (if available)
- Service tenure display

### Shopping Cart

- Slide-out cart drawer
- Quantity adjustment
- Remove items
- Coupon code application
- Stock validation before checkout
- Real-time total calculation

### Checkout Flow

1. **Cart Review** - Verify items and quantities
2. **Customer Information** - Email and contact details
3. **Shipping Address** - With Google address autocomplete
4. **Payment** - Stripe (cards, Apple Pay, Google Pay) or PayPal
5. **Order Confirmation** - Success page with order details

### Guest Checkout

- Customers can checkout without creating an account
- Option to create account after checkout
- Email checking to link to existing accounts

### User Account Features

- Order history
- Profile management
- Address book
- Service request submission

### Support Pages

| Page | URL | Purpose |
|------|-----|---------|
| FAQ | /support/faq | Frequently asked questions |
| Shipping | /support/shipping | Shipping policy and info |
| Returns | /support/returns | Return policy |
| Terms | /support/terms | Terms and conditions |
| Contact | /support/contact | Contact form |
| Service Request | /support/service-request | Submit service ticket |
| Enquiry | /support/enquiry | General enquiry form |

### Location Pages

City-specific landing pages for local SEO:
- /locations/sydney
- /locations/melbourne
- /locations/brisbane
- /locations/perth
- /locations/adelaide
- /locations/gold-coast
- /locations/canberra

---

## 16. Payment Processing

### Stripe Integration

**Supported Payment Methods:**
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Apple Pay (on supported devices)
- Google Pay
- Link (Stripe's one-click checkout)

**Features:**
- PCI DSS compliant
- 3D Secure authentication
- Automatic payment retries
- Real-time webhook notifications

### PayPal Integration

**Features:**
- PayPal account payments
- Pay Later options
- Guest checkout with cards
- Automatic order capture

### Payment Flow

1. Customer selects payment method
2. Payment intent created (Stripe) or order created (PayPal)
3. Stock reserved for 10 minutes
4. Customer completes payment
5. Webhook confirms payment
6. Order status updated
7. Confirmation email sent
8. Stock reservation converted to sale

### Failed Payments

- Customer notified of failure
- Stock reservation released
- Order remains in PENDING with FAILED payment status
- Customer can retry payment

---

## 17. Email Notifications

### Automated Emails

| Trigger | Recipient | Email Type |
|---------|-----------|------------|
| Order placed | Customer | Order confirmation |
| Order placed | Admin | New order notification |
| Order shipped | Customer | Shipping notification with tracking |
| Service request | Customer | Request confirmation |
| Service request | Admin | New service request alert |
| Invoice generated | Customer | Invoice email (manual trigger) |

### Email Provider

Emails are sent via **Resend** for reliable delivery.

### Admin Notifications

Admin receives notifications at the configured `ADMIN_EMAIL` for:
- New orders
- New service requests
- New enquiries

---

## 18. Security Features

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| **User Authentication** | Supabase Auth with secure sessions |
| **Admin Protection** | Role-based access control |
| **Session Management** | Secure HTTP-only cookies |
| **Password Security** | Bcrypt hashing via Supabase |

### API Security

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Prevents abuse of public endpoints |
| **CSRF Protection** | Built into Next.js |
| **Input Validation** | Server-side validation on all inputs |
| **SQL Injection Prevention** | Prisma ORM with parameterized queries |

### Rate Limits Applied

| Endpoint | Limit | Window |
|----------|-------|--------|
| Email check | 5 requests | 15 minutes |
| Newsletter signup | 3 requests | 1 hour |
| Enquiry form | 5 requests | 1 hour |
| Service request | 5 requests | 1 hour |

### HTTP Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer |
| Strict-Transport-Security | max-age=31536000 | Forces HTTPS |
| Permissions-Policy | Restricted | Limits browser features |

### Data Protection

- **File Uploads:** Validated type and size (max 5MB)
- **Image Processing:** Cloudinary with signed uploads
- **Database:** PostgreSQL with RLS (Row Level Security)
- **Environment Variables:** Secured, never exposed to client

### Admin URL Security

The admin panel uses an obscured URL (`/admin05`) instead of `/admin` to:
- Reduce automated attack surface
- Prevent easy discovery by bots
- Add security through obscurity layer

### Robots.txt Protection

The following paths are blocked from search engines:
- /admin05/* (admin panel)
- /api/* (API endpoints)
- /checkout/* (checkout pages)
- /profile/* (user profiles)
- Private/internal pages

---

## 19. SEO & Analytics

### SEO Features

| Feature | Implementation |
|---------|----------------|
| **Dynamic Sitemap** | Auto-generated at /sitemap.xml |
| **Robots.txt** | Configured at /robots.txt |
| **Meta Tags** | Dynamic per-page metadata |
| **Open Graph** | Social sharing optimization |
| **Structured Data** | JSON-LD for products and organization |
| **Canonical URLs** | Prevents duplicate content |
| **Local SEO** | City-specific landing pages |

### Sitemap Contents

The sitemap automatically includes:
- Static pages (home, about, support)
- All active product pages
- All active category pages
- Location pages for Australian cities

### Metadata Management

Each page includes:
- Title tag
- Meta description
- Open Graph tags for social sharing
- Twitter card metadata

---

## 20. Troubleshooting

### Common Issues

#### Orders Not Showing

**Possible Causes:**
- Payment webhook not received
- Database connection issue
- Filters applied hiding orders

**Solutions:**
1. Check Stripe/PayPal dashboard for payment status
2. Verify webhook configuration
3. Clear filters in order list

#### Products Not Displaying

**Possible Causes:**
- Product marked as inactive
- Product has 0 stock (if stock-based filtering enabled)
- Category not active

**Solutions:**
1. Edit product and ensure "Active" is checked
2. Add stock to product
3. Verify category is active

#### Emails Not Sending

**Possible Causes:**
- Resend API key not configured
- Email address invalid
- Rate limit exceeded

**Solutions:**
1. Verify RESEND_API_KEY in environment
2. Check email addresses are valid
3. Check server logs for errors

#### Payment Failures

**Possible Causes:**
- Card declined
- 3D Secure authentication failed
- Stripe/PayPal configuration issue

**Solutions:**
1. Customer should try different card
2. Verify Stripe/PayPal API keys
3. Check webhook endpoints are configured

#### Stock Reservation Expired

**Cause:** Customer took more than 10 minutes to complete payment

**Solution:** Customer needs to restart checkout process. Stock is automatically released.

### Support Contacts

For technical support:
- **Platform Issues:** Contact your development team
- **Payment Issues:** Check Stripe/PayPal dashboards
- **Email Issues:** Check Resend dashboard

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `Esc` | Close modals/dialogs |
| `Enter` | Submit forms |

---

## Appendix B: Status Color Codes

### Order Status Colors

| Status | Color |
|--------|-------|
| PENDING | Yellow |
| PROCESSING | Blue |
| SHIPPED | Purple |
| DELIVERED | Green |
| CANCELLED | Red |

### Payment Status Colors

| Status | Color |
|--------|-------|
| PENDING | Yellow |
| PROCESSING | Blue |
| SUCCEEDED | Green |
| FAILED | Red |
| REFUNDED | Gray |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **SKU** | Stock Keeping Unit - unique product identifier |
| **GST** | Goods and Services Tax (10% in Australia) |
| **PO** | Purchase Order |
| **RO** | Reverse Osmosis (water filtration technology) |
| **Webhook** | Automated HTTP callback for event notifications |
| **ORM** | Object-Relational Mapping (Prisma) |
| **SSR** | Server-Side Rendering |

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 2026 | Initial release |

---

**© 2026 inBlu Australia. All rights reserved.**

*This document is confidential and intended for authorized administrators only.*

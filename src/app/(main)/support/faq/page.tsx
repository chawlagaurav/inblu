import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown, Phone, Mail } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { FAQSchema } from '@/components/seo'

export const metadata: Metadata = {
  title: 'FAQs | Frequently Asked Questions | Inblu Water Filters',
  description: 'Find answers to common questions about water filters, RO systems, installation, delivery, and more. Inblu provides premium water filtration solutions across Australia.',
  keywords: [
    'water filter FAQ',
    'RO system questions',
    'water purifier installation',
    'water filter Australia',
    'reverse osmosis FAQ',
  ],
  alternates: {
    canonical: '/support/faq',
  },
}

const faqs = [
  {
    category: 'Products & Technology',
    questions: [
      {
        question: 'What is Reverse Osmosis (RO) and how does it work?',
        answer: 'Reverse Osmosis is a water purification technology that uses a semi-permeable membrane to remove contaminants from water. Water is pushed through the membrane under pressure, leaving behind impurities like chlorine, fluoride, heavy metals, bacteria, and dissolved solids. Our RO systems remove up to 99.9% of contaminants, providing you with pure, safe drinking water.',
      },
      {
        question: 'What contaminants do your water filters remove?',
        answer: 'Our water filters effectively remove chlorine, fluoride, lead, mercury, arsenic, bacteria, viruses, cysts, microplastics, pesticides, and other harmful contaminants. The specific contaminants removed depend on the filter type - our RO systems provide the most comprehensive filtration, removing up to 99.9% of all contaminants.',
      },
      {
        question: 'What is the difference between RO and regular water filters?',
        answer: 'Regular water filters typically use activated carbon to remove chlorine, odours, and some chemicals. RO systems go further by forcing water through a semi-permeable membrane that removes dissolved solids, heavy metals, fluoride, and microorganisms that regular filters cannot catch. For the purest water, we recommend our RO systems.',
      },
      {
        question: 'Do your filters remove fluoride from water?',
        answer: 'Yes, our Reverse Osmosis systems effectively remove fluoride from water. Standard carbon filters do not remove fluoride, so if fluoride removal is important to you, we recommend our RO purifiers.',
      },
      {
        question: 'How long do the filters last?',
        answer: 'Filter lifespan varies by type and usage. Pre-filters typically last 6-12 months, RO membranes last 2-3 years, and post-filters last 6-12 months. We recommend following the maintenance schedule provided with your system. Our team will remind you when it\'s time for replacement.',
      },
      {
        question: 'Will the filter slow down my water pressure?',
        answer: 'Our countertop and undersink systems are designed to maintain good water flow. RO systems do have a slightly lower flow rate due to the filtration process, but this is normal and ensures thorough purification. Most customers find the flow rate perfectly adequate for drinking water needs.',
      },
    ],
  },
  {
    category: 'Installation & Setup',
    questions: [
      {
        question: 'Do you offer professional installation?',
        answer: 'Yes! We offer FREE professional installation in Sydney. Our certified technicians will install your water filter system and ensure everything is working perfectly. Installation is typically completed within 2-3 weeks of your order. For customers outside Sydney, we provide detailed installation guides and video tutorials, plus phone support to assist with self-installation.',
      },
      {
        question: 'How long does installation take?',
        answer: 'Professional installation in Sydney is typically scheduled within 2-3 weeks of your order, depending on availability. The actual installation process takes about 1-2 hours for most systems. Our technicians will test the system thoroughly before leaving.',
      },
      {
        question: 'What if I\'m not in Sydney? Can I still get a water filter installed?',
        answer: 'Absolutely! While free professional installation is available in Sydney only, we ship Australia-wide and provide comprehensive installation assistance for other cities. Our countertop systems require no installation at all - just plug in and use. For undersink systems, we provide detailed step-by-step guides, video tutorials, and our support team is available via phone to walk you through the process.',
      },
      {
        question: 'Do I need a plumber to install the water filter?',
        answer: 'For Sydney customers, no - our professional installation is included free of charge. For other locations, our countertop filters require no plumbing at all. Undersink systems can be installed DIY with our guides, or you can hire a local plumber. Most customers find our DIY instructions easy to follow.',
      },
      {
        question: 'Can I install an undersink filter in a rental property?',
        answer: 'Our countertop water filters are perfect for renters as they require no permanent installation or modifications. Simply place on your counter and connect to your tap. For undersink systems, you may need landlord approval as they require minor plumbing connections.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        question: 'Do you offer free shipping?',
        answer: 'Yes! We offer FREE shipping on all orders Australia-wide. Your order will be carefully packaged and delivered to your doorstep.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 3-7 business days depending on your location. Metro areas typically receive orders faster. Express shipping options are available at checkout for urgent orders.',
      },
      {
        question: 'Do you ship to regional areas?',
        answer: 'Yes, we ship to all Australian addresses including regional and remote areas. Delivery times may be slightly longer for remote locations, but shipping remains free.',
      },
      {
        question: 'Can I track my order?',
        answer: 'Yes, once your order is dispatched, you\'ll receive a tracking number via email. You can use this to track your delivery in real-time.',
      },
    ],
  },
  {
    category: 'Warranty & Support',
    questions: [
      {
        question: 'What warranty do you offer?',
        answer: 'All Inblu water filter systems come with a comprehensive 2-year warranty covering manufacturing defects and component failures. This warranty is backed by our Australian-based support team.',
      },
      {
        question: 'What if my filter develops a problem?',
        answer: 'Contact our support team immediately. We\'ll troubleshoot the issue and, if necessary, arrange a replacement under warranty. For Sydney customers, we can send a technician. For other locations, we\'ll guide you through the resolution process.',
      },
      {
        question: 'How do I contact customer support?',
        answer: 'You can reach us via phone, email, or through our contact form. Our support team is available Monday to Friday, 9am to 5pm AEST. We aim to respond to all enquiries within 24 hours.',
      },
      {
        question: 'Do you offer servicing for existing filters?',
        answer: 'Yes, we offer filter replacement and servicing. For Sydney customers, we can arrange on-site servicing. For other locations, we supply all necessary replacement parts with detailed instructions.',
      },
    ],
  },
  {
    category: 'Water Quality & Health',
    questions: [
      {
        question: 'Is Australian tap water safe to drink?',
        answer: 'Australian tap water meets safety standards, but it still contains chlorine for disinfection, may contain fluoride, and can pick up contaminants from aging pipes. Many people prefer filtered water for better taste and to remove these additives and potential contaminants.',
      },
      {
        question: 'Why does my tap water taste or smell like chlorine?',
        answer: 'Water utilities add chlorine to disinfect water and kill harmful bacteria. While safe in small amounts, it affects taste and smell. Our carbon and RO filters effectively remove chlorine, giving you fresh, clean-tasting water.',
      },
      {
        question: 'Is filtered water better than bottled water?',
        answer: 'Filtered water is often fresher (filtered on demand), more environmentally friendly (no plastic bottles), and more economical in the long run. Our RO systems provide water quality equal to or better than most bottled water brands.',
      },
      {
        question: 'Are there health benefits to drinking filtered water?',
        answer: 'Filtered water removes potentially harmful contaminants while often retaining beneficial minerals (depending on filter type). Many customers report improved taste leading to increased water consumption, which has numerous health benefits. Removing chlorine and other chemicals can also benefit those with sensitivities.',
      },
    ],
  },
  {
    category: 'Orders & Payments',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and other secure payment methods through our checkout. All transactions are encrypted and secure.',
      },
      {
        question: 'Can I get a quote for my needs?',
        answer: 'Absolutely! Contact us through our Get Quote form or call us directly. We\'ll assess your needs and recommend the best water filtration solution for your home or business.',
      },
      {
        question: 'Do you offer bulk or commercial pricing?',
        answer: 'Yes, we offer special pricing for commercial customers, offices, and bulk orders. Contact our sales team to discuss your requirements and receive a customised quote.',
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a satisfaction guarantee. If you\'re not happy with your purchase, contact us within 30 days. Unused products in original packaging can be returned for a full refund. See our Returns Policy for full details.',
      },
    ],
  },
]

// Flatten FAQs for schema
const allFaqs = faqs.flatMap(category => 
  category.questions.map(q => ({
    question: q.question,
    answer: q.answer,
  }))
)

export default function FAQPage() {
  return (
    <div className="bg-white">
      <FAQSchema faqs={allFaqs} />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Find answers to common questions about our water filters, installation, shipping, and more.
                Can&apos;t find what you&apos;re looking for? Contact our friendly support team.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {faqs.map((category, categoryIndex) => (
            <FadeInOnScroll key={categoryIndex} delay={categoryIndex * 0.1}>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-blue-100">
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <details
                      key={faqIndex}
                      className="group bg-slate-50 rounded-lg overflow-hidden"
                    >
                      <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-slate-100 transition-colors">
                        <h3 className="text-left font-medium text-slate-900 pr-4">
                          {faq.question}
                        </h3>
                        <ChevronDown className="h-5 w-5 text-slate-500 shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5">
                        <p className="text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Still have questions?
              </h2>
              <p className="text-slate-600 mb-8">
                Our friendly team is here to help. Get in touch and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/support/contact"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Contact Us
                </Link>
                <a
                  href="tel:+61400000000"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call Us
                </a>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

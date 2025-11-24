import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
              <Bot size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-slate-900">CharacterForge</span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-600 mb-8">Last updated: January 20, 2025</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                By accessing and using CharacterForge ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                CharacterForge is an AI-powered character and avatar generation platform that provides:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>3D character and avatar generation using artificial intelligence</li>
                <li>REST API access for programmatic character generation</li>
                <li>React and React Native SDK components</li>
                <li>Production-ready character assets with transparent backgrounds</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts and API Keys</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                To use CharacterForge, you must create an account and may generate API keys for programmatic access. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Maintaining the confidentiality of your account credentials and API keys</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring your API keys are kept secure and not shared publicly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Credits and Payment</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                CharacterForge operates on a credit-based system:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Credits are required to generate characters</li>
                <li>Credits are purchased in advance and do not expire</li>
                <li>All sales are final - credits are non-refundable except as required by law</li>
                <li>Pricing may change with notice, but existing credits retain their value</li>
                <li>You are responsible for any applicable taxes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Acceptable Use</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Generate content that is illegal, harmful, or violates any applicable laws</li>
                <li>Generate content that is defamatory, obscene, or offensive</li>
                <li>Generate content that infringes on intellectual property rights</li>
                <li>Attempt to reverse engineer or extract the underlying AI models</li>
                <li>Use the Service in a way that could damage, disable, or impair the Service</li>
                <li>Use automated systems to abuse or overload the Service</li>
                <li>Resell or redistribute generated characters without proper licensing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Intellectual Property</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Generated Content:</strong> You own the rights to characters generated using your account and credits. You may use generated characters for commercial purposes, including in games, apps, marketing materials, and other projects.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Service IP:</strong> The CharacterForge platform, API, SDKs, and all associated technology remain the property of CharacterForge and its licensors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Service Availability</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any losses resulting from service interruptions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, CharacterForge shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Termination</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason we deem necessary. Upon termination, your right to use the Service will immediately cease, but you retain ownership of any characters generated prior to termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Changes to Terms</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Contact Information</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have questions about these Terms, please contact us at{' '}
                <a href="mailto:admin@characterforge.app" className="text-brand-600 hover:text-brand-700 underline">
                  admin@characterforge.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};


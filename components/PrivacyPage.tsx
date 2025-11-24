import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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

          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Last updated: January 20, 2025</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                CharacterForge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our character and avatar generation platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">Account Information</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Email address</li>
                <li>Password (stored securely using industry-standard hashing)</li>
                <li>Account creation date and usage statistics</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">Payment Information</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Payment processing is handled by Stripe, a third-party payment processor. We do not store your full credit card information. We only receive:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Payment confirmation and transaction IDs</li>
                <li>Credit purchase amounts and dates</li>
                <li>Billing information necessary for invoicing (handled by Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">Usage Data</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                We collect information about how you use the Service:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Character generation requests and configurations</li>
                <li>API usage statistics</li>
                <li>Generated character images (stored temporarily for delivery)</li>
                <li>Credit balance and transaction history</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">Technical Data</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Automatically collected technical information:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage patterns and timestamps</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and manage your account</li>
                <li>Generate characters according to your specifications</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Monitor and analyze usage patterns to improve performance</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Storage and Security</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mb-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party services (e.g., Stripe for payments, Supabase for hosting) that help us operate the Service</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Generated Content</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Characters generated using the Service are stored temporarily to deliver them to you. Generated images are:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Stored securely and associated with your account</li>
                <li>Accessible only to you (unless you share them publicly)</li>
                <li>Retained for a reasonable period to ensure service functionality</li>
                <li>Not used to train AI models without your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications (service emails will continue)</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mb-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:admin@characterforge.app" className="text-brand-600 hover:text-brand-700 underline">
                  admin@characterforge.app
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
                <li>Maintain your session and authentication state</li>
                <li>Remember your preferences</li>
                <li>Analyze service usage and performance</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mb-4">
                You can control cookies through your browser settings, but disabling cookies may limit some Service functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Children's Privacy</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                The Service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. International Data Transfers</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using the Service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at{' '}
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


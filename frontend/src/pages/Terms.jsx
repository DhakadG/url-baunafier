import { Link } from 'react-router-dom';
import { C } from '../constants/theme';
import { Logo } from '../components/Logo';
import { Footer } from '../layouts/MainLayout';

const SECTIONS = [
  { title: '1. Acceptance', body: 'By accessing or using URL Baunafier ("the Service") you agree to be bound by these Terms. If you do not agree, do not use the Service.' },
  { title: '2. Eligibility', body: 'You must be at least 13 years old to use the Service. By using it you represent that you meet this requirement.' },
  { title: '3. Acceptable use', body: 'You may use the Service only for lawful purposes. You must not create shortened links that point to: spam, phishing pages, malware, illegal content, content that violates intellectual-property rights, or any material that could expose the operator to legal liability. Automated bulk link creation without prior written permission is prohibited.' },
  { title: '4. Account responsibility', body: 'You are responsible for all activity that occurs under your account. Keep your credentials secure. Notify dhakad.kumawat18@gmail.com immediately if you suspect unauthorised access.' },
  { title: '5. Link availability', body: 'We make reasonable efforts to keep the Service online, but we do not guarantee uptime or link availability. Links may be temporarily or permanently unavailable due to maintenance, abuse intervention, or technical failure. The Service is provided free of charge and on a best-effort basis.' },
  { title: '6. Link expiry & deletion', body: 'Links created with an expiry time will automatically stop redirecting after that time. The operator reserves the right to delete any link at any time, including links that violate these Terms or are otherwise deemed harmful.' },
  { title: '7. Termination', body: 'We reserve the right to suspend or permanently ban any account found to be in violation of these Terms, at our sole discretion and without prior notice.' },
  { title: '8. Disclaimer of warranties', body: 'The Service is provided "as is" without any warranty, express or implied. We disclaim all warranties including fitness for a particular purpose and non-infringement. Use the Service at your own risk.' },
  { title: '9. Limitation of liability', body: 'To the maximum extent permitted by applicable law, the operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.' },
  { title: '10. Governing law', body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Rajasthan, India.' },
  { title: '11. Changes', body: 'We may modify these Terms at any time. The revision date above will be updated. Continued use after a change constitutes acceptance of the new Terms.' },
  { title: '12. Contact', body: 'Questions about these Terms: dhakad.kumawat18@gmail.com' },
];

export function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, textDecoration: 'none' }}>← back</Link>
      </nav>
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px', width: '100%' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 48, color: C.text, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, marginBottom: 48 }}>
          Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {SECTIONS.map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: C.mono, fontSize: 14, color: C.accent, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
            <p style={{ fontFamily: C.space, fontSize: 15, color: C.text, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}

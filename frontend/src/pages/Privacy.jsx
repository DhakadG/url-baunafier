import { Link } from 'react-router-dom';
import { C } from '../constants/theme';
import { Logo } from '../components/Logo';
import { Footer } from '../layouts/MainLayout';

const SECTIONS = [
  { title: '1. Who we are', body: 'URL Baunafier is a personal URL-shortening service operated by Dhakad Kumawat (dhakad.kumawat18@gmail.com) and accessible at baunafier.qzz.io. By using the service you agree to this policy.' },
  { title: '2. Information we collect', body: 'Account data: your email address and a salted PBKDF2 hash of your password (we never see your plaintext password). Link data: the original URL you submit and the alias/code we assign. Analytics: for every click on a shortened link we store the country, device type, browser family, operating system, and HTTP referrer. No cookies or fingerprints are used for tracking visitors; analytics are associated with links, not visitors.' },
  { title: '3. Google Sign-In', body: "If you choose to sign in with Google, we receive your Google account email address and an opaque identifier from Google. We do not receive your Google password, contacts, or any other Google data. The credential is verified against Google's token endpoint and then treated identically to an email/password account." },
  { title: '4. How we use your data', body: 'We use your email solely to identify your account and for service communications (e.g. password reset, if implemented). Analytics data is used only to power the per-link analytics dashboard visible to you and administrators. We do not sell, share, or transfer your data to any third party except as required by law.' },
  { title: '5. Data storage & security', body: 'All data is stored in Cloudflare KV (a globally-distributed key-value store operated by Cloudflare, Inc.). Passwords are hashed with PBKDF2-SHA-256 and a random salt before storage. API endpoints are protected by JWT bearer tokens. HTTPS is enforced on all connections.' },
  { title: '6. Data retention', body: 'Your data is retained for as long as your account exists. You may request deletion at any time by emailing dhakad.kumawat18@gmail.com — we will permanently delete your account, all links you created, and all associated analytics within 30 days.' },
  { title: '7. Cookies', body: "We do not use cookies. Authentication state is stored in your browser's localStorage as a JWT token." },
  { title: '8. Children', body: 'The service is not directed at children under 13. We do not knowingly collect data from children.' },
  { title: '9. Changes to this policy', body: 'We may update this policy. The revision date at the top of this page will always reflect the most recent version. Continued use of the service after a change constitutes acceptance.' },
  { title: '10. Contact', body: 'Questions or requests regarding your data: dhakad.kumawat18@gmail.com' },
];

export function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link to="/" style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, textDecoration: 'none' }}>← back</Link>
      </nav>
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px', width: '100%' }}>
        <h1 style={{ fontFamily: C.display, fontStyle: 'italic', fontSize: 48, color: C.text, marginBottom: 8 }}>Privacy Policy</h1>
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

import { ShieldCheck, Sparkles } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { BrandLogo } from '@/components/BrandLogo';

export default function Login() {
  return (
    <main className="login-screen">
      {/* Luxury Black Branding Panel */}
      <section className="login-brand" aria-label="Brand Introduction">
        <div className="login-logo-container">
          <BrandLogo size="lg" showText={true} tagline={true} priority={true} />
        </div>

        <div className="login-slogan">
          <span>CURATING LUXURY &bull; EST. 1960s</span>
          <h1>
            Bespoke elegance.<br />
            <em>Unforgettable taste.</em>
          </h1>
          <p>
            The dedicated management platform for ZAUQÉ BY BANA. Seamlessly coordinate
            bespoke catering, luxury decor, guest experiences, quotations, and financial operations.
          </p>
        </div>

        <div className="login-trust">
          <ShieldCheck size={18} />
          <span>Private business management platform &bull; Authorized personnel only</span>
        </div>
      </section>

      {/* Warm Ivory Form Panel */}
      <section className="login-panel" aria-label="Sign In Form">
        <div className="login-form">
          <span className="eyebrow">
            <Sparkles size={12} className="inline mr-1 text-[#C9A46A]" />
            WORKSPACE ACCESS
          </span>
          <h2>Sign in to your account</h2>
          <p>Enter your authorized ZAUQÉ BY BANA credentials to continue.</p>

          <LoginForm />

          <p className="hint">
            Accounts are provisioned by the business owner. Contact executive administration to request access.
          </p>
        </div>
      </section>
    </main>
  );
}

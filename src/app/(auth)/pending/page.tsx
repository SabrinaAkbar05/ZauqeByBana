import { signOut } from '@/app/actions';
import { Clock3 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Pending() {
  return (
    <main className="center-screen">
      <div className="pending-card">
        <div className="flex justify-center mb-4">
          <BrandLogo size="lg" showText={true} tagline={true} />
        </div>
        <div className="flex justify-center my-4">
          <Clock3 size={36} className="text-[#C9A46A]" />
        </div>
        <h1>Account pending authorization</h1>
        <p>
          Your ZAUQÉ BY BANA account is pending owner verification or has been temporarily
          deactivated. Please contact executive administration for access clearance.
        </p>
        <form action={signOut} className="mt-6">
          <button className="btn btn-primary btn-wide" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

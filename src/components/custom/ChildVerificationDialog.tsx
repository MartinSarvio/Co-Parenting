import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';

interface ChildToVerify {
  id: string;
  name: string;
}

interface Props {
  children: ChildToVerify[];
  householdId: string;
  userId: string;
  onVerified: () => void;
}

export function ChildVerificationDialog({ children, householdId, userId, onVerified }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const child = children[currentIndex];
  const MAX_ATTEMPTS = 3;

  const handleVerify = async () => {
    if (!birthDate || verifying) return;
    setVerifying(true);
    setError('');

    try {
      // Fetch actual birth date from server
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('birth_date')
        .eq('id', child.id)
        .single();

      if (fetchError || !data) {
        setError('Kunne ikke hente barnets data. Prøv igen.');
        setVerifying(false);
        return;
      }

      const newAttempts = attempts + 1;

      // Update attempts in DB
      await supabase
        .from('household_members')
        .update({ child_verification_attempts: newAttempts })
        .eq('household_id', householdId)
        .eq('user_id', userId);

      // Normaliser begge datoer til YYYY-MM-DD for sammenligning
      const storedDate = (data.birth_date || '').slice(0, 10);
      const inputDate = birthDate.slice(0, 10);
      if (storedDate === inputDate) {
        // Match! Mark as verified
        await supabase
          .from('household_members')
          .update({ child_verified: true })
          .eq('household_id', householdId)
          .eq('user_id', userId);

        // Move to next child or finish
        if (currentIndex < children.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setBirthDate('');
          setAttempts(0);
        } else {
          onVerified();
        }
      } else {
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLocked(true);
          setError('Du har brugt alle forsøg. Kontakt den anden forælder.');
        } else {
          setError(`Fødselsdatoen matcher ikke. ${MAX_ATTEMPTS - newAttempts} forsøg tilbage.`);
        }
        setBirthDate('');
      }
    } catch {
      setError('Der opstod en fejl. Prøv igen.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <svg className="h-7 w-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Bekræft barn</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Indtast fødselsdatoen for <span className="font-medium text-foreground">{child.name}</span> for at bekræfte adgang.
          </p>
          {children.length > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Barn {currentIndex + 1} af {children.length}
            </p>
          )}
        </div>

        {locked ? (
          <div className="rounded-xl bg-destructive/10 p-4 text-center">
            <p className="text-sm font-medium text-destructive">Adgang låst</p>
            <p className="mt-1 text-xs text-destructive/80">
              Kontakt den anden forælder for at få en ny invitation.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Fødselsdato
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={verifying}
              />
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <button
              onClick={handleVerify}
              disabled={!birthDate || verifying}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {verifying ? 'Bekræfter...' : 'Bekræft'}
            </button>
          </>
        )}

        <button
          onClick={() => {
            supabase.auth.signOut();
            useAppStore.getState().logout();
          }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Log ud
        </button>
      </div>
    </div>
  );
}

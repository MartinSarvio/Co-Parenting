import { useState } from 'react';
import { useAppStore } from '@/store';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui/button';
import { Share2, FileText, Link2, Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { exportCustodyPlanPDF } from '@/lib/export';
import { supabase } from '@/lib/supabase';
import type { CustodyPlan, Child } from '@/types';

interface SharedLink {
  id: string;
  token: string;
  expires_at: string;
  view_count: number;
  is_active: boolean;
}

interface ShareCustodyPlanProps {
  plan: CustodyPlan;
  child: Child;
}

export function ShareCustodyPlan({ plan, child }: ShareCustodyPlanProps) {
  const { users } = useAppStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const loadLinks = async () => {
    setLoadingLinks(true);
    const { data } = await supabase
      .from('shared_custody_links')
      .select('id, token, expires_at, view_count, is_active')
      .eq('household_id', useAppStore.getState().household?.id ?? '')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setLinks(data ?? []);
    setLoadingLinks(false);
  };

  const handleOpen = () => {
    setOpen(true);
    loadLinks();
  };

  const handlePDF = () => {
    exportCustodyPlanPDF(plan, child, users);
    setOpen(false);
  };

  const handleCreateLink = async () => {
    setCreating(true);
    const householdId = useAppStore.getState().household?.id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!householdId || !user) {
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('shared_custody_links')
      .insert({
        household_id: householdId,
        created_by: user.id,
      })
      .select('id, token, expires_at, view_count, is_active')
      .single();

    if (data && !error) {
      setLinks((prev) => [data, ...prev]);
    }
    setCreating(false);
  };

  const handleDeactivateLink = async (id: string) => {
    await supabase
      .from('shared_custody_links')
      .update({ is_active: false })
      .eq('id', id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const copyLink = (token: string) => {
    const url = `https://huska.dk/del/samvaer/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 text-muted-foreground"
      >
        <Share2 className="h-4 w-4" />
        Del
      </Button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Del samværsplan" compact>
        <div className="space-y-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Del samværsplanen for {child.name} med familie eller andre.
          </p>

          {/* PDF option */}
          <button
            onClick={handlePDF}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Download PDF</div>
              <div className="text-xs text-muted-foreground">Åbner udskriftsdialog — gem som PDF</div>
            </div>
          </button>

          {/* Create link option */}
          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-card disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Link2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Opret delingslink</div>
              <div className="text-xs text-muted-foreground">Gyldigt i 30 dage — kan deaktiveres</div>
            </div>
          </button>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aktive links
              </h3>
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-mono text-muted-foreground">
                      huska.dk/del/samvaer/{link.token.slice(0, 8)}...
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Udløber {new Date(link.expires_at).toLocaleDateString('da-DK')} · {link.view_count} visninger
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(link.token)}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeactivateLink(link.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {loadingLinks && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

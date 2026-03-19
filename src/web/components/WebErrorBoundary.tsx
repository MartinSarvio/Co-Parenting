import { Component, type ReactNode } from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[WebErrorBoundary:${this.props.sectionName ?? 'ukendt'}]`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isOffline = !navigator.onLine;
    const Icon = isOffline ? WifiOff : AlertTriangle;
    const title = isOffline ? 'Ingen internetforbindelse' : 'Noget gik galt';
    const subtitle = isOffline
      ? 'Tjek din forbindelse og prøv igen.'
      : `Kunne ikke indlæse ${this.props.sectionName ?? 'denne sektion'}.`;

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a]/5 flex items-center justify-center mb-5">
          <Icon size={28} className="text-[#78766d]" />
        </div>
        <h2 className="text-lg font-bold text-[#2f2f2f]">{title}</h2>
        <p className="text-sm text-[#78766d] mt-1.5 max-w-sm">{subtitle}</p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2f2f2f] transition-colors"
        >
          <RefreshCw size={15} />
          Prøv igen
        </button>
      </div>
    );
  }
}

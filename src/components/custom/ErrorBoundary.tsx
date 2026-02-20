import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary:${this.props.sectionName ?? 'ukendt'}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Noget gik galt
            {this.props.sectionName ? ` i ${this.props.sectionName}` : ''}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {this.state.error?.message ?? 'Ukendt fejl'}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Prøv igen
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

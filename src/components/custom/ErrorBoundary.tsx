import { Component, type ReactNode } from 'react';
import { AppStateScreen } from './AppStateScreen';

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
        <AppStateScreen
          state={navigator.onLine ? 'error' : 'offline'}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

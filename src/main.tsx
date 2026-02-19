import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'jotai';
import './index.css';
import App from './App.tsx';
import { RoadmapPage } from './components/RoadmapPage.tsx';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
          <h2>خطایی رخ داد</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>لطفا صفحه را رفرش کنید.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '0.5rem', border: '1px solid #ccc' }}
          >
            رفرش صفحه
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SAFETY & RESCUE TOUR 360° uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndRecover = () => {
    try {
      localStorage.removeItem('srt_active_sos');
      localStorage.removeItem('srt_sos_queue');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-red-950/50 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-red-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-wider text-white">
                Safety System Guard
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                The interface encountered an unexpected interruption. Your location tracking and emergency contacts remain secure.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-slate-800 text-left">
                <p className="text-[10px] font-mono text-red-400 truncate">
                  {this.state.error.message || 'Component render exception'}
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resume Safety Dashboard</span>
              </button>

              <button
                onClick={this.handleClearAndRecover}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Reset View &amp; Continue</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

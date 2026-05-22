import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-8 max-w-lg w-full">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-lg font-bold text-gray-800 mb-2">Algo deu errado</h1>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error.message}
            </p>
            <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-auto text-red-600">
              {this.state.error.stack}
            </pre>
            <button
              className="mt-4 btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

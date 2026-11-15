import React from "react";

// Keeps the rest of the app running if one page crashes
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Space App Med page error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="alert red">
        <b>This page hit a problem.</b> Your data is safe.
        <pre className="small">{String(this.state.error?.message || this.state.error)}</pre>
        <button className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}

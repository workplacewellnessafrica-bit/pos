import React from 'react';
import ReactDOM from 'react-dom/client';

export function App() {
  return (
    <div style={{ padding: 40 }}>
      <h1>DukaPOS Desktop</h1>
      <p style={{ color: '#94a3b8' }}>Electron POS Shell initialized.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

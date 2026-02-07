
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Failed to find the root element. Ensure your index.html has a <div id='root'></div>.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React rendering error:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Application Error</h1>
      <p>The application failed to start. Please check the console for more details.</p>
    </div>`;
  }
}

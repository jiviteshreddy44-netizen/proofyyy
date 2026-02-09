
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './proofy-web-master-main/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

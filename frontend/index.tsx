import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll<HTMLElement>('.cdb-quizz-container');

  const renderApp = (element: HTMLElement, slug: string) => {
    const root = ReactDOM.createRoot(element);
    root.render(
      <React.StrictMode>
        <App slug={slug} />
      </React.StrictMode>
    );
  };

  if (containers.length > 0) {
    containers.forEach(container => {
      const slug = container.dataset.slug || 'demo';
      renderApp(container, slug);
    });
    return;
  }

  const rootElement = document.getElementById('root');
  if (rootElement) {
    renderApp(rootElement, 'demo');
  }
});

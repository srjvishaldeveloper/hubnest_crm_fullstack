export async function register() {
  // Suppress Recharts "width(-1) and height(-1)" warnings during Next.js SSR/build.
  // These fire because Recharts calls getBoundingClientRect() in a Node environment
  // where there is no real DOM. They are harmless — charts render correctly in browser.
  if (typeof window === 'undefined') {
    const originalError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (msg.includes('width(-1) and height(-1)') || msg.includes('of chart should be greater than 0')) {
        return;
      }
      originalError(...args);
    };
  }
}

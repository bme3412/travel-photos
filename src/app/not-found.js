// src/app/not-found.js
export const viewport = {
    width: 'device-width',
    initialScale: 1,
  };
  
  export default function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl">Page not found</p>
      </div>
    );
  }
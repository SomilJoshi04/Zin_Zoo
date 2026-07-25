import React, { useEffect } from 'react'
import AppRoutes from './routes'

// Zin Zoo client-side entry point application container
function App() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let portraitHeight = window.innerHeight;
    const handleResize = () => {
      const screenHeight = window.screen.height || window.innerHeight;
      const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const baselineHeight = Math.max(portraitHeight, screenHeight * 0.8);
      const shrinkAmount = baselineHeight - currentHeight;

      if (shrinkAmount > 150) {
        document.body.classList.add('keyboard-open');
      } else if (shrinkAmount < 100) {
        document.body.classList.remove('keyboard-open');
      }
    };

    const handleFocusIn = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const type = e.target?.type;
      const isTextInput = tag === "textarea" || (tag === "input" && ["text", "password", "email", "number", "search", "tel", "url"].includes(type || "text"));
      
      if (isTextInput) {
        document.body.classList.add('keyboard-open');
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        document.body.classList.remove('keyboard-open');
      }, 200);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return <AppRoutes />
}

export default App

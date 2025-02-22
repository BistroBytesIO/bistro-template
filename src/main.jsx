import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./App.jsx";
import { CartProvider } from "./CartContext.jsx";
import { MiniCartProvider } from "./context/MiniCartContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MiniCartProvider>
      <ThemeProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </ThemeProvider>
    </MiniCartProvider>
  </StrictMode>
);

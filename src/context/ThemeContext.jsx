import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("red-black");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const htmlElement = document.documentElement;

    htmlElement.classList.remove(
      "dark",
      "theme-blue",
      "theme-orange",
      "theme-red-black"
    );

    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else if (theme === "blue") {
      htmlElement.classList.add("theme-blue");
    } else if (theme === "orange") {
      htmlElement.classList.add("theme-orange");
    } else if (theme === "red-black") {
      htmlElement.classList.add("theme-red-black");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("interview-app-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const handleToggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
    localStorage.setItem("interview-app-theme", newDarkMode ? "dark" : "light");
  };

  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-secondary transition-all duration-200"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleTheme}
      className="fixed top-4 right-4 z-50 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-secondary hover:scale-105 transition-all duration-200"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-foreground transition-transform duration-200" />
      ) : (
        <Moon className="h-5 w-5 text-foreground transition-transform duration-200" />
      )}
    </Button>
  );
}

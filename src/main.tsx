import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Ensure theme: light mode is default UNLESS user chose dark before.
const theme = localStorage.getItem("chatTheme");
if (theme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  // Always remove .dark class unless stored value is "dark"
  document.documentElement.classList.remove("dark");
  // Optionally, explicitly set chatTheme to "light" in localStorage
  // localStorage.setItem("chatTheme", "light"); // Uncomment if you want
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
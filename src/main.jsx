import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // หรือใช้ HashRouter ก็ได้
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>   {/* สำคัญมาก: ต้องมีตัวนี้ครอบทั้งหมด */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

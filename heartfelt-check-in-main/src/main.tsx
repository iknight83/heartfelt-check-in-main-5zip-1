import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    rootElement.innerHTML = '<div style="color:white;background:red;padding:20px;font-size:18px">JS ERROR: ' + String(error) + '</div>';
  }
} else {
  document.body.innerHTML = '<div style="color:white;background:red;padding:20px">ROOT NOT FOUND</div>';
}

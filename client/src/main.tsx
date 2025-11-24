import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import './index.scss'
import Auth from "./auth/Auth";
import LoginForm from "./auth/LoginForm";
import SignupForm from "./auth/SignupForm";
import GenerateOutfitPage from "./pages/generate-outfit/GenerateOutfitPage";
import CollectionsPage from "./pages/collections/CollectionsPage";
import MyWardrobePage from "./pages/my-wardrobe/MyWardrobePage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>

      {/* Shared layout */}
      <Route path="/" element={<Auth />}>
        <Route path="login" element={<LoginForm />} />
        <Route path="signup" element={<SignupForm />} />
      </Route>
      <Route path="generate" element={<GenerateOutfitPage />} />
      <Route path="wardrobe" element={<MyWardrobePage />} />
      <Route path="collections" element={<CollectionsPage />} />

      {/* Redirect / -> /login */}
      <Route path="*" element={<Auth />}>
        <Route index element={<LoginForm />} />
      </Route>

    </Routes>
  </BrowserRouter>
);

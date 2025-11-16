import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import './index.css'
import Auth from "./auth/Auth";
import LoginForm from "./auth/LoginForm";
import SignupForm from "./auth/SignupForm";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      
      {/* Shared layout */}
      <Route path="/" element={<Auth />}>
        <Route path="login" element={<LoginForm />} />
        <Route path="signup" element={<SignupForm />} />
      </Route>

      {/* Redirect / -> /login */}
      <Route path="*" element={<Auth />}>
        <Route index element={<LoginForm />} />
      </Route>

    </Routes>
  </BrowserRouter>
);

import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import './index.scss'
import Auth from "./auth/Auth";
import LoginForm from "./auth/LoginForm";
import GenerateOutfitPage from "./pages/generate-outfit/GenerateOutfitPage";
import CollectionsPage from "./pages/collections/CollectionsPage";
import MyWardrobePage from "./pages/my-wardrobe/MyWardrobePage";
import CalendarPage from "./pages/calendar/CalendarPage";
import OutfitInspoPage from "./pages/outfit-inspo/OutfitInspoPage";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./auth/RequireAuth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <BrowserRouter>
        <Routes>

          {/* Shared layout */}
          <Route path="/" element={<Auth />}>
            <Route path="login" element={<LoginForm />} />
          
          </Route>
          <Route
            path="generate"
            element={
              <RequireAuth>
                <GenerateOutfitPage />
              </RequireAuth>
            }
          />
          <Route
            path="wardrobe"
            element={
              <RequireAuth>
                <MyWardrobePage />
              </RequireAuth>
            }
          />
          <Route
            path="inspo"
            element={
              <RequireAuth>
                <OutfitInspoPage />
              </RequireAuth>
            }
          />
          <Route
            path="collections"
            element={
              <RequireAuth>
                <CollectionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="calendar"
            element={
              <RequireAuth>
                <CalendarPage />
              </RequireAuth>
            }
          />

          {/* Redirect / -> /login */}
          <Route path="*" element={<Auth />}>
            <Route index element={<LoginForm />} />
          </Route>

        </Routes>
      </BrowserRouter>
  </AuthProvider>
  
);

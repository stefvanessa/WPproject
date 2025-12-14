import LoginOAuth2 from "./LoginOAuth2";
import "./LoginPage.css";

function LoginPage() {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="app-title">SnapFit</h1>
        <p className="subtitle">Outfits in a snap.</p>

        <LoginOAuth2 />
      </div>
    </div>
  );
}

export default LoginPage;

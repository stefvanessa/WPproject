import GoogleIcon from "../assets/icons8-google.svg"; // your imported icon
import { API_BASE_URL } from "../api/client";

function LoginOAuth2() {

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <button className="google-btn" onClick={handleLogin}>
      <img src={GoogleIcon} alt="Google" className="google-icon" />
      <span>Sign in with Google</span>
    </button>
  );
}

export default LoginOAuth2;

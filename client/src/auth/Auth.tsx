import { Outlet } from "react-router-dom";
import bg from "../assets/login-background.png";
import "./Auth.css";

function Auth() {
  return (
    <div className="auth-container">

      {/* LEFT IMAGE */}
      <div className="left-side">
        <div
          className="image"
          style={{ backgroundImage: `url(${bg})` }}
        ></div>
      </div>

      {/* RIGHT SIDE → dynamic content (Login or Signup) */}
      <div className="right-side">
        <Outlet />
      </div>

    </div>
  );
}

export default Auth;

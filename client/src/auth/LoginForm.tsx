import { Link } from "react-router-dom";

function LoginForm() {
  return (
    <>
      <div className="branding">
        <h1>SnapFit</h1>
        <p>Outfits in a snap.</p>
      </div>

      <div className="form-box">
        <label>Email</label>
        <input type="email" placeholder="Value" />

        <label>Password</label>
        <input type="password" placeholder="Value" />

        <button>Sign In</button>

        <Link to="/signup" className="forgot">
          Create account
        </Link>
      </div>
    </>
  );
}

export default LoginForm;

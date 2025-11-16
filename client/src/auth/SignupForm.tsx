import { Link } from "react-router-dom";

function SignupForm() {
  return (
    <>
      <div className="branding">
        <h1>Create Account</h1>
        <p>Start your SnapFit journey.</p>
      </div>

      <div className="form-box">

        <label>Name</label>
        <input type="text" placeholder="Your name" />

        <label>Email</label>
        <input type="email" placeholder="Your email" />

        <label>Password</label>
        <input type="password" placeholder="Choose a password" />

        <button>Sign Up</button>

        <Link to="/login" className="forgot">
          Already have an account?
        </Link>
      </div>
    </>
  );
}

export default SignupForm;

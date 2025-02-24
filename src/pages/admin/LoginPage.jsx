import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../AuthContext";
import { Button } from "@/components/ui/button";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function LoginPage() {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    console.error(
      "AuthContext is undefined. Ensure AuthProvider is wrapping the component tree."
    );
    return null;
  }

  const { login, user } = authContext;

  useEffect(() => {
    if (user) {
      navigate("/admin/dashboard"); // Redirect if already logged in
    }
  }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-container bg-card flex flex-col just">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-center items-center">
          <Button
            className="bg-primary hover:bg-primary-foreground hover:text-primary"
            type="submit"
          >
            Login
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;

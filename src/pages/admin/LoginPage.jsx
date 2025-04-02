import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Login Header */}
          <div className="bg-primary text-white p-6 text-center">
            <h2 className="text-2xl font-bold">Restaurant Admin</h2>
            <p className="mt-1 opacity-80">Sign in to manage your restaurant</p>
          </div>
          
          {/* Login Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white py-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-center text-sm text-gray-600">
              This is a secure area for restaurant management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

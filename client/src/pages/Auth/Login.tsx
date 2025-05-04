
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Basic Login component 
const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: {email: string, password: string}) => {
    setIsLoading(true);
    try {
      // Placeholder for API call
      console.log("Login attempt with:", data);
      
      // Mock successful login
      setTimeout(() => {
        toast.success("Login successful!");
        localStorage.setItem("token", "mock-token");
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(`Login failed: ${error.message || "Please try again"}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              {...form.register("email")}
              className="w-full px-3 py-2 border rounded-md" 
              placeholder="name@bt.com"
              type="email"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              {...form.register("password")} 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="••••••••" 
              type="password"
            />
          </div>
          
          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:text-blue-800"
          >
            Don't have an account? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { baseUrl } from "../../config/routes";
import SplashScreen from "../Layout/SplashScreen"; // Import SplashScreen here

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  maxUsersPerCourse: number;
  sessionTimeout: number;
}

interface ApiResponse {
  success: boolean;
  settings: SystemSettings;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = "/login",
}) => {
  const { state, logout } = useAuth();
  const location = useLocation();
  const { isAuthenticated, user } = state;
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const checkAuthAndSettings = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await axios.get<ApiResponse>(
          `${baseUrl}/api/v1/admin/system-settings`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMaintenanceMode(res.data.settings?.maintenanceMode || false);
      } catch (error) {
        console.error("Error fetching system settings:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndSettings();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Not logged in → redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Show SplashScreen while loading
  if (loading) {
    return <SplashScreen fullPage={true} title="Loading..." subtitle="Please wait while we set things up." />;
  }

  // Admin access redirect
  if (
    !requireAdmin &&
    user?.role === "admin" &&
    location.pathname !== "/admin"
  ) {
    return <Navigate to="/admin" replace />;
  }

  // Non-admin accessing admin route → redirect to dashboard
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Maintenance mode for non-admin users
  if (maintenanceMode && requireAuth && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 text-center text-white bg-gray-900">
        <img
          src="https://thumbs.dreamstime.com/b/thin-line-style-under-maintenance-message-banner-100071034.jpg"
          alt="under-maintenance"
          className="h-auto rounded-lg shadow-lg w-80"
        />

        <p className="text-gray-400">We’ll be back soon. Please check later.</p>

        <div className="text-3xl font-bold text-yellow-400">
          ⏳ {formatTime(timeLeft)}
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-2 font-semibold text-black transition bg-red-400 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

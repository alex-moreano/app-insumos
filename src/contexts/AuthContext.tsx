import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthState, User } from "@/types/auth";
import { toast } from "sonner";
import apiService from "@/services/ApiService";
import { API_ENDPOINTS } from "@/config/api";

// Fallback demo users for when API is not available
const DEMO_USERS = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    fullName: "Administrador",
    role: "admin" as const,
  },
  {
    id: "2",
    username: "operador",
    email: "operador@example.com",
    password: "operador123",
    fullName: "Operador",
    role: "operator" as const,
  },
];

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const [useBackendApi, setUseBackendApi] = useState<boolean>(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          // Set the token for API service
          if (user.token) {
            apiService.setToken(user.token);
          }
          
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
          setState({ ...initialState, isLoading: false });
        }
      } else {
        setState({ ...initialState, isLoading: false });
      }
    };

    // Check if backend API is available
    const checkBackendApi = async () => {
      try {
        await fetch(API_ENDPOINTS.login, { method: 'OPTIONS' });
        setUseBackendApi(true);
      } catch (error) {
        console.warn("Backend API not available, using demo mode", error);
        setUseBackendApi(false);
      }
    };

    checkBackendApi();
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (useBackendApi) {
      try {
        // Real API authentication
        const userData = await apiService.post<User>(
          API_ENDPOINTS.login,
          { email, password },
          false // Don't use auth for login
        );
        
        // Map backend user structure to frontend user structure
        const user: User = {
          id: userData._id,
          email: userData.email,
          fullName: userData.name,
          role: userData.role === 'admin' ? 'admin' : 'operator',
          token: userData.token,
        };
        
        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));
        
        // Set token for API service
        apiService.setToken(user.token);
        
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success(`Bienvenido, ${user.fullName}`);
        return true;
      } catch (error) {
        console.error("Login failed:", error);
        return false;
      }
    } else {
      // Demo authentication
      const user = DEMO_USERS.find(
        (u) => (u.username === email || u.email === email) && u.password === password
      );

      if (user) {
        // Remove password from user object before storing
        const { password: _, ...safeUser } = user;
        localStorage.setItem("user", JSON.stringify(safeUser));
        
        setState({
          user: safeUser,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success(`Bienvenido, ${safeUser.fullName} (Modo Demo)`);
        return true;
      }

      toast.error("Credenciales inválidas");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    apiService.setToken(null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.info("Sesión cerrada");
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    if (useBackendApi) {
      try {
        // In a real application, this would call the API endpoint
        // await apiService.post('/api/users/reset-password', { email }, false);
        toast.success("Enlace de recuperación enviado a tu correo");
        return true;
      } catch (error) {
        console.error("Password reset failed:", error);
        return false;
      }
    } else {
      // Demo password reset
      const user = DEMO_USERS.find(u => u.email === email);
      
      if (user) {
        toast.success("Enlace de recuperación enviado a tu correo (Modo Demo)");
        return true;
      }
      
      toast.error("Email no encontrado");
      return false;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!state.user) {
      toast.error("No hay usuario autenticado");
      return false;
    }

    if (useBackendApi) {
      try {
        const updatedUserData = await apiService.put(
          API_ENDPOINTS.profile,
          userData
        );
        
        // Update local user data
        const updatedUser: User = {
          ...state.user,
          fullName: updatedUserData.name,
          email: updatedUserData.email,
          token: updatedUserData.token || state.user.token,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        if (updatedUser.token) {
          apiService.setToken(updatedUser.token);
        }
        
        setState({
          ...state,
          user: updatedUser,
        });
        
        toast.success("Perfil actualizado correctamente");
        return true;
      } catch (error) {
        console.error("Profile update failed:", error);
        return false;
      }
    } else {
      // Demo profile update
      if (state.user) {
        const updatedUser = { 
          ...state.user,
          ...userData,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setState({
          ...state,
          user: updatedUser,
        });
        
        toast.success("Perfil actualizado correctamente (Modo Demo)");
        return true;
      }
      
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      logout, 
      sendPasswordReset,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('shopezUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('shopezUser');
    return null;
  }
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: readStoredUser(),
    loading: false,
  });

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('shopezUser', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('shopezUser');
    }
  }, [state.user]);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await API.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      dispatch({ type: 'LOGIN', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await API.post('/auth/register', {
        name,
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      dispatch({ type: 'LOGIN', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const updateUser = (userData) => dispatch({ type: 'UPDATE_USER', payload: userData });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

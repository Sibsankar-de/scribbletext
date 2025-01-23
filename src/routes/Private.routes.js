import React, { useContext } from 'react'
import AuthContext from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom';

export const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);

    if (isAuthenticated) return children;
    return <Navigate to={"/auth/login"} />
}

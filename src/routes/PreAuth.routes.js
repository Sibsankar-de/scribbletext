import React, { useContext } from 'react'
import AuthContext from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const PreAuthRoute = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) return children;
    return <Navigate to={"/home"} />
}

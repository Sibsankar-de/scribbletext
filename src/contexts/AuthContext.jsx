import React, { useEffect, useState } from 'react'
import { createContext } from 'react'
import axios from '../server/axios-setup';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  // check authentication
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        await axios.get("/users/check-auth")
          .then(res => setIsAuthenticated(res?.data?.data?.isAuthenticated))
      } catch (error) {
        console.error(error);
        setIsAuthenticated(false);
        setLoading(false);
      }
      setLoading(false);
    }
    checkAuth();
  }, [])
  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {
        isAuthenticated === null ? <LoadingPage openState={true} />
          : children
      }
    </AuthContext.Provider>
  )
}

const LoadingPage = ({ openState }) => {
  const [open, setOpen] = useState(false)
  const [closeAnim, setCloseAnim] = useState(false)

  useEffect(() => {
    if (!openState) {
      setTimeout(() => {
        setCloseAnim(true)
      }, 2000)
      setTimeout(() => {
        setOpen(false)
        setCloseAnim(false)
      }, 2100)
    } else {
      setOpen(true)
    }
  }, [openState])
  return (
    open && <div className={`st-f-page-loading-box ${closeAnim && 'st-fadeout-anim'}`}>
      <div className='st-fadein-anim'><img src={require('../assets/img/logo.png')} alt="" width={100} draggable={false} /></div>
    </div>
  )
}

export default AuthContext;
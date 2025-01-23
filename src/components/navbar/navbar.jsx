import React, { useEffect, useState } from 'react'
import "./navbar.style.css"
import axios from '../../server/axios-setup'
import { NavLink } from 'react-router-dom'
import { Spinner } from '../../utils/loader-spinner'
import { PopupWraper } from '../popup-box/popup-box'
import { socket } from '../../server/socket.io'

export const HeaderNav = () => {
    const [online, setOnline] = useState(false)
    useEffect(() => {
        setOnline(navigator.onLine)
    })
    return (
        <nav className='st-header-nav'>
            <div><img src={require('../../assets/img/logo.png')} alt="" width={30} draggable={false} /></div>
            <div className='fw-bold mx-2'>ScribbleText</div>
            {!online && <div className='mx-4'>
                <span><i className="ri-wifi-off-line mx-2"></i></span>
                <span>You are Offline</span>
                <button className='st-head-nav-refresh-btn mx-2' onClick={() => window.location.reload()}>Refresh</button>
            </div>}
        </nav>
    )
}



export const SideNav = () => {

    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                await axios.get(`/users/current-user`)
                    .then((res) => {
                        setUserData(res?.data?.data)
                        setLoading(false)
                    })
            } catch (error) {
                // console.error(error);
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        try {
            socket.on('userChange', (data) => {
                if (userData?._id === data?._id) {
                    setUserData(data)
                }
            })

        } catch (error) {
            // console.log(error);
        }
    })

    return (
        <nav className='st-side-nav'>
            <section className='st-s-nav-sec st-ns-1'>
                <div>
                    <ul>
                        <li title='Chats'><NavLink to="/home">
                            <div className='st-nav-opt-active-bar'></div>
                            <div>
                                <i className="bi bi-chat-text"></i>
                            </div>
                        </NavLink></li>
                        <li title='Status'><NavLink to="/status">
                            <div className='st-nav-opt-active-bar'></div>
                            <div>
                                <i className="ri-donut-chart-line"></i>
                            </div>
                        </NavLink></li>
                    </ul>
                </div>
            </section>
            <section className='st-s-nav-sec st-ns-2'>
                <div>
                    <ul>
                        <li title='Archives'><NavLink to="/archives">
                            <div className='st-nav-opt-active-bar'></div>
                            <div>
                                <i className="ri-archive-line"></i>
                            </div>
                        </NavLink></li>
                        <li title='Settings'><NavLink to="/settings">
                            <div className='st-nav-opt-active-bar'></div>
                            <div>
                                <i className="ri-settings-5-line"></i>
                            </div>
                        </NavLink></li>
                        <li title='profile'>
                            <div className='st-nav-prof-img'><img src={userData?.avatar ? userData?.avatar : require('../../assets/img/profile-img.png')} alt="" draggable={false} /></div>
                        </li>
                    </ul>
                </div>
            </section>
        </nav>
    )
}

export const BottomNav = () => {

    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                await axios.get(`/users/current-user`)
                    .then((res) => {
                        setUserData(res?.data?.data)
                        setLoading(false)
                    })
            } catch (error) {
                // console.error(error);
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        try {
            socket.on('userChange', (data) => {
                if (userData?._id === data?._id) {
                    setUserData(data)
                }
            })

        } catch (error) {
            // console.log(error);
        }
    })

    return (
        <nav className='st-bottom-nav' >
            <section className='st-bottom-nav-sec'>
                <div>
                    <ul>
                        <li title='Chats'>
                            <NavLink to="/home">
                                <div className='st-btm-nav-opt-active-bar'></div>
                                <div>
                                    <i className="bi bi-chat-text"></i>
                                </div>
                            </NavLink>
                        </li>
                        <li title='Status'>
                            <NavLink to="/status">
                                <div className='st-btm-nav-opt-active-bar'></div>
                                <div>
                                    <i className="ri-donut-chart-line"></i>
                                </div>
                            </NavLink>
                        </li>
                        <li title='Archives'>
                            <NavLink to="/archives">
                                <div className='st-btm-nav-opt-active-bar'></div>
                                <div>
                                    <i className="ri-archive-line"></i>
                                </div>
                            </NavLink>
                        </li>
                        <li title='Settings'>
                            <NavLink to="/settings">
                                <div className='st-nav-prof-img'><img src={userData?.avatar || require('../../assets/img/profile-img.png')} alt="" draggable={false} /></div>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </section>
        </nav>
    )
}
import React from 'react'
import "./statusBox.style.css"
import { Outlet } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import axios from '../../server/axios-setup'

export const StatusContactList = () => {
    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {
        const fetchList = async () => {
            try {
                await axios.get('/users/current-user')
                    .then((res) => {
                        setCurrentUser(res?.data?.data)
                    })
            } catch (error) {
                toast.error("Unable to fetch User")
            }
        }
        fetchList()
    }, [])

    useEffect(() => {
        document.title = `ScribbleText - Status`
    }, [])

    return (
        <>
            <div className='st-chat-contact-box'>
                <section className='ss-chat-contact-list-box ss-status-box-contact-list'>
                    <div className='mb-4'><h5>Status</h5></div>
                    <div>
                        <div className='st-chat-contact-list-item'>
                            <a href="">
                                <div className='st-chat-c-list-item-content'>
                                    <div className='st-chat-contact-list-item-img'><img src={currentUser?.avatar || require('../../assets/img/profile-img.png')} alt="" draggable={false} /></div>
                                    <div>
                                        <div className='st-contact-username st-chat-contact-para'>{currentUser?.userName}</div>
                                        <div>No status</div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div>
                        <div className='st-col-fade mb-2 mt-4'><h6>From others</h6></div>
                        <ul className='st-chat-contact-list st-scrollbar-thin st-status-contact-list'>
                            {/* <li className='st-chat-contact-list-item'>
                                <a href="">
                                    <div className='st-chat-c-list-item-content'>
                                        <div className='st-chat-contact-list-item-img'><img src={require('../assets/img/prof-samp-img.jpg')} alt="" /></div>
                                        <div>
                                            <div className='st-chat-cont-username'>user_name</div>
                                            <div>20 mins ago</div>
                                        </div>
                                    </div>
                                </a>
                            </li> */}
                            <div className='text-center'>No content to display</div>
                        </ul>
                    </div>
                </section>
            </div>
        </>
    )
}

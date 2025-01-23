import React, { useEffect, useState, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import axios from '../../server/axios-setup'
import { socket } from '../../server/socket.io'
import { ContactLoader } from '../../components/loding-components/ContactLoader'

export const ArchivesBox = () => {

    const [archiveList, setArchiveList] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {
        const fetchList = async () => {
            try {
                await axios.get('/users/current-user')
                    .then((res) => {
                        setArchiveList(res?.data?.data?.archivedList)
                        setCurrentUser(res?.data?.data)
                    })
            } catch (error) {
                toast.error("Unable to fetch archived list")
            }
        }
        fetchList()
    }, [])
    useEffect(() => {
        try {
            socket.on('userChange', (data) => {
                if (currentUser?._id === data?._id) {
                    setArchiveList(data?.archivedList)
                }
            })

        } catch (error) {

        }
    })

    useEffect(() => {
        document.title = `ScribbleText - Archives list`
    }, [])
    return (
        <>
            <div className='st-chat-contact-box'>
                <div className='mb-4 st-archive-box-heading'><h5>Archives</h5></div>
                <section className='ss-chat-contact-list-box'>
                    <div>
                        <ul className='st-chat-contact-list st-scrollbar-thin'>
                            {!archiveList && <ContactLoader />}
                            {archiveList?.length === 0 && <div className='text-center'>No contacts found</div>}
                            {archiveList?.map((contact, index) => {
                                return (
                                    <ArchiveItem contact={contact} key={index} />
                                )
                            })}
                        </ul>
                    </div>
                </section>
            </div>
            <Outlet />
        </>
    )
}

const ArchiveItem = ({ contact }) => {
    // Context menu 
    const [contMenuActive, setContMenuActive] = useState(false)
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation()
        setContMenuActive(true);
    }
    return (
        <li className='st-chat-contact-list-item' onContextMenu={handleContextMenu}>
            <Link to={`chats/${contact?._id}`}>
                <div className='st-chat-c-list-item-content'>
                    <div className='st-chat-contact-list-item-img'><img src={contact?.avatar || require('../../assets/img/profile-img.png')} alt="" draggable={false} /></div>
                    <div>
                        <div className='st-contact-username st-chat-contact-para'>{contact?.fullName}</div>
                        <div className='st-chat-contact-para'>{contact?.userName}</div>
                    </div>
                </div>
            </Link>
            {contMenuActive && <ContextMenu activeState={contMenuActive} closeFunc={() => setContMenuActive(false)} userId={contact?._id} />}
        </li>
    )
}


const ContextMenu = ({ activeState, closeFunc, userId }) => {

    const contextMenuRef = useRef(null)
    useEffect(() => {
        const handleClose = (e) => {
            if (contextMenuRef.current && activeState && !contextMenuRef.current.contains(e.target)) {
                closeFunc()
            }
        }

        const box = document.getElementsByClassName('st-chat-contact-list')
        if (box) {
            box[0].addEventListener('scroll', () => closeFunc())
        }

        document.addEventListener('click', handleClose)
        document.addEventListener('contextmenu', handleClose)
        return () => {
            document.removeEventListener('click', handleClose)
            document.removeEventListener('contextmenu', handleClose)
        }
    }, [])

    const navigate = useNavigate()
    const chatUri = `/archives/chats/${userId}`

    const archiveDeleteHandler = async () => {
        try {
            await axios.get(`/users/remove-archive/${userId}`)
                .then((res) => {
                    toast.success("Contact removed from archive list");
                    closeFunc()
                })
        } catch (error) {
            toast.error("Unable to remove now")

        }
    }
    return (
        <div className='st-chat-box-context-menu st-chat-contact-context-menu' ref={contextMenuRef}>
            <ul>
                <li><button onClick={() => { navigate(chatUri); closeFunc() }}><span><i className="ri-message-3-line"></i></span><span>Open Chat</span></button></li>
                <li><button onClick={archiveDeleteHandler}><span><i className="ri-archive-line" ></i></span><span>Remove</span></button></li>
            </ul>
        </div>
    )
}

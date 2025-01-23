import React, { useContext } from 'react'
import "./chatContactBox.style.css"
import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { PopupWraper } from '../popup-box/popup-box'
import axios from '../../server/axios-setup'
import { toast, ToastContainer } from 'react-toastify'
import { Spinner } from '../../utils/loader-spinner'
import { socket } from '../../server/socket.io'
import { getDateData } from '../../utils/format-date'
import SocketContext from '../../contexts/SocketContext'
import { ContactLoader } from '../loding-components/ContactLoader'

export const ChatContactBox = () => {

    const [addContOpen, setAddContOpen] = useState(false);

    // Current user
    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                await axios.get('/users/current-user')
                    .then((res) => {
                        setCurrentUser(res.data?.data)
                    })
            } catch (error) {
                // console.error(error);
            }
        }
        fetchUser()
    }, [])

    // Update contactList when message added to it
    const [triggerChange, setTriggerChange] = useState(false)
    useEffect(() => {
        socket.on('messageChange', (message) => {
            if (message?.senderId === currentUser?._id || message?.recipientId === currentUser?._id) {
                setTriggerChange(!triggerChange)
            }
        })
        socket.on('addMessage', (message) => {
            if (message?.senderId === currentUser?._id || message?.recipientId === currentUser?._id) {
                setTriggerChange(!triggerChange)
            }
        })
    })


    // Fetching contactList
    const [contactList, setContactList] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                await axios.get('/users/contactlist')
                    .then(res => {
                        setContactList(res.data?.data?.contactList)
                    })
            } catch (error) {
                toast.error("Unable to get contactList")
            }
        }

        fetchData()
    }, [triggerChange])

    const [contactShowList, setContactShowList] = useState(null)
    useEffect(() => {
        setContactShowList(contactList)
    }, [contactList])

    // handle contact search
    const [searchInput, setSearchInput] = useState('')
    useEffect(() => {
        let newList = []
        contactList?.some(e => {
            if (e.userName.toLowerCase().includes(searchInput.toLowerCase()) || e.fullName.toLowerCase().includes(searchInput.toLowerCase())) {
                newList.push(e)
            }
        })
        if (newList.length > 0) {
            setContactShowList(newList)
        } else { setContactShowList(contactList) }
    }, [searchInput])

    // handle new chat
    const handlePopupContactClick = (contact) => {
        const index = contactList?.findIndex(e => e._id === contact._id)
        if (index === -1) {
            setContactList([contact, ...contactList]);
        } else {
            setContactList(contactList)
        }
        setSearchInput('')
    }

    // get connected user list
    const { onlineUserList } = useContext(SocketContext);

    return (
        <div className='st-content-container'>
            <div className='st-chat-contact-box'>
                <section className='st-contact-box-search-sec'>
                    <div className='st-contact-box-search-sec-p-1'>
                        <div className='st-contact-box-head-img'><img src={require('../../assets/img/logo.png')} alt="" width={25} draggable={false} /></div>
                        <div><h5 className='mb-0'>{window.innerWidth > 768 ? "Chats" : "ScribbleText"}</h5></div>
                        <div className='st-justify-s-end'><button className='st-add-contact-btn' onClick={() => setAddContOpen(true)}><i className="bi bi-pencil-square"></i></button></div>
                    </div>
                    <div>
                        <form action="" className='d-grid'>
                            <div className='st-input-search-ico'><i className="ri-search-2-line"></i></div>
                            <input type="text" className='st-search-input' placeholder='Search a contact' onChange={(e) => setSearchInput(e.target.value)} />
                        </form>
                    </div>
                </section>

                <section className='st-chat-contact-list st-scrollbar-thin' >
                    {!contactShowList && <ContactLoader />}
                    {contactShowList?.map((item, index) => {
                        return <ContactListItem key={index} contact={item} currentUser={currentUser} isUserOnline={onlineUserList?.includes(item?.recipientId) || false} />
                    })}
                    {contactShowList?.length === 0 &&
                        <div className='text-center mt-5'>
                            <div className='mb-3'>Start chatting with others</div>
                            <div className='d-flex justify-content-center'><button className='st-popup-action-btn' onClick={() => setAddContOpen(true)}>Start new chat</button></div>
                        </div>
                    }
                </section>
                <ContactBoxPopup openState={addContOpen} onClose={() => setAddContOpen(false)} onContactClick={handlePopupContactClick} />
            </div>
            <Outlet />
        </div>
    )
}

const ContactListItem = ({ contact, currentUser, onlineUserList, isUserOnline }) => {
    const [contMenuActive, setContMenuActive] = useState(false)
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation()
        setContMenuActive(true);
    }
    // last message
    const lastMessage = contact?.lastMessage
    const lastMessageTime = getDateData(lastMessage?.createdAt)?.timeString
    // contact active ui
    const params = useParams();
    const contactId = params?.userId

    const navigate = useNavigate();
    // handle key event 
    const handleEsc = (event) => {
        if (window.location.pathname.includes("/chats/")) {
            if (event.key === "Escape") {
                navigate("/home");
            }
        }
    }

    return (
        <li className={`st-chat-contact-list-item ${contact?.recipientId === contactId ? "st-chat-contact-list-item-active" : ""}`} onContextMenu={handleContextMenu} tabIndex={0} onKeyDown={handleEsc}>
            <Link to={`/home/chats/${contact?.recipientId}`}>
                <div className='st-chat-c-list-item-content'>
                    <div className='st-chat-contact-list-item-img'>
                        <img src={contact?.avatar || require('../../assets/img/profile-img.png')} alt="" draggable={false} />
                        {isUserOnline && <div className='st-online-flag'></div>}
                    </div>
                    <div>
                        <div className='st-contact-username-box'>
                            <div className='st-contact-username st-chat-contact-para'>{contact?.fullName}</div>
                            {currentUser?._id === contact?._id && <div className='st-text-small'> (you)</div>}
                            <div className={`st-chat-cont-item-time-para ${contact?.unseenMessagesCount === 0 && 'st-col-fade'}`}>{lastMessageTime}</div>
                        </div>
                        <div className={`st-chat-cont-lt-message-box ${contact?.unseenMessagesCount === 0 && 'st-col-fade'}`}>
                            {lastMessage?.senderId === currentUser?._id &&
                                <span>
                                    {lastMessage?.receiveStatus === 'seen' && <i className="ri-check-double-line st-col-lblue"></i>}
                                    {lastMessage?.receiveStatus === 'received' && <i className="ri-check-double-line st-col-fade"></i>}
                                    {lastMessage?.receiveStatus === 'un received' && <i className="ri-check-line st-col-fade"></i>}
                                    {lastMessage?.receiveStatus === 'sending' && <i className="ri-time-line st-col-fade"></i>}
                                </span>}
                            <span className='st-chat-contact-para'>{lastMessage?.content?.text || lastMessage?.content?.file?.original_filename}</span>

                        </div>
                    </div>
                    {contact?.unseenMessagesCount > 0 && <div className='st-contact-unseen-mes-counter st-fadein-anim'>{contact?.unseenMessagesCount}</div>}
                </div>
            </Link>
            {contMenuActive && <ContextMenu activeState={contMenuActive} closeFunc={() => setContMenuActive(false)} userId={contact.recipientId} />}
        </li>
    )
}

const ContextMenu = ({ activeState, closeFunc, userId }) => {


    // handle context menu
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
    const chatUri = `/home/chats/${userId}`

    const archiveClickHandler = async () => {
        try {
            await axios.get(`/users/add-archive/${userId}`)
                .then((res) => {
                    toast.success("Contact added to Archive");
                    closeFunc()
                })
        } catch (error) {
            toast.error("Unable to Archive now")
            // console.log(error);
        }
    }
    return (
        <div className='st-chat-box-context-menu st-chat-contact-context-menu' ref={contextMenuRef}>
            <ul>
                <li><button onClick={() => { navigate(chatUri); closeFunc() }}><span><i className="ri-message-3-line"></i></span><span>Open Chat</span></button></li>
                <li><button onClick={archiveClickHandler}><span><i className="ri-archive-line" ></i></span><span>Archive</span></button></li>
            </ul>
        </div>
    )
}

const ContactBoxPopup = ({ openState, onClose, onContactClick }) => {

    const [input, setInput] = useState('')

    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchList = async () => {
            try {
                setLoading(true)
                await axios.get(`/users/userlist`)
                    .then((res) => {
                        const list = res.data?.data
                        let newList = []
                        list?.some(e => {
                            if (e.userName.toLowerCase().includes(input.toLowerCase()) || e.fullName.toLowerCase().includes(input.toLowerCase())) {
                                newList.push(e)
                            }
                        })
                        setUserList(newList)
                        setLoading(false)

                    })
            } catch (error) {
                setLoading(false)
                // console.error(error);
            }
        }

        fetchList()
    }, [input])

    const navigate = useNavigate()


    const contactClickHandler = (user) => {
        const userObj = {
            _id: user._id,
            fullName: user?.fullName,
            userName: user?.userName,
            avatar: user?.avatar || null
        }
        onContactClick(userObj)
        const chatUri = `/home/chats/${user?._id}`
        navigate(chatUri)
        onClose()
    }

    return (
        <PopupWraper openState={openState} className={'st-contact-box-popup-box'} >
            <div className='st-popup-head d-flex align-items-center gap-2'>
                <div className='st-contact-popup-back-btn-box'>
                    <button className="st-chat-back-btn" onClick={() => onClose()} ><i className="ri-arrow-left-line"></i></button>
                </div>
                <h5>Add contacts</h5>
            </div>
            <div className='st-popup-body st-scrollbar-thin st-contact-popup-body'>
                <div>
                    <form action="" className='d-grid' onSubmit={e => e.preventDefault()} >
                        <div className='st-input-search-ico'><i className="ri-search-2-line"></i></div>
                        <input type="text" className='st-search-input' placeholder='Search by username' autoFocus onChange={(e) => setInput(e.target.value)} />
                    </form>
                </div>
                <div className='st-cont-popup-contact-box'>
                    <ul className='st-popup-contact-box-item-list st-scrollbar-thin'>
                        {!input && <div className='text-center'>Try searching for contacts</div>}
                        {input && userList?.map((item, index) => {
                            return <PopupContactListItem user={item} key={index} clickHandler={() => contactClickHandler(item)} />
                        })}
                        {loading && <div className='d-flex justify-content-center mt-2'><Spinner /></div>}
                    </ul>
                </div>
            </div>
            <div className='st-popup-bottom st-contact-popup-btm'>
                <button className='st-popup-close-btn' onClick={() => onClose()}>Close</button>
            </div>
        </PopupWraper>
    )
}

const PopupContactListItem = ({ user, clickHandler }) => {

    return (
        <li className='st-popup-contact-box-item' onClick={() => clickHandler()} >
            <div className='st-popup-contact-list-img'><img src={user?.avatar || require('../../assets/img/profile-img.png')} alt="" /></div>
            <div>
                <div className='st-chat-cont-username'>{user?.fullName}</div>
                <div className='st-text-small st-col-fade'>{user?.userName}</div>
            </div>
        </li>
    )
}

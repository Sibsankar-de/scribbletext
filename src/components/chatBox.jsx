import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { PopupWraper } from '../utils/popup-box';
import axios from '../server/axios-setup';
import parse from 'html-react-parser';
import { socket } from '../server/socket.io';
import { toast, ToastContainer } from 'react-toastify';
import Compressor from 'compressorjs';
import { getContextBoxPosition } from '../utils/context-position';
import PropTypes from 'prop-types';


const toastOptions = {
  autoClose: 5000,
  position: 'top-center',
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
}

export const ChatBox = () => {
  const textAreaRef = useRef(null);
  const chatBoxRef = useRef(null)
  useEffect(() => {
    const handleFocus = () => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.addEventListener('focus', handleFocus);
    }

    return () => {
      if (textArea) {
        textArea.removeEventListener('focus', handleFocus);
      }
    };
  }, []);


  const navigate = useNavigate()
  const [contextMenuEvent, setContextMenuEvent] = useState(null)
  const [contextMenuActive, setContextMenuActive] = useState(false);

  const handleContextMenu = e => {
    e.preventDefault();
    e.stopPropagation()
    setContextMenuEvent(e)
    setContextMenuActive(true);
  }

  const contextMenuCloseFnc = () => setContextMenuActive(false);



  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiBtnClickHandler = e => {
    e.stopPropagation();
    setEmojiOpen(!emojiOpen);
    setFileShareOpen(false)
  }

  const [fileShareOpen, setFileShareOpen] = useState(false)
  const fileBtnClickHandler = e => {
    e.stopPropagation()
    setFileShareOpen(!fileShareOpen)
    setEmojiOpen(false)
  }

  // Input handlers
  const [textInput, setTextInput] = useState('')
  // increase textarea height

  useEffect(() => {
    const textarea = textAreaRef.current
    textarea.style.height = `2.2em`
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [textInput])

  // file input
  const [fileInput, setFileInput] = useState(null)

  // file upload show box
  const [boxWidth, setBoxWidth] = useState(0);
  const [boxBottom, setBoxBottom] = useState(0)
  useEffect(() => {
    const boxRef = document.getElementsByClassName('st-chat-box-type-mes-sec')[0]
    if (boxRef) {
      const width = boxRef.clientWidth;
      const height = boxRef.clientHeight;
      setBoxWidth(width);
      setBoxBottom(height)
    }
  }, [textInput])

  // Api handle section
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        await axios.get('/users/current-user')
          .then(res => {
            setCurrentUser(res?.data?.data)
          })
      } catch (error) {
        // console.error(error);
      }
    }
    fetchUser()
  }, [])
  useEffect(() => {
    try {
      socket.on('userChange', (data) => {
        if (currentUser?._id === data?._id) {
          setCurrentUser(data)
        }
      })
    } catch (error) {
      // console.log(error);
    }
  })

  const [recipient, setRecipient] = useState(null)
  const params = useParams();
  const recipientId = params.userId

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await axios.get(`/users/user-details/${recipientId}`)
          .then((res) => {
            setRecipient(res.data?.data)
          })
      } catch (error) {
        // console.error(error);
      }
    }
    fetchUser()
  }, [recipientId])


  const [messageList, setMessageList] = useState([])
  const [initMessageList, setInitMessageList] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [recipientChat, setRecipientChat] = useState(null)
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setChatLoading(true)
        await axios.get(`message/g-croom/${recipientId}`)
          .then((res) => {
            setMessageList(res.data?.data?.messages || [])
            setInitMessageList(res.data?.data?.messages || [])
            setChatLoading(false)
          })
      } catch (error) {
        // console.error(error);
      }
    }

    fetchMessage()
  }, [recipientId])



  // Handle message submission
  const [loadSend, setLoadSend] = useState(false)

  const handleSendMessage = async () => {

    let id = 1
    const initMessage = {
      _id: id,
      content: {
        text: textInput.trim(),
      },
      recipientId: recipientId,
      createdAt: Date.now(),
      receiveStatus: 'sending'

    }

    const formData = new FormData()
    const postData = {
      text: textInput.trim(),
      recipientId: recipientId,
      file: fileInput,
    }

    Object.keys(postData).forEach(key => {
      formData.append(key, postData[key]);
    })

    const fileLoadingMessage = {
      loading: true,
      recipientId: recipientId
    }

    if (textInput.trim().length > 0 || fileInput) {
      fileInput && setMessageList([...messageList, fileLoadingMessage])

      setFileInput(null)
      try {
        setLoadSend(true);
        await axios.post('/message/create-message', formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }).then((res) => {
          setMessageList(messageList.filter(e => e['loading'] !== true))
          setTextInput('')
          setLoadSend(false)
        })

      } catch (error) {
        // console.error(error);
        setLoadSend(false)
      }
    }
  }

  // Handle database changes
  useEffect(() => {
    try {
      socket.on('messageChange', (data) => {
        setRecipientChat(data)
      })
    } catch (error) {
      console.log(error);
    }
  })

  useEffect(() => {
    if (
      (recipientChat?.recipientId === recipientId || recipientChat?.recipientId === currentUser?._id) &&
      (recipientChat?.senderId === currentUser?._id || recipientChat?.senderId === recipientId)
    ) {

      const index = messageList?.findIndex(item => item._id === recipientChat?._id);

      if (index !== -1 && !loadSend) {
        setMessageList(list => {
          const updatedList = [...list]
          updatedList[index] = recipientChat
          return updatedList
        })
      }

      else {
        setMessageList([...messageList, recipientChat])
      }
    }
  }, [recipientChat])


  // Handle Message scroll
  useEffect(() => {
    const element = document.getElementsByClassName('st-chat-box-message-box')

    if (element) {
      element[0].scrollTop = element[0].scrollHeight
    }
  }, [messageList])

  useEffect(() => {
    document.title = recipient ? `Chat with - ${recipient?.userName}` : 'loading...'
  }, [recipient])

  return (
    <div className='st-chat-box-container'>

      <section className='st-chat-box-contact-sec'>
        <div className='st-chat-box-contact-det-box'>
          <div className='st-chat-back-btn-box'>
            <button className="st-chat-back-btn" onClick={() => navigate(-1)} ><i className="ri-arrow-left-line"></i></button>
          </div>
          <div className='st-chat-cont-img-box'>
            <img src={recipient?.avatar || require('../assets/img/profile-img.png')} alt=" " draggable={false} />
          </div>
          <div>
            <div className='fw-bold'>{recipient?.fullName}</div>
            <div className='st-col-fade st-text-small'>{recipient?.userName}</div>
          </div>
          {!recipient && <div className='st-chat-prof-loading-box'></div>}
        </div>
      </section>

      <section className='st-chat-box-message-sec' onContextMenu={handleContextMenu}>
        <div className='st-chat-box-message-box-container' ref={chatBoxRef}>
          {chatLoading && <div className="st-chat-load-box">Loading chats...</div>}
          {(!chatLoading && messageList?.length === 0) && <div className='st-empty-chat-sgbox'>
            <div>Start chatting with <span className='text-primary'>@{recipient?.userName}</span></div>
            <div className='st-col-fade st-text-small'>Chats and messages are encrypted and safe</div>
          </div>}
          <ul className='st-chat-box-message-box  st-scrollbar-thin' >
            {!chatLoading &&
              messageList?.map((message, index) => {
                const messageFrom = message?.recipientId === recipientId ? 'sender' : 'receiver'
                return (
                  <React.Fragment key={index}>
                    <ChatFlag currentUser={currentUser} index={index} key={'flag' + index} messageList={messageList} unCheckList={initMessageList} />
                    <ChatBubble
                      messageFrom={messageFrom}
                      key={"chat" + index}
                      messageItem={message}
                      messageList={messageList}
                      index={index}
                      currentUser={currentUser}
                    />
                  </React.Fragment>
                )
              })}
          </ul>
        </div>
      </section>

      <section className='st-chat-box-type-mes-sec'>
        <div className='st-chat-box-type-mes-sec-content'>
          <div className='d-flex gap-2 align-items-end'>
            <div>
              <button className='st-mes-input-box-btn' onClick={emojiBtnClickHandler}><span><i className="ri-emoji-sticker-line"></i></span></button>
              {emojiOpen && <ChatEmojiBox openState={emojiOpen} closeFunc={() => setEmojiOpen(false)} onEmojiClick={emoji => setTextInput(textInput + emoji)} />}
            </div>
            <div>
              <button className='st-mes-input-box-btn' onClick={fileBtnClickHandler}><span><i className="ri-attachment-2"></i></span></button>
              {fileShareOpen && <FileShareBox openState={fileShareOpen} closeFunc={() => setFileShareOpen(false)} onGetFile={e => setFileInput(e[0])} />}
            </div>
          </div>
          <div className='d-flex gap-2 align-items-end'>
            <form action="" className='d-flex'>
              <textarea type="text" placeholder='Type a message' className='st-mes-type-input st-scrollbar-thin' onChange={(e) => setTextInput(e.target.value)} ref={textAreaRef} value={textInput} disabled={loadSend} />
            </form>
            <button className='st-mes-input-box-btn' onClick={handleSendMessage} disabled={loadSend} ><span><i className="ri-send-plane-2-line"></i></span></button>
          </div>
        </div>
      </section>


      {fileInput &&
        <div className="st-upload-file-show-box st-fadein-anim" style={{ width: boxWidth, bottom: boxBottom }}>
          <div className='st-upload-file-show-box-container'>
            <div><span><i className="ri-file-line fs-2"></i></span></div>
            <div>
              <div className='st-file-upload-file-name'>{fileInput.name}</div>
              <div className='st-col-fade'><span>{fileSizeConverter(fileInput.size)}</span><span><i className="bi bi-dot mx-1"></i></span><span>{fileInput.type}</span></div>
            </div>
            <div className='st-justify-s-end'>
              <span className='st-col-fade' onClick={() => setFileInput(null)}><i className="ri-close-circle-fill fs-4"></i></span>
            </div>
          </div>
        </div>
      }

      {contextMenuActive && <ChatBoxContextMenu event={contextMenuEvent} activeState={contextMenuActive} closeFunc={contextMenuCloseFnc} />}


      <ToastContainer />
    </div>
  )
}

const ChatBubble = ({ messageFrom, messageItem, messageList, index, currentUser, onMessageChange }) => {
  const [contextMenuEvent, setContextMenuEvent] = useState(null);
  const [contextMenuActive, setContextMenuActive] = useState(false);

  const handleContextMenu = e => {
    e.preventDefault();
    e.stopPropagation()
    setContextMenuEvent(e)
    setContextMenuActive(true);
  }

  // const handle message
  const [message, setMessage] = useState(null)
  useEffect(() => {
    setMessage(messageItem)
  }, [messageItem])

  useEffect(() => {
    const updateMessageStatus = async () => {
      const postData = {
        receiveStatus: 'seen',
        messageId: message?._id
      }
      if (message?.recipientId === currentUser?._id)
        try {
          await axios.post('/message/update-status', postData)
        } catch (error) {
          console.log(error);
        }
    }
    if (message?._id) {
      updateMessageStatus()
    }

  }, [message])

  useEffect(() => {

    try {
      socket.on('messageChange', (data) => {
        if (message?._id === data?._id) {
          setMessage(data)
        }
      })
    } catch (error) {
    }
  })



  // handles chat bubble preferances
  const [chatTail, setChatTail] = useState(true)
  useEffect(() => {
    if (index > 0 && messageList) {
      const ind0 = messageList[Number(index) - 1]
      const ind1 = messageList[Number(index)]
      if (
        (ind0?.senderId === ind1?.senderId || ind0?.recipientId === ind1?.recipientId)
        && getDateData(ind0?.createdAt)?.dateString === getDateData(ind1?.createdAt)?.dateString
        && (
          (!ind0?.deletedFromSender && currentUser?._id === ind0?.senderId)
          || (!ind0?.deletedFromRecipient && currentUser?._id === ind0?.recipientId)
        )
      ) {
        setChatTail(false)
      }
      else {
        setChatTail(true)
      }
    }
  })

  // Changes occurences of text message
  const handleMessageText = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    return text?.replace(urlPattern, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }

  const [messageTime, setMessageTime] = useState(null)
  useEffect(() => {
    if (message) {
      const match = getDateData(message.createdAt);
      const timeStr = match?.hours + ':' + match?.minutes
      if (match) {
        setMessageTime(timeStr)
      }
    }
  }, [message])

  // Checks If message deleted or not
  const [isChatDeleted, setIsChatDeleted] = useState(false)
  useEffect(() => {
    if (messageFrom === 'sender' && message?.deletedFromSender) {
      setIsChatDeleted(true)
    }
    else if (messageFrom === 'receiver' && message?.deletedFromRecipient) {
      setIsChatDeleted(true)
    }
    else {
      setIsChatDeleted(false)
    }
  }, [message])


  // File download handler
  const getImgDownloadUrl = (url) => {
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      return url;
    }
    const downloadUrl = url.slice(0, uploadIndex + 8) + 'fl_attachment/' + url.slice(uploadIndex + 8);
    return downloadUrl;
  };

  const handleFileDownload = async () => {
    try {
      const downloadUrl = getImgDownloadUrl(message?.content?.file?.url, { mode: 'cors' })
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', message?.content?.file?.original_filename + '-scribble-text');
      link.target = "_blank"
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle Message scroll
  useEffect(() => {
    const element = document.getElementsByClassName('st-chat-box-message-box')

    if (element) {
      element[0].scrollTop = element[0].scrollHeight
    }
  }, [message])

  return (
    (!isChatDeleted) && <div className={`${messageFrom === 'receiver' ? 'st-receiver-bubble-box' : 'st-sender-bubble-box'} ${!chatTail && 'st-hide-chat-tail'}`} >
      <div className='st-chat-bubble' onContextMenu={handleContextMenu}>
        <div className='st-chat-bubble-content-box'>
          {message?.content?.file && <div className='st-chat-bubble-file-box'>
            <div className='st-chat-bubble-file'>
              <div className='st-chat-bubble-file-content'>
                <div>
                  <button className='st-chat-file-donload-btn' onClick={handleFileDownload} ><span><i className='ri-download-2-line'></i></span></button>
                </div>
                <div className='d-grid'>
                  <div><span className='st-chat-file-name-box'>{message?.content?.file?.original_filename} { }</span></div>
                  <div className='st-text-small st-col-fade'>
                    <span >{fileSizeConverter(message?.content?.file?.bytes)}</span>
                    <span><i className="bi bi-dot mx-1"></i></span>
                    <span>{message?.content?.file?.resource_type}/{message?.content?.file?.format}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span></span>
            </div>
          </div>}
          <div>
            <pre className='st-chat-bubble-text-message'><span>{parse(handleMessageText(message?.content?.text) || '')}</span></pre>
          </div>
        </div>
        <div className='st-chat-bubble-chat-stat'>
          <span className='mx-1 st-col-fade st-text-small'>{messageTime}</span>
          {(!message?.loading && messageFrom !== 'receiver') &&
            <span>
              {message?.receiveStatus === 'seen' && <i className="ri-check-double-line st-col-lblue"></i>}
              {message?.receiveStatus === 'received' && <i className="ri-check-double-line st-col-fade"></i>}
              {message?.receiveStatus === 'un received' && <i className="ri-check-line st-col-fade"></i>}
              {message?.receiveStatus === 'sending' && <i className="ri-time-line st-col-fade"></i>}

            </span>}
        </div>

        <>
          {message?.loading && <div className='d-flex'>
            <i className="bi bi-dot st-load-bubble-dot-1"></i>
            <i className="bi bi-dot st-load-bubble-dot-2"></i>
            <i className="bi bi-dot st-load-bubble-dot-3"></i>
          </div>}
        </>
      </div>
      {contextMenuActive && <ChatBubbleContextMenu event={contextMenuEvent} activeState={contextMenuActive} closeFunc={() => setContextMenuActive(false)} messageFrom={messageFrom} messageId={message?._id} text={message?.content?.text} />}
    </div>
  )
}

const ChatFlag = ({ index, messageList, currentUser, unCheckList }) => {
  const [showFlag, setShowFlag] = useState(false);
  const [dateFlag, setDateFlag] = useState('')
  const [showUnreadFlag, setShowUnreadFlag] = useState(false)

  // Implementing date flags
  useEffect(() => {


    if (messageList) {

      const currentMessageDate = getDateData(messageList[index]?.createdAt);
      const today = getDateData(Date.now());

      if (index !== 0) {
        if (getDateData(messageList[index - 1]?.createdAt)?.dateString === currentMessageDate?.dateString) {
          setShowFlag(false)
        }
        else {
          setShowFlag(true);
          setDateFlag(currentMessageDate?.dateString)
        }
      }
      else {
        setShowFlag(true)
        setDateFlag(currentMessageDate?.dateString)
      }

      if (currentMessageDate?.dateString === today.dateString) {
        setDateFlag('Today')
      }
      else if (currentMessageDate?.year === today.year && currentMessageDate?.month === today.month && (today.day - currentMessageDate?.day === 1 || today.day < currentMessageDate?.day)) {
        setDateFlag('Yesterday')
      }


    }

  }, [messageList])

  // implementing Unread messages flag
  useEffect(() => {
    if (unCheckList) {

      if (index !== 0) {
        if (unCheckList[index - 1]?.receiveStatus === 'un received' && unCheckList[index]?.receiveStatus === 'un received') {
          setShowUnreadFlag(false)
        }
        else if (unCheckList[index - 1]?.receiveStatus !== 'un received' && unCheckList[index]?.receiveStatus === 'un received' && unCheckList[index].recipientId === currentUser?._id) {
          setShowFlag(true)
          setShowUnreadFlag(true)
        }
        else {
          setShowUnreadFlag(false)
        }
      }
      else {
        if (unCheckList[index]?.receiveStatus === 'un received') setShowUnreadFlag(true)
        else { setShowUnreadFlag(false) }
      }
    }
  })


  return (
    showFlag && <div className='st-chat-flag-box'>
      {showUnreadFlag && <div className='st-unread-flag'>
        <div className='st-unread-flag-para'><span>Unread messages</span></div>
      </div>}
      {dateFlag && <div className='st-flag-para st-col-fade'>
        <span> {dateFlag}</span>
      </div>}
    </div>
  )
}

const ChatEmojiBox = ({ openState, closeFunc, onEmojiClick }) => {
  const emojiBoxRef = useRef(null)
  useEffect(() => {
    const handleClose = (e) => {
      if (emojiBoxRef.current && openState && !emojiBoxRef.current.contains(e.target)) {
        closeFunc()
      }
    }
    document.addEventListener('click', handleClose)
    return () => document.removeEventListener('click', handleClose)
  }, [])

  const emojiClickHandler = (emojiObj) => {
    onEmojiClick(emojiObj.emoji)
  }
  return (
    <div className='st-chat-box-emoji-picker-box' ref={emojiBoxRef}>
      <EmojiPicker theme='dark' emojiStyle='apple' onEmojiClick={emojiClickHandler} autoFocusSearch={false} />
    </div>
  )
}

const FileShareBox = ({ openState, closeFunc, onGetFile }) => {

  const fileBoxRef = useRef(null)
  useEffect(() => {
    const handleClose = (e) => {
      if (fileBoxRef.current && openState && !fileBoxRef.current.contains(e.target)) {
        closeFunc()
      }
    }
    document.addEventListener('click', handleClose)
    return () => document.removeEventListener('click', handleClose)
  }, [])

  const [fileInput, setFileInput] = useState(null);

  useEffect(() => {
    if (fileInput) {
      if (fileInput[0].size < 7340032) {
        try {
          new Compressor(fileInput[0], {
            quality: 0.6,
            success(file) {
              const compressedFile = new File([file], fileInput[0].name, {
                type: file.type,
                lastModified: Date.now(),
              })
              onGetFile([compressedFile])
            }
          })
        } catch (error) {
          // console.log(error);
        }

        closeFunc()
      } else {
        toast.warn("Maximum accepted file size is 7 Mb", toastOptions)
      }
    }
  }, [fileInput])

  return (
    <div className='st-chat-box-file-share-box' ref={fileBoxRef}>
      <div className='st-file-share-box-btn-box'>
        <div>
          <input type="file" accept='image/*' className='st-file-upload-input' id='f-up-img-file' onChange={(e) => setFileInput(e.target.files)} />
          <label htmlFor="f-up-img-file">
            <div className='st-file-upload-btn'><span><i className="ri-image-line"></i></span><span>Photos</span></div>
          </label>
        </div>
        <div>
          <input type="file" accept='video/*' className='st-file-upload-input' id='f-up-video-file' onChange={(e) => setFileInput(e.target.files)} />
          <label htmlFor="f-up-video-file">
            <div className='st-file-upload-btn'><span><i className="ri-video-on-line"></i></span><span>Videos</span></div>
          </label>
        </div>
        <div>
          <input type="file" accept='audio/*' className='st-file-upload-input' id='f-up-audio-file' onChange={(e) => setFileInput(e.target.files)} />
          <label htmlFor="f-up-audio-file">
            <div className='st-file-upload-btn'><span><i className="ri-music-2-line"></i></span><span>Audios</span></div>
          </label>
        </div>
        <div>
          <input type="file" className='st-file-upload-input' id='f-up-doc-file' onChange={(e) => setFileInput(e.target.files)} />
          <label htmlFor="f-up-doc-file">
            <div className='st-file-upload-btn'><span><i className="ri-file-line"></i></span><span>Documents</span></div>
          </label>
        </div>
      </div>
    </div>
  )
}

const ChatBoxContextMenu = ({ event, activeState, closeFunc }) => {
  const [boxPos, setBoxPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (event) {
      const { top, left } = getContextBoxPosition(event, contextMenuRef, 70)
      setBoxPos({ top: top, left: left })
    }
  }, [event])

  const positionProp = {
    top: boxPos.top,
    left: boxPos.left
  }
  const contextMenuRef = useRef(null)
  useEffect(() => {
    const handleClose = (e) => {
      if (contextMenuRef.current && activeState && !contextMenuRef.current.contains(e.target)) {
        closeFunc()
      }
    }

    document.addEventListener('click', handleClose)
    document.addEventListener('contextmenu', handleClose)
    return () => document.removeEventListener('click', handleClose)
  }, [])

  const navigate = useNavigate();
  const closeChatHandler = () => {
    navigate('/home/start')
    closeFunc()
  }
  return (
    <div className='st-chat-box-context-menu' style={positionProp} ref={contextMenuRef} onContextMenu={e => e.preventDefault()} >
      <ul>
        <li><button onClick={closeChatHandler}><span><i className="ri-close-line"></i></span><span>Close Chat</span></button></li>
      </ul>

    </div>
  )
}

const ChatBubbleContextMenu = ({ event, activeState, closeFunc, messageFrom, messageId, text }) => {
  const popupRef = useRef(null)
  const contextMenuRef = useRef(null)
  const [boxPos, setBoxPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (event) {
      const { top, left } = getContextBoxPosition(event, contextMenuRef, 70, 50)
      setBoxPos({ top: top, left: left })
    }
  }, [event])

  const positionProp = {
    top: boxPos.top,
    left: boxPos.left,
    position: 'fixed'
  }
  useEffect(() => {
    const handleClose = (e) => {
      if (activeState && !contextMenuRef?.current?.contains(e.target) && !popupRef?.current?.contains(e.target)) {
        closeFunc()
      }
    }

    const element = document.getElementsByClassName('st-chat-box-message-box')
    if (element) {
      element[0].addEventListener('scroll', () => closeFunc())
    }
    document.addEventListener('click', handleClose)
    document.addEventListener('contextmenu', handleClose)
    return () => {
      document.removeEventListener('click', handleClose)
      document.removeEventListener('contextmenu', handleClose)
    }
  }, [])

  const [deletePopup, setDeletePopup] = useState({ type: 'only', active: false })

  // Copy text to clipBoard
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
          .then(() => {
            toast.success("Text copied to clipboard", toastOptions);
            closeFunc()
          })
      }
    } catch (error) {
      toast.error("Unable to copy text", toastOptions)
    }
  }

  return (
    <>
      <div className='st-chat-box-context-menu' style={positionProp} ref={contextMenuRef} onContextMenu={e => e.preventDefault()} >
        <ul>
          <li>
            <button onClick={handleCopyText}><span><i className="ri-file-copy-line"></i></span><span>Copy text</span></button>
          </li>
          <li>
            <button onClick={() => setDeletePopup({ type: 'only', active: true })}><span><i className="ri-delete-bin-line"></i></span><span>Delete for me</span></button>
          </li>
          {messageFrom === 'sender' &&
            <li><button onClick={() => setDeletePopup({ type: 'everyone', active: true })}><span><i className="ri-delete-bin-line"></i></span><span>Delete for everyone</span></button></li>
          }
        </ul>
      </div>
      <DeleteConfirmPopup openState={deletePopup.active} deleteType={deletePopup.type} popupRef={popupRef} onClose={() => setDeletePopup({ ...deletePopup, active: false })} messageId={messageId} />
    </>
  )
}

const DeleteConfirmPopup = ({ openState, deleteType, popupRef, onClose, messageId }) => {

  const handleMessageDelete = async () => {
    try {
      if (deleteType === 'only') {
        await axios.get(`/message/del-mes/${messageId}`)
          .then(() => onClose())
      }

      else if (deleteType === 'everyone') {
        await axios.get(`/message/del-mesev/${messageId}`)
          .then(() => onClose())
      }
    } catch (error) {
      // console.error(error);
    }
  }

  return (
    <PopupWraper openState={openState} popupRef={popupRef} >
      <div className="st-conf-popup-body">
        Do you want to delete this message {deleteType === 'only' ? 'from you' : 'from everyone'}?
      </div>
      <div className="st-popup-bottom">
        <button className='st-popup-close-btn' onClick={() => onClose()}>Cancel</button>
        <button className='st-popup-action-btn' onClick={handleMessageDelete} >Delete</button>
      </div>
    </PopupWraper>
  )
}

// Geting date data from ISO string
export const getDateData = (date) => {
  const dateStr = new Date(date).toString()
  const regex = /(\w{3}) (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):\d{2}/;
  const match = dateStr.match(regex);
  if (match) {
    const year = match[4]
    const month = match[2];
    const day = match[3];
    const hours = match[5];
    const minutes = match[6];
    const dateString = `${day} ${month} ${year}`
    const timeString = `${hours}:${minutes}`

    return ({ year, month, day, dateString, hours, minutes, timeString })
  }
}

// convert file size string to 'MB' 'KB' 'GB'
const fileSizeConverter = (fileSize) => {
  let kbSize;
  let mbSize;
  let gbSize;
  let sizeString;
  let byteSize = Number(fileSize)
  sizeString = `${Math.floor(byteSize)} bytes`

  if (byteSize > 1024) {
    kbSize = Math.floor(byteSize / 1024)
    sizeString = `${kbSize} KB`
  }
  if (kbSize > 1024) {
    mbSize = Math.floor(kbSize / 1024)
    sizeString = `${mbSize} MB`
  }
  if (mbSize > 1024) {
    gbSize = Math.floor(mbSize / 1024)
    sizeString = `${gbSize} GB`
  }

  return sizeString

}
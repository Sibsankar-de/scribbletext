import React, { useState, useRef, useEffect, useContext } from 'react'
import "./chatBox.style.css"
import { useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { PopupWraper } from '../popup-box/popup-box';
import axios from '../../server/axios-setup';
import parse from 'html-react-parser';
import { socket } from '../../server/socket.io';
import { toast, ToastContainer } from 'react-toastify';
import Compressor from 'compressorjs';
import { getContextBoxPosition } from '../../utils/context-position';
import { Spinner } from '../../utils/loader-spinner';
import { getDateData } from '../../utils/format-date';
import SocketContext from '../../contexts/SocketContext';
import { defaultStyles, FileIcon } from 'react-file-icon';
import mime from 'mime';

export const ChatBox = () => {
  const navigate = useNavigate()
  // refs 
  const textAreaRef = useRef(null);
  const chatBoxRef = useRef(null);
  const unreadBox = useRef(null);
  // key events
  const handleEsc = (event) => {
    if (window.location.pathname.includes("/chats/")) {
      if (event.key === "Escape") {
        navigate("/home");
      }
    }
  }

  // context menu handlers
  const [contextMenuEvent, setContextMenuEvent] = useState(null)
  const [contextMenuActive, setContextMenuActive] = useState(false);

  // context menu handler
  const handleContextMenu = e => {
    e.preventDefault();
    e.stopPropagation()
    setContextMenuEvent(e)
    setContextMenuActive(true);
  }
  const contextMenuCloseFnc = () => setContextMenuActive(false);


  // emoji box handler
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiBtnClickHandler = e => {
    e.stopPropagation();
    setEmojiOpen(!emojiOpen);
    setFileShareOpen(false)
  }

  // file share handler 
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
  const [fileInput, setFileInput] = useState(null);
  const [fileExtension, setFileExtension] = useState(null);
  useEffect(() => {
    if (fileInput) {
      setFileExtension(mime.getExtension(fileInput.type))
      console.log(fileInput)
    }
  }, [fileInput])

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
  // fetch current user
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        await axios.get('/users/current-user')
          .then(res => {
            setCurrentUser(res?.data?.data)
          })
      } catch (error) {
        console.error(error);
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
      console.log(error);
    }
  })

  // fetch recipient details
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
        console.error(error);
      }
    }
    if (recipientId)
      fetchUser()
  }, [recipientId])

  // check user online or not
  const { onlineUserList } = useContext(SocketContext);
  const [isUserOnline, setIsuserOnline] = useState(false);
  useEffect(() => {
    if (onlineUserList && onlineUserList?.includes(recipientId)) setIsuserOnline(true)
    else setIsuserOnline(false)
  }, [onlineUserList, recipientId]);

  // fetch chat room
  const [messageList, setMessageList] = useState([])
  const [chatData, setChatData] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  // fetch chat room
  const fetchMessageList = async () => {
    try {
      await axios.get(`message/g-croom/${recipientId}`)
        .then((res) => {
          setChatData(res.data?.data)
          setMessageList(res.data?.data?.chatList);
          setChatLoading(false)
        })
    } catch (error) {
      console.error(error);
    }
  }
  useEffect(() => {
    if (recipientId) {
      setChatLoading(true)
      fetchMessageList()
    }
  }, [recipientId])

  // get messages from socket
  useEffect(() => {
    socket.on("messageChange", (data) => {
      if ((data?.senderId === currentUser?._id && data?.recipientId === recipientId) || (data?.senderId === recipientId && data?.recipientId === currentUser?._id)) {
        let list = [...messageList];
        let groupIndex = list.findIndex(e => getDateData(e?.chatDate)?.dateString === getDateData(data?.createdAt)?.dateString);
        let messages = list[groupIndex]?.messages;
        let mesIndex = messages?.findIndex(e => e?.messageId === data?.messageId)
        if (mesIndex === -1 && groupIndex !== -1) {
          messages = [...messages, data];
          list[groupIndex] = { ...list[groupIndex], messages };
          setMessageList(list);
        }
        // edits messages
        else if (mesIndex !== -1 && groupIndex !== -1) {
          messages[mesIndex] = data;
          // removes deleted messages
          if (data?.deletedFromSender) {
            messages = messages?.filter(e => e?._id !== data?._id)
          }
          list[groupIndex] = { ...list[groupIndex], messages };
          // removes the whole element with date flag is messages = 0
          if (data?.deletedFromSender && messages?.length === 0) {
            list = list?.filter(e => e?.chatDate !== list[groupIndex]?.chatDate);
          }
          setMessageList(list);
        }
        else {
          fetchMessageList();
        }
      }
    })
  });

  // handle reply to message
  const [replyMessage, setReplyMessage] = useState(null);
  const handleReply = (message) => {
    setReplyMessage(message)
    textAreaRef.current.focus();
  }

  // Handle message submission
  const [loadSend, setLoadSend] = useState(false)
  const handleSendMessage = async () => {
    textAreaRef.current.focus();
    if (textInput.trim().length > 0 || fileInput) {
      setLoadSend(true);
      const messageId = `stm${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
      const sendingData = {
        messageId: messageId,
        senderId: currentUser?._id,
        recipientId: recipientId,
        content: {
          text: textInput.trim(),
          file: fileInput && {
            original_filename: fileInput?.name,
            bytes: fileInput?.size,
            format: fileExtension
          }
        },
        receiveStatus: 'sending',
        repliedTo: replyMessage,
        sendingTime: new Date().toString()
      }
      // post data to the server
      const formData = new FormData()
      const postData = {
        messageId: messageId,
        text: textInput.trim(),
        recipientId: recipientId,
        file: fileInput,
        repliedTo: JSON.stringify(replyMessage)
      }

      Object.keys(postData).forEach(key => {
        formData.append(key, postData[key]);
      })


      // add message to the list
      let list = [...messageList];
      let groupIndex = list.findIndex(e => getDateData(e?.chatDate)?.dateString === getDateData(new Date().toString())?.dateString);
      if (groupIndex !== -1) {
        let messages = list[groupIndex]?.messages;
        messages = [...messages, sendingData];
        list[groupIndex] = { ...list[groupIndex], messages };
        setMessageList(list);
      } else {
        list = [...list, { chatDate: new Date().toString(), messages: [sendingData] }]
        setMessageList(list);
      }

      // reset the input
      setFileInput(null)
      setReplyMessage(null);
      setTextInput('')
      setLoadSend(false);
      // send message to the server
      try {
        await axios.post('/message/create-message', formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }).then(async (res) => {
          const messageId = res.data?.data?.id;
          // send notification to the recipient
          await axios.post('/message/send-notification', { messageId })
        })

      } catch (error) {
        console.error(error);
      }
    }
  }

  // use key events
  const handleKeyEvents = (event) => {
    const textarea = textAreaRef.current;
    textarea?.focus();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  // Handle Message scroll
  useEffect(() => {
    const container = chatBoxRef.current;
    if (unreadBox && unreadBox.current) {
      container.scrollTop = unreadBox.current.offsetTop - container.offsetTop;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messageList, chatData, recipient]);

  // handle message selection
  const [selectionList, setSelectionList] = useState(null);
  const handleMessageSelect = (id) => {
    if (selectionList && id) {
      setSelectionList([...selectionList, id])
    } else if (id && !selectionList) {
      setSelectionList([id])
    }
    else {
      setSelectionList([])
    }
  }

  // page title
  useEffect(() => {
    document.title = recipient ? `Chat with - ${recipient?.userName}` : 'loading...'
  }, [recipient])

  return (
    <div className='st-chat-box-container' tabIndex={0} onKeyDown={handleEsc}>

      <ChatBoxTopSection recipient={recipient} isUserOnline={isUserOnline} selectionList={selectionList} onEndSelection={() => setSelectionList(null)} onDeleteSelections={() => fetchMessageList()} />

      <section className='st-chat-box-body-section'>
        <div className='st-chat-box-message-box st-chat-box-chat-container st-scrollbar-thin' onContextMenu={handleContextMenu} ref={chatBoxRef}>
          {chatLoading && <div className="st-chat-load-box">Loading chats...</div>}
          {(!chatLoading && messageList?.length === 0) && <div className='st-empty-chat-sgbox'>
            <div>Start chatting with <span className='text-primary c-pointer' onClick={() => textAreaRef?.current.focus()}>@{recipient?.userName}</span></div>
            <div className='st-col-fade st-text-small'>Chats and messages are encrypted and safe</div>
          </div>}
          {!chatLoading &&
            messageList?.map((data, index) => {
              return (
                <div key={index}>
                  <div className='st-flag-para st-col-fade'><span> {getDateData(data?.chatDate)?.dayStr}</span></div>
                  <div className='st-messages-container'>
                    {
                      data?.messages?.map((message, index1) => {
                        const messageFrom = message?.recipientId === recipientId ? 'sender' : 'receiver';
                        return (
                          messageFrom &&
                          <React.Fragment key={index1}>
                            {chatData?.unreadStartId === message?._id && <div className='st-unread-flag mb-2' ref={unreadBox}><div className='st-unread-flag-para'><span>{chatData?.unreadsLength} Unread messages</span></div></div>}
                            <ChatBubble
                              messageFrom={messageFrom}
                              key={"chat" + index1}
                              messageItem={message}
                              messageList={data?.messages}
                              index={index1}
                              currentUser={currentUser}
                              recepient={recipient}
                              onSelect={handleMessageSelect}
                              selectionList={selectionList}
                              onDeselect={id => setSelectionList(selectionList?.filter(e => e !== id))}
                              onReply={handleReply}
                            />
                          </React.Fragment>
                        )
                      })
                    }
                  </div>
                </div>
              )
            })}
        </div>

        <div className='st-chat-box-type-mes-sec-content'>
          <div className='d-flex gap-2 align-items-end'>
            <div>
              <button className='st-mes-input-box-btn' onClick={fileBtnClickHandler}><span><i className="ri-attachment-2"></i></span></button>
              {fileShareOpen && <FileShareBox openState={fileShareOpen} closeFunc={() => setFileShareOpen(false)} onGetFile={e => setFileInput(e[0])} />}
            </div>
          </div>
          <div className='hb-message-input-section'>
            {(replyMessage && !fileInput) && <div className='hb-message-reply-message-box'>
              <div>
                <div className='st-col-lgreen'>{replyMessage?.senderId === currentUser?._id ? "You" : recipient?.userName}</div>
                <div className='st-col-fade st-text-overflow'>{replyMessage?.text || replyMessage?.file?.original_filename}</div>
              </div>
              <div className='st-justify-s-end'>
                <span className='st-col-fade c-pointer' onClick={() => setReplyMessage(null)}><i className="ri-close-circle-fill fs-4"></i></span>
              </div>
            </div>}
            {fileInput &&
              <div className='st-upload-file-show-box-container'>
                <div className='st-file-icon'><FileIcon extension={fileExtension} {...defaultStyles[fileExtension]} /></div>
                <div>
                  <div className='st-file-upload-file-name'>{fileInput.name}</div>
                  <div className='st-col-fade'><span>{fileSizeConverter(fileInput.size)}</span><span><i className="bi bi-dot mx-1"></i></span><span>{fileExtension}</span></div>
                </div>
                <div className='st-justify-s-end'>
                  <span className='st-col-fade c-pointer' onClick={() => setFileInput(null)}><i className="ri-close-circle-fill fs-4"></i></span>
                </div>
              </div>
            }
            <div className='st-mes-input-box'>
              <div>
                <button className='st-mes-input-box-btn' onClick={emojiBtnClickHandler}><span><i className="ri-emoji-sticker-line"></i></span></button>
                {emojiOpen && <ChatEmojiBox openState={emojiOpen} closeFunc={() => setEmojiOpen(false)} onEmojiClick={emoji => setTextInput(textInput + emoji)} />}
              </div>
              <form action="" className='d-flex' onSubmit={handleSendMessage}>
                <textarea type="text" placeholder='Type a message' className='st-mes-type-input st-scrollbar-thin' onChange={(e) => setTextInput(e.target.value)} ref={textAreaRef} value={textInput} disabled={loadSend} onKeyDown={handleKeyEvents} />
              </form>
            </div>
          </div>
          <div>
            <button className='st-mes-input-box-btn st-mes-send-btn' onClick={handleSendMessage} disabled={loadSend} ><span><i className="ri-send-plane-2-fill"></i></span></button>
          </div>
        </div>
      </section>

      {contextMenuActive && <ChatBoxContextMenu event={contextMenuEvent} activeState={contextMenuActive} closeFunc={contextMenuCloseFnc} />}
    </div>
  )
}

const ChatBoxTopSection = ({ recipient, isUserOnline, selectionList, onEndSelection, onDeleteSelections }) => {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const handleDelete = () => {
    onDeleteSelections();
    onEndSelection();
  }
  return (
    <section className='st-chat-box-contact-sec'>
      {selectionList ?
        <div className='st-chat-box-selection-det-box'>
          <div className='d-flex align-items-center gap-2'>
            <div><button className="st-btn" onClick={onEndSelection}><span><i className="ri-close-large-line"></i></span></button></div>
            <div>{selectionList?.length} selected</div>
          </div>
          <div>
            <button className="st-btn st-col-ltred" onClick={() => setIsDeleteOpen(true)}><i className="ri-delete-bin-line fs-5"></i></button>
          </div>
        </div>
        : <div className='st-chat-box-contact-det-box'>
          <div className='st-chat-back-btn-box'>
            <button className="st-chat-back-btn" onClick={() => navigate(-1)} ><i className="ri-arrow-left-line"></i></button>
          </div>
          <div className='st-chat-cont-img-box'>
            <img src={recipient?.avatar || require('../../assets/img/profile-img.png')} alt=" " draggable={false} />
          </div>
          <div>
            <div className='fw-bold'>{recipient?.fullName}</div>
            <div className='st-col-fade st-text-small'>{isUserOnline ? "online" : recipient?.userName}</div>
          </div>
          {!recipient && <div className='st-chat-prof-loading-box'></div>}
        </div>
      }
      <DeleteConfirmPopup openState={isDeleteOpen} deleteType={"many"} onClose={() => setIsDeleteOpen(false)} onDelete={handleDelete} selectionList={selectionList} />
    </section>
  )
}

const ChatBubble = ({ messageFrom, messageItem, messageList, index, currentUser, recepient, onSelect, selectionList, onDeselect, onReply }) => {

  // const handle message
  const [message, setMessage] = useState(null)
  useEffect(() => {
    setMessage(messageItem)
  }, [messageItem])

  // handle message seen
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
    if (message?._id && message?.receiveStatus !== 'seen' && message?.recipientId === currentUser?._id) {
      updateMessageStatus()
    }

  }, [message])

  // handle selection 
  const [isSelected, setIsSelected] = useState(false);
  useEffect(() => {
    if (selectionList?.includes(message?._id)) {
      setIsSelected(true);
    } else {
      setIsSelected(false)
    }
  }, [selectionList])

  const handleSelect = () => {
    if (selectionList !== null) {
      if (!isSelected) {
        onSelect(message?._id);
        setIsSelected(true);
      } else {
        onDeselect(message?._id);
        setIsSelected(false);
      }
    }
  }

  // handle context menue
  const [contextMenuEvent, setContextMenuEvent] = useState(null);
  const [contextMenuActive, setContextMenuActive] = useState(false);

  const handleContextMenu = e => {
    e.preventDefault();
    e.stopPropagation();
    if (selectionList === null) {
      setContextMenuEvent(e)
      setContextMenuActive(true);
    }
  }

  // handles chat bubble tail
  const [chatTail, setChatTail] = useState(true)
  useEffect(() => {
    if (index > 0 && messageList) {
      const ind0 = messageList[Number(index) - 1]
      const ind1 = messageList[Number(index)]
      if (
        (ind0?.senderId === ind1?.senderId || ind0?.recipientId === ind1?.recipientId)) {
        setChatTail(false)
      }
      else {
        setChatTail(true)
      }
    }
  })

  // Changes occurences of text message
  // single emoji occurance
  const [isEmoji, setIsEmoji] = useState(false);
  useEffect(() => {
    function checkEmoji(text) {
      const singleEmojiRegex = /^(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}])$/u;

      return singleEmojiRegex.test(text);
    }
    if (checkEmoji((message?.content?.text))) setIsEmoji(true);
  }, [message]);
  // url occurance
  const handleMessageText = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    return text?.replace(urlPattern, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }

  // handle message time
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

  // chat rpely handler
  const handleReply = () => {
    const repliedMessage = {
      id: message?._id,
      text: message?.content?.text,
      file: message?.content?.file,
      senderId: message?.senderId,
      recipientId: message?.recipientId
    }
    onReply(repliedMessage);
  }

  return (
    <div className={`hb-chat-line ${selectionList ? "hb-chat-selection-open" : ""} ${isSelected ? "hb-chat-line-selected" : ""}`} onClick={handleSelect}>
      <div className={`${messageFrom === 'receiver' ? 'st-receiver-bubble-box' : 'st-sender-bubble-box'} ${!chatTail && 'st-hide-chat-tail'}`} >
        <div className='st-chat-bubble' onContextMenu={handleContextMenu}>
          {message?.repliedTo && <div className='st-chat-bubble-reply-message-box'>
            <div className='st-col-lgreen'>{message?.repliedTo?.senderId === currentUser?._id ? "You" : recepient?.userName}</div>
            <div className='st-col-fade st-text-overflow'>{message?.repliedTo?.text || message?.repliedTo?.file?.original_filename}</div>
          </div>}
          <div className='st-chat-bubble-content-box'>
            {message?.content?.file && <div className='st-chat-bubble-file-box'>
              <div className='st-chat-bubble-file'>
                <div className='st-chat-bubble-file-content'>
                  <div>
                    <button className='st-chat-file-donload-btn' onClick={handleFileDownload} >{message?.content?.file?.url ? <span><i className='ri-download-2-line'></i></span> : <Spinner />}</button>
                  </div>
                  <div className='d-grid'>
                    <div><span className='st-chat-file-name-box'>{message?.content?.file?.original_filename}</span></div>
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
              <pre className='st-chat-bubble-text-message'><span className={isEmoji ? "fs-1" : ""}>{parse(handleMessageText(message?.content?.text) || '')}</span></pre>
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
        </div>
        <ChatBubbleContextMenu event={contextMenuEvent} activeState={contextMenuActive} closeFunc={() => setContextMenuActive(false)} messageFrom={messageFrom} messageId={message?._id} text={message?.content?.text} index={index} onselect={onSelect} fileUrl={message?.content?.file?.url} handleSaveFile={handleFileDownload} onReply={handleReply} />
      </div>
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
        if (fileInput[0].type.includes('image')) {
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
        } else {
          const file = fileInput[0];
          onGetFile([new File([file], fileInput[0].name, {
            type: file.type,
            lastModified: Date.now(),
          })])
        }
        closeFunc()
      } else {
        toast.warn("Maximum accepted file size is 7 Mb")
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

// context menu on the chat box
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
    <div className='st-context-menu st-chat-box-context-menu' style={positionProp} ref={contextMenuRef} onContextMenu={e => e.preventDefault()} >
      <ul>
        <li><button onClick={closeChatHandler}><span><i className="ri-close-line"></i></span><span>Close Chat</span></button></li>
      </ul>

    </div>
  )
}

// context menue on chat bubble
const ChatBubbleContextMenu = ({ activeState, closeFunc, messageFrom, messageId, text, onselect, handleSaveFile, fileUrl, onReply }) => {
  const popupRef = useRef(null)

  // handel delete popup
  const [deletePopup, setDeletePopup] = useState({ type: 'only', active: false })

  // Copy text to clipBoard
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
          .then(() => {
            toast.success("Text copied to clipboard");
            closeFunc()
          })
      }
    } catch (error) {
      toast.error("Unable to copy text")
    }
  }

  // handle message selection
  const handleMessageSelect = (id) => {
    onselect(id);
    closeFunc();
  }

  return (
    <>
      <PopupWraper openState={activeState} onClose={closeFunc} closeOnBackClick>
        <div className='st-context-menu st-chat-bubble-context-menu'>
          <ul>
            <li>
              <button onClick={() => { onReply(); closeFunc() }}><span><i className="ri-reply-line"></i></span><span>Reply</span></button>
            </li>
            <li>
              <button onClick={handleCopyText}><span><i className="ri-file-copy-line"></i></span><span>Copy text</span></button>
            </li>
            {fileUrl && <li>
              <button onClick={() => { handleSaveFile(); closeFunc() }}><span><i className="ri-save-line"></i></span><span>Save file</span></button>
            </li>}
            <li>
              <button onClick={() => handleMessageSelect(messageId)}><span><i className="ri-checkbox-line"></i></span><span>Select message</span></button>
            </li>
            <li>
              <button onClick={() => setDeletePopup({ type: 'only', active: true })} className='st-col-ltred'><span><i className="ri-delete-bin-line"></i></span><span>Delete for me</span></button>
            </li>
            {messageFrom === 'sender' &&
              <li><button onClick={() => setDeletePopup({ type: 'everyone', active: true })} className='st-col-ltred'><span><i className="ri-delete-bin-line"></i></span><span>Delete for everyone</span></button></li>
            }
            <li>
              <button onClick={closeFunc}><span><i className="ri-close-line"></i></span><span>Close</span></button>
            </li>
          </ul>
        </div>
      </PopupWraper>
      <DeleteConfirmPopup openState={deletePopup.active} deleteType={deletePopup.type} onClose={() => setDeletePopup({ ...deletePopup, active: false })} messageId={messageId} onDelete={closeFunc} />
    </>
  )
}

const DeleteConfirmPopup = ({ openState, deleteType, onClose, messageId, onDelete, selectionList }) => {
  const [loading, setLoading] = useState(false);
  const handleMessageDelete = async () => {
    setLoading(true);
    try {
      if (deleteType === 'only') {
        await axios.get(`/message/del-mes/${messageId}`)
      }

      else if (deleteType === 'everyone') {
        await axios.get(`/message/del-mesev/${messageId}`)
      }
      else if (deleteType === "many" && selectionList) {
        console.log(selectionList);
        await axios.post('/message/del-many', { messageList: [...selectionList] })
      }
      onDelete()
      onClose();
      setLoading(false)
    } catch (error) {
      // console.error(error);
      setLoading(false)
    }
  }

  return (
    <PopupWraper openState={openState} closeOnBackClick onClose={onClose}>
      <div className="st-conf-popup-body">
        Do you want to delete {selectionList ? `${selectionList?.length} messages` : `this message ${deleteType === 'only' ? 'from you' : 'from everyone'}`}?
      </div>
      <div className="st-popup-bottom">
        <button className='st-popup-close-btn' onClick={() => onClose()}>Cancel</button>
        <button className='st-popup-action-btn' onClick={handleMessageDelete} disabled={loading}>{loading ? <Spinner /> : <span>Delete</span>}</button>
      </div>
    </PopupWraper>
  )
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
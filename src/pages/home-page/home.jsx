import React from 'react'
import { useEffect } from 'react'
import "./homePage.style.css"

export const Home = () => {

    useEffect(() => {
        document.title = `ScribbleText - start texting efficiently`
    }, [])
    return (
        <div className='st-chat-home-box'>
            <div className='mb-4'><img src={require('../../assets/img/logo.png')} alt="" width={80} draggable={false} /></div>
            <div><h1>ScribbleText</h1></div>
            <div className='st-col-fade'>Start texting in a more efficient way!</div>
        </div>
    )
}

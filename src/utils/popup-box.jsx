import React, { useEffect, useRef, useState } from 'react'

export const PopupWraper = ({ children, className, openState, popupRef, closeOnBack = false, onClose, backClass }) => {
    const [openBox, setOpenBox] = useState(false)
    const [closeAnim, setCloseAnim] = useState(false)

    useEffect(() => {
        if (!openState) {
            setCloseAnim(true);
            setTimeout(() => {
                setOpenBox(false);
                setCloseAnim(false);
            }, 250);

        } else {
            setOpenBox(true)
            setCloseAnim(false)
        }

    }, [openState])

    const boxRef = useRef(null)

    // useEffect(() => {
    //     const handleClose = (e) => {
    //         if (openBox && closeOnBack && !boxRef?.current?.contains(e.target)) {
    //             onClose()
    //         }
    //     }

    //     document.addEventListener('click', handleClose)
    //     return () => document.removeEventListener('click', handleClose)
    // }, [])
    return (
        openBox && <div className={`st-popup-back st-fadein-anim ${backClass} ${closeAnim && 'st-fadeout-anim'}`} ref={popupRef}>
            <div className={`st-popup-box st-scrollbar-thin ${className} ${closeAnim && 'st-popup-out-anim'}`} ref={boxRef}>
                {children}
            </div>
        </div>
    )
}

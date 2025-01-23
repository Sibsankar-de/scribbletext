import React, { useEffect, useRef, useState } from 'react'
import "./popupbox.style.css"

export const PopupWraper = ({ children, className, openState, popupRef, closeOnBackClick = false, onClose, backClass }) => {
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

    useEffect(() => {
        const handleClose = (e) => {
            if (openBox && closeOnBackClick && !boxRef?.current?.contains(e.target) && onClose) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClose)
        return () => document.removeEventListener('mousedown', handleClose)
    })
    return (
        openBox && <div className={`st-popup-back st-fadein-anim ${backClass} ${closeAnim && 'st-fadeout-anim'}`} ref={popupRef}>
            <div className={`st-popup-box st-scrollbar-thin ${className} ${closeAnim && 'st-popup-out-anim'}`} ref={boxRef} onMouseDown={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}

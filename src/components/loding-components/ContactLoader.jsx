import React from 'react'
import "./loading-comps.style.css"

export const ContactLoader = () => {
    const blankArray = new Array(7).fill(undefined);

    return (
        blankArray.map((_, index) => {
            return (
                <div className='st-contactlist-loading-box' key={index}>
                    <div className='st-contactlist-loading-img'></div>
                    <div className='st-contactlist-loading-name'>
                        <div className='line1'></div>
                        <div className='line2'></div>
                    </div>
                </div>
            )
        })
    )
}

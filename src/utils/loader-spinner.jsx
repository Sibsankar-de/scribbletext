import React from 'react'

export const Spinner = ({ width = 20 }) => {
    return (
        <div className='st-loading-spinner' style={{ width: width, height: width }}></div>
    )
}

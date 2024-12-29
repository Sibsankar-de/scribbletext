import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ imageSrc, onCropComplete, className, isCrop}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppedImageFile, setCroppedImageFile] = useState(null);

    const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleShowCroppedImage = useCallback(async () => {
        try {
            const imgFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            setCroppedImageFile(imgFile);
            if (onCropComplete) {
                onCropComplete(imgFile);
            }
        } catch (e) {
            // console.error(e);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete]);

    useEffect(() => {
        if (isCrop) {
            handleShowCroppedImage();
        }
    })

    return (
        <div className={`${className}`}>
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

function getCroppedImg(imageSrc, crop) {
    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                blob.name = 'cropped.jpg';
                const fileUrl = URL.createObjectURL(blob);
                // console.log(blob);
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    return getCroppedImg(imageSrc, crop);
}

export default ImageCropper;
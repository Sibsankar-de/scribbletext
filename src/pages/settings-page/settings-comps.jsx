import React from 'react'
import "./settings.style.css"
import axios from '../../server/axios-setup.js'
import { useEffect } from 'react'
import { useRef } from 'react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import ImageCropper from '../../utils/image-cropper'
import { PopupWraper } from '../../components/popup-box/popup-box.jsx'
import Cookies from "js-cookie"
import { toast, ToastContainer } from "react-toastify"
import { Spinner } from '../../utils/loader-spinner.jsx'
import Compressor from 'compressorjs'
import { useCurrentUser } from '../../hooks/get-currentuser.js'

export const Settings = () => {
    const user = useCurrentUser();
    return (
        <div className='st-settings-content-box'>
            <section className='st-settings-nav-sec'>
                <div className='d-grid gap-2'>
                    <div>
                        <NavLink to='profile' className='st-settings-nav-link'>
                            <div className='st-settings-nav-opt-active-bar'></div>
                            <div className='d-flex align-items-center gap-3'>
                                <span><img src={user?.avatar || require('../../assets/img/profile-img.png')} alt="" /></span>
                                <span>Profile</span>
                            </div>

                        </NavLink>
                    </div>
                    <div>
                        <NavLink to='privacy' className='st-settings-nav-link'>
                            <div className='st-settings-nav-opt-active-bar'></div>
                            <div className='d-flex align-items-center gap-3'>
                                <span><i className="ri-shield-keyhole-line fs-5"></i></span>
                                <span>Privacy</span>
                            </div>
                        </NavLink>
                    </div>
                </div>
            </section>
            <section>
                <Outlet />
            </section>
        </div>
    )
}

export const ProfileSettings = () => {
    const [editProfile, setEditProfile] = useState(false)
    const [openUpdatePassword, setOpenUpdatePassword] = useState(false)
    const [logoutPopup, setLogoutPopup] = useState(false)
    const [profChangeState, setProfChangeState] = useState(false)

    const [user, setUser] = useState(null)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                await axios.get('/users/current-user')
                    .then((res) => {
                        setUser(res.data?.data)
                    })
            } catch (error) {
                // console.error(error);
            }
        }
        fetchUser()
    }, [profChangeState])

    useEffect(() => {
        document.title = user?.userName ? `ScribbleText - ${user?.userName}` : 'loading...'
    }, [user])

    // check notification permission
    const [isNotificationAllowed, setIsNotificationAllowed] = useState(false);
    useEffect(() => {
        const checkNotificationPermission = async () => {
            try {
                if (Notification.permission === 'granted') {
                    setIsNotificationAllowed(true)
                }
            } catch (error) {
                console.error(error);
            }
        }
        checkNotificationPermission()
    }, [])

    // take notification permission
    const takeNotificationPermission = async () => {
        try {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
                if (Notification.permission === 'granted') {
                    setIsNotificationAllowed(true)
                }
            }
            if (Notification.permission === 'denied') {
                toast.warn("Notification permission denied! Please go to browser settings and allow notification.")
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className='st-setting-outlet-box st-scrollbar-thin'>
            <section className='mb-4'>
                <div>
                    <h4 className='mb-3'>Profile</h4>
                </div>

            </section>
            <section className='st-setttings-user-details-sec'>
                <div className='st-settings-profile-img-box'>
                    <img src={user?.avatar || require('../../assets/img/profile-img.png')} alt="" draggable={false} />
                    <div className='st-settings-prof-img-edit-btn' title='Change' onClick={() => setEditProfile(true)} ><span><i className="ri-pencil-line"></i></span></div>
                </div>
                <div>
                    <div className='fw-bold fs-5'>{user?.fullName}</div>
                    <div className='st-col-fade'>{user?.userName}</div>
                    {!user && <div className='st-chat-prof-loading-box'></div>}
                </div>
            </section>
            <section>
                <div>
                    <button className='st-btn' onClick={() => setEditProfile(true)}><span><i className='ri-pencil-fill'></i></span><span>Edit profile</span></button>
                </div>
                {!isNotificationAllowed && <div className='mt-3'>
                    <button className='st-btn' onClick={takeNotificationPermission}><span><i className="ri-notification-line"></i></span><span>Allow notification</span></button>
                </div>}
                <div className='mt-3'>
                    <button className='st-btn text-success' onClick={() => setOpenUpdatePassword(true)}><span><i className='ri-key-fill'></i></span><span>Change Password</span></button>
                </div>
                <div className='st-privacy-read-btn'><Link to="/settings/privacy"><span><i className="ri-article-line mx-2"></i></span><span>Read privacy terms</span></Link></div>
            </section>
            <section className='align-self-end'>
                <button className='st-btn st-col-ltred mt-3' onClick={() => setLogoutPopup(true)}><span><i className="ri-logout-box-line"></i> Log out</span></button>
            </section>
            <EditProfilePopup openState={editProfile} onClose={() => setEditProfile(false)} user={user} onProfileChange={() => setProfChangeState(!profChangeState)} />
            <ChangePasswordPopup openState={openUpdatePassword} onClose={() => setOpenUpdatePassword(false)} />
            <LogoutPopup openState={logoutPopup} onClose={() => setLogoutPopup(false)} />

        </div>
    )
}

const EditProfilePopup = ({ openState, onClose, user, onProfileChange }) => {
    const [openCropUp, setOpenCropUp] = useState(false);
    const initImg = require('../../assets/img/profile-img.png')
    const [inputImg, setInputImg] = useState(null);
    const [profImg, setProfImg] = useState(initImg)
    const [croppedFile, setCroppedFile] = useState(null)

    useEffect(() => {
        setProfImg(user?.avatar || initImg)
    }, [user])

    const handleImgInput = async e => {
        let img = e.target?.files[0]
        const imgURI = await URL.createObjectURL(img)
        setInputImg(imgURI)
        if (imgURI) {
            setOpenCropUp(true)
        }
    }

    const handleCroppedImg = (file) => {
        if (file) {
            setProfImg(URL.createObjectURL(file))
            setCroppedFile(file)
        }
    }

    // user Name change handlers
    const [userInput, setUserInput] = useState('');
    const [userAvailable, setUserAvailable] = useState(true)

    useEffect(() => {
        setUserInput(user?.userName)
    }, [user])

    const userNameChangeHandler = e => {
        const input = e.target.value
        if (input.length <= 25) {
            setUserInput(input)
        }
    }

    const handleImgRemove = async () => {
        if (user?.avatar) {
            try {
                await axios.patch('/users/remove-avatar')
                    .then(() => setProfImg(initImg))
            } catch (error) {
                // console.error(error);
            }
        }
        else {
            setProfImg(initImg)
        }
    }

    useEffect(() => {
        const fetchUserList = async () => {
            try {
                const list = await axios.get(`/users/userlist`)

                if (list?.data?.data?.some(item => (item?.userName === userInput && item?.userName !== user?.userName))) {
                    setUserAvailable(false)
                } else {
                    setUserAvailable(true)
                }
            } catch (error) {
                // console.error(error);
            }
        }
        fetchUserList()
    }, [userInput])

    //Submit change handler
    const [loading, setLoading] = useState(false)
    const handleChangeSubmit = async () => {
        const formData = new FormData()
        try {
            if (croppedFile) {
                setLoading(true)
                formData.append('avatar', croppedFile)
                await axios.patch('/users/update-avatar', formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                })
                    .then(() => setLoading(false))
            }
            if (userInput && userAvailable) {
                setLoading(true)
                await axios.patch('/users/update-username', { userName: userInput }, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                    .then(() => setLoading(false))
            }
            onClose();
            onProfileChange()
        }
        catch (error) {
            setLoading(false)
            toast.error("Unable to update Profile")
        }
    }


    return (
        <>
            <PopupWraper openState={openState} className='st-edit-prof-popup-box' backClass={'st-res-set-back'} >
                <div className="st-popup-head st-falign-prop">
                    <div className='st-chat-back-btn-box'>
                        <button className="st-chat-back-btn" onClick={() => onClose()} ><i className="ri-arrow-left-line"></i></button>
                    </div>
                    <h5>Edit profile</h5>
                </div>
                <div className="st-popup-body st-profile-update-pup-body">
                    <section className='st-edit-profile-img-box'>
                        <div><img src={profImg} alt=" " draggable={false} /></div>
                        <div className='st-profile-img-edit-btn-box'>
                            <label htmlFor="st-profile-input">
                                <div className='st-prof-img-edit-btn'><span ><i className="ri-camera-line"></i></span></div>
                                <input type="file" accept='image/*' id='st-profile-input' onChange={handleImgInput} />
                            </label>
                            {!profImg === initImg && <button title='remove image' className='st-prof-img-edit-btn' onClick={handleImgRemove}><i className="ri-delete-bin-line"></i></button>}
                        </div>
                    </section>
                    <section className='mt-4'>
                        <div className='mb-2'><span>Change username</span></div>
                        <div className='d-grid'>
                            <input type="text" className='st-text-input st-text-limit-input' placeholder='Enter user name' autoFocus onChange={userNameChangeHandler} value={userInput} spellCheck={false} />
                            <div className='st-limit-count-box'>{userInput?.length}/25</div>
                        </div>
                        <div className='st-col-fade st-text-small mt-2 px-2'>
                            {userAvailable ?
                                <span><i className="ri-information-2-line"></i> <span>Username must have to be unique</span></span> :
                                <span className='st-col-ltred'><i className="ri-information-2-line"></i> <span>Username already taken</span></span>}
                        </div>
                    </section>
                </div>
                <div className="st-popup-bottom mt-3">
                    <button className='st-popup-close-btn' onClick={() => onClose()}>Close</button>
                    <button className='st-popup-action-btn' onClick={handleChangeSubmit} disabled={loading} >{loading ? <Spinner /> : "Save changes"}</button>
                </div>
                <CropImagePopup openState={openCropUp} imgSrc={inputImg} onClose={() => setOpenCropUp(false)} onCrop={handleCroppedImg} />
            </PopupWraper>
        </>
    )
}

// crop image in 1:1 ratio
const CropImagePopup = ({ openState, imgSrc, onClose, onCrop }) => {
    const [isCrop, setIsCrop] = useState(false)
    const [croppedImgFile, setCroppedImgFile] = useState(null)
    const handleCropClick = () => {
        setIsCrop(true)
    }
    useEffect(() => {
        const getImgFile = async () => {
            try {
                new Compressor(croppedImgFile, {
                    quality: 0.8,
                    success(file) {
                        const compressedFile = new File([file], croppedImgFile.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        })
                        onCrop(compressedFile)
                    }
                })
            } catch (error) {
                // console.log(error);
            }

            onClose()
            setIsCrop(false)
            setCroppedImgFile(null)
        }

        if (isCrop && croppedImgFile) {
            getImgFile()
        }
    }, [croppedImgFile])

    return (
        <PopupWraper openState={openState} className='st-crop-profile-img-popup' backClass={'st-res-set-back'} >
            <div className="st-popup-body st-prof-crop-img-box">
                <ImageCropper
                    imageSrc={imgSrc}
                    className='st-profile-img-crop-box'
                    onCropComplete={(file) => setCroppedImgFile(file)}
                    isCrop={isCrop}
                />
            </div>
            <div className="st-popup-bottom mt-3">
                <button className='st-popup-close-btn' onClick={() => onClose()}>Cancel</button>
                <button className='st-popup-action-btn' onClick={handleCropClick} >Crop</button>
            </div>
        </PopupWraper>
    )
}

// passsword change popup
const ChangePasswordPopup = ({ openState, onClose }) => {
    const [passwordInput, setPasswordInput] = useState({ oldPassword: '', newPassword: '' })
    const [showPassword, setShowPassword] = useState({ oldPassword: false, newPassword: false })
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async () => {
        if (passwordInput.newPassword.length >= 8 && passwordInput.oldPassword) {
            const postData = {
                oldPassword: passwordInput.oldPassword,
                newPassword: passwordInput.newPassword,
            }
            try {
                setLoading(true)
                await axios.patch('/users/update-password', postData)
                    .then(() => {
                        toast.success("Password updated")
                        onClose()
                    })
            } catch (error) {
                setLoading(false);
                if (error?.response?.status === 401) {
                    toast.error("Old password is incorrect!")
                }
                else {
                    toast.error("Unable to upadte password")
                }
            }
        }
        else if (passwordInput.newPassword.length < 8) {
            toast.error("Minimum password length must be 8")
        }
        else if (!passwordInput.oldPassword) {
            toast.error("Old password is required")
        }
        setLoading(false);
    }

    return (
        <PopupWraper openState={openState} className='st-password-change-popup-box' backClass={'st-res-set-back'}>
            <div className="st-popup-head st-falign-prop" >
                <div className='st-chat-back-btn-box'>
                    <button className="st-chat-back-btn" onClick={() => onClose()} ><i className="ri-arrow-left-line"></i></button>
                </div>
                <h5>Update password</h5>
            </div>
            <div className="st-popup-body">
                <div className='st-password-change-popup-body-cont'>
                    <div className='mb-4 d-grid'>
                        <input type={`${showPassword.oldPassword ? 'text' : 'password'}`} className='st-text-input st-text-limit-input' placeholder='Enter old password' autoFocus onChange={e => setPasswordInput({ ...passwordInput, oldPassword: e.target.value })} />
                        <div htmlFor='log-password-input' className='st-show-passsword-btn st-col-fade' onClick={() => setShowPassword({ ...showPassword, oldPassword: !showPassword.oldPassword })}>
                            {!showPassword.oldPassword ?
                                <i className="ri-eye-line"></i> :
                                <i className="ri-eye-off-line"></i>
                            }
                        </div>
                    </div>
                    <div className='mb-4 d-grid'>
                        <input type={`${showPassword.newPassword ? 'text' : 'password'}`} className='st-text-input st-text-limit-input' placeholder='Enter new password' onChange={e => setPasswordInput({ ...passwordInput, newPassword: e.target.value })} />
                        <div htmlFor='log-password-input' className='st-show-passsword-btn st-col-fade' onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}>
                            {!showPassword.newPassword ?
                                <i className="ri-eye-line"></i> :
                                <i className="ri-eye-off-line"></i>
                            }
                        </div>
                    </div>
                    <div>
                        <p className='st-col-fade'><span><i className="ri-information-2-line"></i></span> <span>Use combination of letters, numbers and special characters for additional security </span></p>
                    </div>
                </div>
            </div>
            <div className="st-popup-bottom">
                <button className='st-popup-close-btn' onClick={() => onClose()}>Cancel</button>
                <button className='st-popup-action-btn' onClick={handlePasswordChange} >{loading ? <Spinner /> : "Change password"}</button>
            </div>
        </PopupWraper>
    )
}

// logout popup
const LogoutPopup = ({ openState, onClose }) => {
    const [loading, setLoading] = useState(false);
    const handleLogout = async () => {
        try {
            setLoading(true)
            await axios.get(`/users/logout-user`)
                .then(() => {
                    Cookies.remove('__access_str')
                    window.location.reload()
                })
        } catch (error) {
            // console.log(error);
        }
        setLoading(false);
    }

    return (
        <PopupWraper openState={openState}>
            <div className='st-conf-popup-body'>
                Are you sure you want to Log out?
            </div>
            <div className='st-popup-bottom'>
                <button className='st-popup-close-btn' onClick={() => onClose()} >Cancel</button>
                <button className='st-popup-danger-action-btn' onClick={handleLogout} disabled={loading}>{loading ? <Spinner /> : <span><i className="ri-logout-box-line"></i> Log out</span>}</button>
            </div>
        </PopupWraper>
    )
}


// privacy settings page
export const PrivacySettings = () => {
    const navigate = useNavigate()

    useEffect(() => {
        document.title = 'ScribbleText - privacy policy'
    }, [])
    return (
        <div className='st-setting-outlet-box st-scrollbar-thin'>
            <div className='st-privacy-policy-box'>
                <div className='mb-4 st-falign-prop'>
                    <div className='st-chat-back-btn-box'>
                        <button className="st-chat-back-btn" onClick={() => navigate(-1)} ><i className="ri-arrow-left-line"></i></button>
                    </div>
                    <h4 className='mb-0'>Privacy Terms</h4>
                </div>
                <div>
                    <div className='mb-5'>
                        <h5>1. Introduction</h5>
                        <div>Welcome to ScribbleText ("we," "our," "us"). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our messaging services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</div>
                    </div>
                    <div className='mb-5'>
                        <h5>2. Information we collect</h5>
                        <div>
                            <div className='mb-3'>
                                <h6>2.1 Personal Data</h6>
                                <div>
                                    We may collect personally identifiable information that you provide to us, such as your name, email address, phone number, and any other details you include when you register, log in, or communicate through our services.
                                </div>
                            </div>
                            <div className='mb-3'>
                                <h6>2.2 Usage Data</h6>
                                <div>
                                    We automatically collect certain information when you visit, use, or navigate the website. This may include your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the website.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='mb-5'>
                        <h5>3. How We Use Your Information</h5>
                        <div>
                            <ul className='st-privacy-list'>
                                <li>To provide, operate, and maintain our website and services</li>
                                <li>To improve, personalize, and expand our website and services</li>
                                <li>To understand and analyze how you use our website and services</li>
                                <li>To develop new products, services, features, and functionality</li>
                                <li>To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
                                <li>To find and prevent fraud</li>
                            </ul>
                        </div>
                    </div>

                    <div className='mb-5'>
                        <h5>4. Security of Your Information</h5>
                        <div>
                            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                        </div>
                    </div>

                    <div className='mb-5'>
                        <h5>5. Your Data Protection Rights</h5>
                        <div>
                            <ul className='st-privacy-list'>
                                <li>The right to access – You have the right to request copies of your personal data.</li>
                                <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
                                <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
                                <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                                <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
                                <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
                            </ul>
                        </div>
                    </div>

                    <div className='mb-5'>
                        <h5>6. Children's Privacy</h5>
                        <div>
                            Our website and services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under age 13 without verification of parental consent, we will take steps to remove that information from our servers.
                        </div>
                    </div>

                    <div className='mb-5'>
                        <h5>7. Changes to This Privacy Policy</h5>
                        <div>
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                        </div>
                    </div>
                    <div className='st-col-fade'>
                        All rights are reserved &copy;scribbleText 2024
                    </div>
                </div>
            </div>
        </div>
    )
}

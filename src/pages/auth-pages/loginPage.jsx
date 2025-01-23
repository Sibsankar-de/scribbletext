import React, { useEffect, useState } from 'react'
import "./loginPage.style.css"
import { Link, Outlet } from 'react-router-dom'
import { toast } from 'react-toastify';
import axios from '../../server/axios-setup'


export const AuthenticationPage = () => {
    return (
        <main className='st-auth-container'>
            <div className='st-log-box-back'>
                <Outlet />
            </div>
        </main>
    )
}

export const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [logInput, setLogInput] = useState({ userName: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if ([logInput.password, logInput.userName].some(e => e !== '')) {
            setLoading(true)
            try {
                const postData = {
                    userName: logInput.userName,
                    password: logInput.password
                }

                await axios.post(`/users/login-user`, postData, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
                )
                    .then((res) => {
                        setLoading(false)
                        if (res.status === 200) window.location.reload()
                    })

            } catch (error) {
                setLoading(false)
                if (error.response?.status === 401) {
                    toast.error("Invalid user credentials")
                } else {
                    toast.error("Unable to log in")
                }
            }
        } else { toast.error("Username and password is required") }
    }

    // key events
    const handleEnter = event => {
        const form = event.target.form;
        if (form) {
            if (event.key === "Enter") {
                event.preventDefault();
                const currentInput = document.activeElement;

                const inputs = Array.from(form.querySelectorAll("input"));
                let currentIndex = inputs.indexOf(currentInput);
                if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    handleLogin();
                }
            }
        }
    }

    useEffect(() => {
        document.title = 'ScribbleText - Log in'
    }, [])

    return (
        <div className='st-log-box st-fadein-anim'>
            <div className='st-log-box-head text-center'>
                <h4>ScribbleText</h4>
                <p className='st-col-fade'>Start texting in a new way</p>
            </div>
            <div className="st-log-box-body st-login-box-body">
                <form action="" onKeyDown={handleEnter}>
                    <div className='mb-4'>
                        <input type="text" className='st-text-input' placeholder='Enter Username' autoFocus onChange={(e) => setLogInput({ ...logInput, userName: e.target.value })} autoComplete='username' />
                    </div>
                    <div className='mb-3 d-grid'>
                        <input type={`${showPassword ? 'text' : 'password'}`} className='st-text-input st-text-limit-input' placeholder='Enter password' id='log-password-input' onChange={(e) => setLogInput({ ...logInput, password: e.target.value })} autoComplete='current-password' />

                        <div htmlFor='log-password-input' className='st-show-passsword-btn st-col-fade' onClick={() => setShowPassword(!showPassword)}>
                            {!showPassword ?
                                <i className="ri-eye-line"></i> :
                                <i className="ri-eye-off-line"></i>
                            }
                        </div>
                    </div>
                    <div ><Link to="/auth/signup">Create new account?</Link></div>
                </form>
            </div>
            <div className="st-log-box-bottom">
                <button className='st-log-action-btn' onClick={handleLogin} disabled={loading}>{loading ? "Loging..." : "Login"}</button>
            </div>
        </div>
    )
}

export const RegistrationPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [logInput, setLogInput] = useState({ fullName: '', userName: '', password: '' });
    const [loading, setLoading] = useState(false);

    const inputChangeHandler = (field, e) => {
        const input = e.target.value;
        if (input.length <= 25) {
            setLogInput({ ...logInput, [field]: input })
        }
    }

    // Checks user avaibility
    const [userAvailabe, setUserAvailable] = useState(true)
    useEffect(() => {
        const fetchUserList = async () => {
            try {
                const list = await axios.get(`/users/userlist`)

                if (list?.data?.data?.some(item => item?.userName === logInput.userName)) {
                    setUserAvailable(false)
                } else {
                    setUserAvailable(true)
                }
            } catch (error) {
                // console.error(error);
            }
        }
        fetchUserList()
    }, [logInput.userName])


    const handleCreateAccount = async () => {
        if ([logInput.password, logInput.userName, logInput.fullName].some(e => e !== '') && userAvailabe && logInput.password?.length >= 8) {
            setLoading(true)
            try {
                const postData = {
                    fullName: logInput.fullName,
                    userName: logInput.userName,
                    password: logInput.password
                }

                await axios.post(`/users/register-user`, postData)
                    .then((response) => {
                        loginUser()
                    })

            } catch (error) {
                setLoading(false)
                toast.error("Unable to Create account");
            }
        }
        else if (logInput.password?.length < 8) {
            toast.error("Minimum password length is 8 ")
        }
        else { toast.error("Enter fields corectly") }
    }

    const loginUser = async () => {
        try {
            const postData = {
                userName: logInput.userName,
                password: logInput.password
            }

            await axios.post(`/users/login-user`, postData, {
                headers: {
                    "Content-Type": "application/json"
                }
            }
            )
                .then((res) => {
                    setLoading(false)
                    if (res.status === 200) window.location.reload()
                })

        } catch (error) {
            setLoading(false)
            // console.error(error);
        }
    }

    // key events
    const handleEnter = event => {
        const form = event.target.form;
        if (form) {
            if (event.key === "Enter") {
                event.preventDefault();
                const currentInput = document.activeElement;

                const inputs = Array.from(form.querySelectorAll("input"));
                let currentIndex = inputs.indexOf(currentInput);
                if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    handleCreateAccount();
                }
            }
        }
    }

    useEffect(() => {
        document.title = 'ScribbleText - new registration'
    }, [])

    return (
        <div className='st-log-box  st-fadein-anim'>
            <div className='st-log-box-head text-center'>
                <h5>Create new account</h5>
            </div>
            <div className="st-log-box-body st-login-box-body">
                <form action="" onKeyDown={handleEnter}>
                    <div className='mb-4'>
                        <div className='d-grid'>
                            <input type="text" className='st-text-input st-text-limit-input' placeholder='Enter Full name' onChange={(e) => inputChangeHandler('fullName', e)} value={logInput.fullName} />
                            <div className='st-limit-count-box'>{logInput.fullName.length}/25</div>
                        </div>
                    </div>
                    <div className='mb-4'>
                        <div className='d-grid'>
                            <input type="text" className='st-text-input st-text-limit-input' placeholder='Enter User name' onChange={(e) => inputChangeHandler('userName', e)} value={logInput.userName} />
                            <div className='st-limit-count-box'>{logInput.userName?.length}/25</div>
                        </div>
                        <div className='st-col-fade st-text-small mt-1'>
                            {userAvailabe ? <span><i className="ri-information-2-line"></i> <span>Username must be unique</span></span> :
                                <span className='st-col-ltred'><i className="ri-information-2-line "></i> <span>Username already taken</span></span>
                            }
                        </div>
                    </div>
                    <div className='mb-3 d-grid'>
                        <input type={`${showPassword ? 'text' : 'password'}`} className='st-text-input st-text-limit-input' placeholder='Create password' id='log-password-input' onChange={(e) => setLogInput({ ...logInput, password: e.target.value })} />

                        <div htmlFor='log-password-input' className='st-show-passsword-btn st-col-fade' onClick={() => setShowPassword(!showPassword)}>
                            {!showPassword ?
                                <i className="ri-eye-line"></i> :
                                <i className="ri-eye-off-line"></i>
                            }
                        </div>

                    </div>
                    <div className='st-col-fade st-text-small mt-1'><span><i className="ri-information-2-line"></i></span> <span>Use combination of letters, numbers and special characters for strong password</span></div>
                    <div className='mt-3'><span>Already have an account?</span> <Link to="/login" className='st-login-a' >Log in</Link></div>
                </form>
            </div>
            <div className="st-log-box-bottom">
                <button className='st-log-action-btn' onClick={handleCreateAccount} disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
            </div>
        </div>
    )
}

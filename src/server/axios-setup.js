import axios from "axios";
import { toast } from "react-toastify";

const apiUri = `${process.env.REACT_APP_API_URI}/api/v1`

const axiosInstance = axios.create({
    baseURL: apiUri,
    withCredentials: true
})

axiosInstance.interceptors.response.use(
    response => { return response },
    async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                await axios.get(`${apiUri}/users/refresh-token`, {}, {
                    withCredentials: true,
                })
                    .catch(err => {
                        // console.log(err)
                    })

                return axiosInstance(originalRequest);
            } catch (e) {
                // Handle token refresh failure
                console.error('Refresh token failed', e);
                await axios.get(`${apiUri}/users/logout-user`)
            }
        }
        else if (!error.response) {
            // console.log("Server error - ", error)
            toast.error("Connection with server failed ")
        }
        return Promise.reject(error);
    }
)

export default axiosInstance
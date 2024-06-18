import axios from "axios";

const apiUri = process.env.REACT_APP_API_URI

const axiosInstance = axios.create({
    baseURL: apiUri,
    withCredentials: true
})

export default axiosInstance
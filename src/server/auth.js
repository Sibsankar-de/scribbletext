import Cookies from "js-cookie"

export const getAccessToken = () => {
    try {
        const token = Cookies.get('__access_str');
        return token;

    } catch (error) {
        console.log(error);
    }
}

export const getRefreshToken = () => {
    const token = Cookies.get('refreshToken')
    return token;
}
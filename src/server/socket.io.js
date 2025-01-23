import io from "socket.io-client"

const apiUri = process.env.REACT_APP_API_URI

export const socket = io(apiUri)

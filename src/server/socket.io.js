import io from "socket.io-client"

const apiUri = process.env.REACT_APP_API_URI
const domain = apiUri?.replace('/api/v1', '')

export const socket = io.connect(domain)
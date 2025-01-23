import React, { useEffect, useState } from 'react'
import axios from '../server/axios-setup';

export const useCurrentUser = () => {
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                await axios.get("/users/current-user")
                    .then(res => setCurrentUser(res?.data?.data))
            } catch (error) {
                console.error(error);

            }
        }
        fetchUser();
    }, []);

    return currentUser;
}

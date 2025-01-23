import React from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav, HeaderNav, SideNav } from '../../components/navbar/navbar'

export const MainContainer = () => {
    return (
        <>
            <header>
                <HeaderNav />
            </header>
            <main className='d-flex'>
                <SideNav />
                <BottomNav />
                <Outlet />
            </main>
        </>
    )
}

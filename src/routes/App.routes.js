import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PreAuthRoute } from './PreAuth.routes'
import { PrivateRoute } from './Private.routes'
import { AuthenticationPage, LoginPage, RegistrationPage } from '../pages/auth-pages/loginPage'
import { MainContainer } from '../pages/main-page/MainContainer'
import { ChatContactBox } from '../components/chat-contact/chatContacts'
import { Home } from '../pages/home-page/home'
import { ChatBox } from '../components/chat-box/chatBox'
import { StatusContactList } from '../pages/status-page/statusBox'
import { ArchivesBox } from '../pages/archive-page/archivesBox'
import { PrivacySettings, ProfileSettings, Settings } from '../pages/settings-page/settings-comps'


export const AppRoutes = () => {
    return (
        <>
            <Routes>
                {/* login routes  */}
                <Route path='/auth' element={<PreAuthRoute children={<AuthenticationPage />} />}>
                    <Route path='/auth' element={<Navigate to={'login'} />} />
                    <Route path={'login'} element={<LoginPage />} />
                    <Route path={'signup'} element={<RegistrationPage />} />
                </Route>
                {/* secured routes  */}
                <Route path='/' element={<PrivateRoute children={<MainContainer />} />}>
                    <Route path='/' element={<Navigate to={'/home'} />} />
                    <Route path='/home' element={<ChatContactBox />}>
                        <Route path='/home' element={<Navigate to={'/home/start'} />} />
                        <Route path='start' element={<Home />} />
                        <Route path='chats/:userId' element={<ChatBox />} />
                    </Route>
                    <Route path='status' element={<StatusContactList />}></Route>
                    <Route path='/archives' element={<ArchivesBox />}>
                        <Route path='/archives' element={<Navigate to={'/archives/start'} />} />
                        <Route path='start' element={<Home />} />
                        <Route path='chats/:userId' element={<ChatBox />} />
                    </Route>
                    <Route path='settings' element={<Settings />}>
                        <Route path='/settings' element={<Navigate to={'profile'} />} />
                        <Route path='profile' element={<ProfileSettings />} />
                        <Route path='privacy' element={<PrivacySettings />} />
                    </Route>
                </Route>
                {/* invalid route  */}
                <Route path='*' element={<Navigate to={'/'} />} />
            </Routes>
        </>
    )
}

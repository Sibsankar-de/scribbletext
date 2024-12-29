
import './App.css';
import './css/navbar.style.css';
import './css/chatContactBox.style.css';
import './css/chatBox.style.css';
import './css/statusBox.style.css';
import './css/settings.style.css';
import './css/loginPage.style.css';
import './css/root.css';
import './css/utils.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'remixicon/fonts/remixicon.css';
import 'react-toastify/dist/ReactToastify.css';

import { BottomNav, HeaderNav, SideNav } from './components/navbar';
import { ChatContactBox } from './components/chatContacts';
import { ChatBox } from './components/chatBox';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './components/home';
import { StatusContactList } from './components/statusBox';
import { ArchivesBox } from './components/archivesBox';
import { PrivacySettings, ProfileSettings, Settings } from './components/settings-comps';
import { LoginPage, RegistrationPage } from './components/loginPage';
import { getAccessToken } from './server/auth';
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const accessToken = getAccessToken()
  return (
    !accessToken ?
      <>
        <main className='st-login-box-main'>
          <div className='st-log-box-back'>
            <Routes>
              <Route path='/' element={<Navigate to={'login'} />} />
              <Route path={'login'} element={<LoginPage />} />
              <Route path={'signup'} element={<RegistrationPage />} />
              <Route path='*' element={<Navigate to={'/'} />} />
            </Routes>
          </div>
        </main>
      </>
      :
      <>
        <header>
          <HeaderNav />
        </header>
        <main className='d-flex'>
          <SideNav />
          <BottomNav />
          <Routes>
            <Route path='/' element={<ChatContactBox />}>
              <Route path='/' element={<Navigate to={'/home/start'} />} />
            </Route>
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
            <Route path='*' element={<Navigate to={'/'} />} />
          </Routes>
        </main>
      </>
  )
}

export default App;

import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Group from './pages/Group'
import Member from './pages/Member'
import Badges from './pages/Badges'
import Settings from './pages/Settings'
import Join from './pages/Join'
import DevPreview from './pages/DevPreview'
import DevMascots from './pages/DevMascots'

export default function App() {
  return (
    <Routes>
      {import.meta.env.DEV && <Route path="/dev" element={<DevPreview />} />}
      {import.meta.env.DEV && <Route path="/dev/mascot" element={<DevMascots />} />}
      <Route path="/join/:code" element={<Join />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="group" element={<Group />} />
        <Route path="group/:groupId" element={<Group />} />
        <Route path="group/:groupId/member/:userId" element={<Member />} />
        <Route path="badges" element={<Badges />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<div className="spinner">Page not found.</div>} />
      </Route>
    </Routes>
  )
}

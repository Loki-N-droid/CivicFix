import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ReportIssuePage from './pages/ReportIssuePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/report" replace />} />
        <Route path="/report" element={<ReportIssuePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

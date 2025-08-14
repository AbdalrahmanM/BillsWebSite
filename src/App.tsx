import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import MockPayment from './pages/MockPayment';
import AdsPage from './pages/Ads';
import AnnouncementPage from './pages/Announcement';
const BillsPageLazy = React.lazy(() => import('./pages/BillsPage'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
  <Route path="/home" element={<Home />} />
        <Route
          path="/bills/:service"
          element={
            <React.Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center px-6">
                  <div className="w-full max-w-md">
                    <div className="bh-progress">
                      <div className="bh-progress__bar" />
                      <div className="bh-progress__bar--alt" />
                    </div>
                  </div>
                </div>
              }
            >
              <BillsPageLazy />
            </React.Suspense>
          }
        />
  <Route path="/pay" element={<MockPayment />} />
  <Route path="/ads" element={<AdsPage />} />
  <Route path="/announcement" element={<AnnouncementPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

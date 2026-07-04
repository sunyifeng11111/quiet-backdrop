import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { lazy, Suspense } from 'react';
import { GalleryPage } from './pages/GalleryPage';

const EditorPage = lazy(() => import('./pages/EditorPage').then((module) => ({ default: module.EditorPage })));
const SharePage = lazy(() => import('./pages/SharePage').then((module) => ({ default: module.SharePage })));

export default function App() {
  return (
    <Tooltip.Provider delayDuration={350}>
      <BrowserRouter>
        <Suspense fallback={<main className="route-message"><div className="route-loader" /><h1>正在打开</h1></main>}>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/share" element={<SharePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Tooltip.Provider>
  );
}

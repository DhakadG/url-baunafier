import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { ToastStack } from './components/ToastStack';
import { AppRoutes } from './routes/AppRoutes';
import { GrainBg } from './components/GrainBg';
import { C } from './constants/theme';

const GLOBAL_CSS = `
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes baunaPath { from { opacity: 0; transform: scale(0.55); } to { opacity: 1; transform: scale(1); } }
@keyframes baunaText { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
.bauna-mark { transition: filter .3s ease; }
.bauna-mark:hover { filter: drop-shadow(0 0 10px rgba(164,246,112,.4)); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${C.bg}; color: ${C.text}; }
#root { position: relative; z-index: 1; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
input::placeholder { color: ${C.muted}; }
input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${C.bg} inset; -webkit-text-fill-color: ${C.text}; }
a { color: inherit; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 700px) { .link-row-grid { grid-template-columns: 80px 1fr 54px 80px !important; } .link-row-grid .col-created, .link-row-grid .col-actions { display: none; } }
`;

export default function App() {
  const { toasts, show: toast } = useToast();
  return (
    <BrowserRouter>
      <style>{GLOBAL_CSS}</style>
      <GrainBg />
      <AuthProvider>
        <AppRoutes toast={toast} />
        <ToastStack toasts={toasts} />
      </AuthProvider>
    </BrowserRouter>
  );
}

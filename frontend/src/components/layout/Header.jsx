/**
 * Header
 * -----------------------------------------------------------------------------
 * Global top bar with navigation, user menu, and app-level modals.
 *
 * Responsibilities:
 * - Display app branding + route navigation
 * - Render authenticated user menu (dashboard, history, about, logout)
 * - Fetch user session on route change
 * - Handle logout confirmation and modal states
 *
 * UI Behavior:
 * - Click-outside to close menu
 * - Avatar → opens dropdown menu
 * - Fixed position for consistent page navigation
 */
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import AboutModal from '../common/AboutModal';
import ConfirmModal from '../userMenu/LogoutModal';
import InterviewHistoryModal from '../userMenu/InterviewHistoryModal';
import AvatarCircle from '../userMenu/AvatarCircle';

import { getMe, logout } from '../../services/auth';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);

    // UI state
    const [menuOpen, setMenuOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    // User session
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Logout flow
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    /**
     * Load user info whenever the route changes.
     */
    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoadingUser(true);
            const me = await getMe();
            if (mounted) setUser(me || null);
            setLoadingUser(false);
        })();

        return () => { mounted = false; };
    }, [location.pathname]);

    /**
     * Click-outside handler to close dropdown menu.
     */
    useEffect(() => {
        if (!menuOpen) return;

        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onClick);
        document.addEventListener('touchstart', onClick);

        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('touchstart', onClick);
        };
    }, [menuOpen]);

    /**
     * Handle navigation from menu items.
     */
    const handleGo = (to) => {
        switch (to) {
            case 'interviewType':
                navigate('/interview');
                break;
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'history':
                setHistoryOpen(true);
                break;
            case 'about':
                setAboutOpen(true);
                break;
            case 'logout':
                setConfirmLogout(true);
                break;
            default:
                break;
        }
    };

    /**
     * Logout confirmation → clear session and redirect home.
     */
    const handleConfirmLogout = async () => {
        try {
            setLoggingOut(true);
            await logout();
            setUser(null);
        } finally {
            setLoggingOut(false);
            setConfirmLogout(false);
            window.location.replace('/');
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm flex items-center z-50">
                <div className="mx-auto w-full px-10 flex items-center justify-between">

                    {/* Brand */}
                    <div
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => navigate('/')}
                    >
                        <SmartToyIcon sx={{ fontSize: 35 }} />
                        <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            AI Interview Coach
                        </span>
                    </div>

                    {/* User menu */}
                    {user && !loadingUser ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                aria-label="Open menu"
                                title={user?.name || 'Menu'}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-1.5 rounded-full hover:bg-gray-100/60 transition active:scale-95"
                            >
                                <AvatarCircle src={user?.avatar} name={user?.name} size={34} />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                                    {/* User info */}
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <AvatarCircle src={user?.avatar} name={user?.name} size={48} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">
                                                    Hi, {user?.name || 'User'}!
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {user?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-2">
                                        <button
                                            onClick={() => { setMenuOpen(false); handleGo('dashboard'); }}
                                            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                                        >
                                            <div className="w-5 h-5 rounded bg-blue-100 grid place-items-center text-xs">📊</div>
                                            Dashboard
                                        </button>

                                        <button
                                            onClick={() => { setMenuOpen(false); handleGo('history'); }}
                                            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                                        >
                                            <div className="w-5 h-5 rounded bg-indigo-100 grid place-items-center text-xs">📋</div>
                                            Interview History
                                        </button>

                                        <button
                                            onClick={() => { setMenuOpen(false); handleGo('about'); }}
                                            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                                        >
                                            <div className="w-5 h-5 rounded bg-purple-100 grid place-items-center text-xs">ℹ️</div>
                                            About
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100"></div>

                                    {/* Logout */}
                                    <div className="py-2">
                                        <button
                                            onClick={() => { setMenuOpen(false); handleGo('logout'); }}
                                            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50"
                                        >
                                            <div className="w-5 h-5 rounded bg-red-100 grid place-items-center text-xs">🚪</div>
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-10 h-10" aria-hidden />
                    )}
                </div>
            </header>

            {/* Global modals */}
            <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
            <InterviewHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />

            <ConfirmModal
                open={confirmLogout}
                title="Log Out?"
                message="Are you sure you want to end your session and log out?"
                confirmText="Log Out"
                cancelText="Cancel"
                loading={loggingOut}
                onConfirm={handleConfirmLogout}
                onCancel={() => setConfirmLogout(false)}
            />
        </>
    );
}

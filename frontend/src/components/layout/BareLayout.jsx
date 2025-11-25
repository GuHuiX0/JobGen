/**
 * BareLayout
 * -----------------------------------------------------------------------------
 * Minimal page layout used for routes that do not require the global Header.
 *
 * Usage:
 * - Auth pages (login, callback, onboarding)
 * - Full-screen flows that manage their own UI
 */

import { Outlet } from 'react-router-dom';

export default function BareLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}

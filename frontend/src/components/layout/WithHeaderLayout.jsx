/**
 * WithHeaderLayout
 * -----------------------------------------------------------------------------
 * App layout with a persistent Header and routed page content.
 *
 * Usage:
 * - Wraps pages that require global navigation
 * - Renders nested routes via <Outlet />
 */
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function WithHeaderLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}

import { useState } from 'react';

/**
 * AvatarCircle
 * -----------------------------------------------------------------------------
 * Minimal circular avatar component with image → initial fallback.
 *
 * Behavior:
 *  - Renders the provided image when available
 *  - Automatically falls back to the user's initial if the image fails
 *  - Ensures consistent sizing through inline styles
 *
 * Props:
 *  - src:  optional avatar image URL
 *  - name: used to derive fallback initial
 *  - size: diameter in pixels
 */
export default function AvatarCircle({ src, name = '', size = 32 }) {
    const initials = name?.trim()?.[0]?.toUpperCase() || '?';
    const [imgOk, setImgOk] = useState(Boolean(src));

    /** Render image; fallback to initials if load fails */
    if (imgOk) {
        return (
            <img
                src={src}
                alt={name || 'avatar'}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
                onError={() => setImgOk(false)}
            />
        );
    }

    /** Initial fallback */
    return (
        <span
            className="rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold"
            style={{
                width: size,
                height: size,
                fontSize: Math.max(12, Math.floor(size * 0.5)),
            }}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
}

/**
 * Standardizes time formatting from 'HH:mm:ss' or 'HH:mm' to 'h:mm AM/PM'
 */
export const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Standardizes date formatting from 'YYYY-MM-DD' to 'Weekday, Month Day, Year'
 * Example: 'Monday, Mar 15, 2026'
 */
export const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    // Use local parse by appending T00:00:00
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/**
 * Standardizes datetime from ISO string to 'MMM D, YYYY at h:mm AM/PM'
 */
export const formatCreatedAt = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

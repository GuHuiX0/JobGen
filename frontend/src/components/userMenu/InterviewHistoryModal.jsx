import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../../services/api';

/**
 * InterviewHistoryModal
 * -----------------------------------------------------------------------------
 * Modal displaying the user's past interviews in a scrollable list.
 *
 * Responsibilities:
 *  - Lazy-load history when modal opens
 *  - Render loading / error / empty states
 *  - Navigate to feedback for completed interviews
 *
 * Notes:
 *  - Non-completed sessions are disabled
 *  - Tailwind UI with subtle animations
 *
 * Props:
 *  - open:     boolean → controls visibility
 *  - onClose:  close handler
 */
const InterviewHistoryModal = ({ open, onClose }) => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch interview history when modal becomes visible.
     */
    useEffect(() => {
        if (open) fetchInterviews();
    }, [open]);

    /** Load history from backend */
    const fetchInterviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await interviewAPI.getHistory();
            setInterviews(data.interviews || []);
        } catch (err) {
            console.error('Error fetching interview history:', err);
            setError(err.message || 'Failed to load interview history');
        } finally {
            setLoading(false);
        }
    };

    /** Format timestamp → readable date */
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /** Type tag color classes */
    const getTypeColor = (type) => {
        const colors = {
            behavioral: 'bg-green-100 text-green-700',
            technical: 'bg-blue-100 text-blue-700',
            psychometric: 'bg-purple-100 text-purple-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    /** Status tag color classes */
    const getStatusColor = (status) => {
        const colors = {
            created: 'bg-yellow-100 text-yellow-700',
            questions_generated: 'bg-blue-100 text-blue-700',
            submitted: 'bg-indigo-100 text-indigo-700',
            completed: 'bg-green-100 text-green-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    /** Open feedback page for a completed interview */
    const handleInterviewClick = (id) => {
        onClose();
        navigate(`/interview/${id}/feedback`);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Interview History</h2>
                        <p className="text-sm text-gray-500 mt-1">View and access your past interviews</p>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        /* Loading */
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                            <span className="ml-3 text-gray-600">Loading interviews...</span>
                        </div>
                    ) : error ? (
                        /* Error */
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-600 font-medium mb-2">Error loading interviews</p>
                            <p className="text-gray-500 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchInterviews}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : interviews.length === 0 ? (
                        /* Empty */
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No interviews yet</p>
                            <p className="text-gray-500 text-sm">Your past interviews will appear here</p>
                        </div>
                    ) : (
                        /* History list */
                        <div className="space-y-3">
                            {interviews.map((interview) => (
                                <div
                                    key={interview.interview_id}
                                    onClick={() =>
                                        interview.status === 'completed' &&
                                        handleInterviewClick(interview.interview_id)
                                    }
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                        interview.status === 'completed'
                                            ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md'
                                            : 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-75'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Tags */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getTypeColor(interview.type)}`}>
                                                    {interview.type}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(interview.status)}`}>
                                                    {interview.status}
                                                </span>
                                                {interview.score !== null && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                                        Score: {interview.score}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Metadata */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="text-gray-500">Questions:</span>
                                                    <span className="ml-2 font-medium">{interview.question_count}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Duration:</span>
                                                    <span className="ml-2 font-medium">{interview.duration_seconds}s</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Created:</span>
                                                    <span className="ml-2 font-medium">{formatDate(interview.created_at)}</span>
                                                </div>
                                                {interview.completed_at && (
                                                    <div>
                                                        <span className="text-gray-500">Completed:</span>
                                                        <span className="ml-2 font-medium">{formatDate(interview.completed_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {interview.status === 'completed' && (
                                            <div className="ml-4 flex items-center text-indigo-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewHistoryModal;

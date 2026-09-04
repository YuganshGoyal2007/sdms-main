import React from "react";

export const QuickActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group text-left cursor-pointer bg-white border border-gray-200 rounded-xl p-5 transition-all
                 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
            <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg
                        bg-gray-100 text-gray-700
                        group-hover:bg-black group-hover:text-white transition-colors">
                    {icon}
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
};

export const StatCard: React.FC<{
    value: number | string;
    label: string;
    loading?: boolean;
}> = ({ value, label, loading }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 hover:shadow-sm transition">
            <p className="text-sm text-gray-500">{label}</p>

            {loading ? (
                <div className="mt-2 h-10 w-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                    {value}
                </p>
            )}
        </div>
    );
};

import React from 'react';
import { motion } from 'framer-motion';

const PremiumCard = ({
    children,
    title,
    icon,
    actions,
    footer,
    loading = false,
    statusTop = false,
    statusStart = false,
    statusColor = '#4f46e5', // default indigo-600
    className = '',
    bodyClassName = '',
    noPadding = false,
    hoverEffect = true
}) => {
    return (
        <motion.div 
            whileHover={hoverEffect ? { y: -2 } : {}}
            className={`relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${loading ? 'opacity-70 pointer-events-none' : ''} ${className} transition-shadow hover:shadow-md`}
        >
            {/* Status Bars */}
            {statusTop && (
                <div 
                    className="absolute top-0 left-0 right-0 h-1" 
                    style={{ backgroundColor: statusColor }}
                />
            )}
            {statusStart && (
                <div 
                    className="absolute top-0 bottom-0 left-0 w-1" 
                    style={{ backgroundColor: statusColor }}
                />
            )}

            {/* Header */}
            {(title || actions) && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 m-0">
                            {icon && <span className="text-indigo-500 flex">{icon}</span>}
                            {title}
                        </h3>
                    )}
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}

            {/* Body */}
            <div className={`bg-white ${noPadding ? '' : 'p-6'} ${bodyClassName}`}>
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </motion.div>
    );
};

export default PremiumCard;

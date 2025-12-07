import React from 'react';
import './PremiumCard.css';

const PremiumCard = ({
    children,
    title,
    icon,
    actions,
    footer,
    loading = false,
    statusTop = false,
    statusStart = false,
    statusColor = 'var(--primary)',
    className = '',
    bodyClassName = '',
    noPadding = false,
    hoverEffect = true
}) => {
    return (
        <div className={`card premium-card ${hoverEffect ? '' : 'no-hover'} ${loading ? 'loading' : ''} ${className}`}>
            {statusTop && <div className="card-status-top" style={{ background: statusColor }}></div>}
            {statusStart && <div className="card-status-start" style={{ background: statusColor }}></div>}

            {(title || actions) && (
                <div className="card-header premium-card-header">
                    {title && (
                        <h3 className="card-title premium-card-title">
                            {icon && <span className="icon-wrapper">{icon}</span>}
                            {title}
                        </h3>
                    )}
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}

            <div className={`card-body premium-card-body ${noPadding ? 'no-padding' : ''} ${bodyClassName}`}>
                {children}
            </div>

            {footer && (
                <div className="card-footer premium-card-footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default PremiumCard;

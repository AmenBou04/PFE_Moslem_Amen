import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const UiFeedbackContext = createContext(null);

const defaultConfirmState = {
    open: false,
    title: 'Confirmation',
    message: 'Voulez-vous continuer ?',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'danger'
};

const defaultAlertPopupState = {
    open: false,
    alerte: null
};

export const UiFeedbackProvider = ({ children }) => {
    const resolverRef = useRef(null);
    const [confirmState, setConfirmState] = useState(defaultConfirmState);
    const [alertPopupState, setAlertPopupState] = useState(defaultAlertPopupState);
    const [toast, setToast] = useState({
        open: false,
        type: 'info',
        message: '',
        duration: 2800
    });

    const closeConfirm = useCallback((result) => {
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }

        setConfirmState((prev) => ({ ...prev, open: false }));
    }, []);

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setConfirmState({
                ...defaultConfirmState,
                ...options,
                open: true
            });
        });
    }, []);

    const notify = useCallback((options) => {
        if (typeof options === 'string') {
            setToast({
                open: true,
                type: 'info',
                message: options,
                duration: 2800
            });
            return;
        }

        setToast({
            open: true,
            type: options?.type || 'info',
            message: options?.message || '',
            duration: options?.duration || 2800
        });
    }, []);

    const showAlertPopup = useCallback((alerte) => {
        if (!alerte?._id) {
            return;
        }

        setAlertPopupState({
            open: true,
            alerte
        });
    }, []);

    const closeAlertPopup = useCallback(() => {
        setAlertPopupState(defaultAlertPopupState);
    }, []);

    useEffect(() => {
        if (!toast.open) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setToast((prev) => ({ ...prev, open: false }));
        }, toast.duration);

        return () => window.clearTimeout(timeoutId);
    }, [toast.duration, toast.open]);

    useEffect(() => {
        return () => {
            if (resolverRef.current) {
                resolverRef.current(false);
            }
        };
    }, []);

    const value = useMemo(
        () => ({
            confirm,
            notify,
            showAlertPopup,
            closeAlertPopup
        }),
        [confirm, notify, showAlertPopup, closeAlertPopup]
    );

    const alerte = alertPopupState.alerte;
    const alertDate = alerte?.createdAt ? new Date(alerte.createdAt) : null;
    const formattedAlertDate = alertDate && !Number.isNaN(alertDate.getTime())
        ? alertDate.toLocaleString('fr-FR')
        : 'Date inconnue';

    return (
        <UiFeedbackContext.Provider value={value}>
            {children}

            <div
                className={`modern-modal-overlay ${confirmState.open ? 'is-open' : ''}`}
                onClick={() => closeConfirm(false)}
            >
                <div
                    className={`modern-modal modern-modal-${confirmState.variant}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modern-modal-title"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="modern-modal-badge">!</div>
                    <h3 id="modern-modal-title" className="modern-modal-title">{confirmState.title}</h3>
                    <p className="modern-modal-message">{confirmState.message}</p>
                    <div className="modern-modal-actions">
                        <button
                            type="button"
                            className="modern-btn modern-btn-secondary"
                            onClick={() => closeConfirm(false)}
                        >
                            {confirmState.cancelText}
                        </button>
                        <button
                            type="button"
                            className="modern-btn modern-btn-danger"
                            onClick={() => closeConfirm(true)}
                        >
                            {confirmState.confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`modern-toast modern-toast-${toast.type} ${toast.open ? 'is-open' : ''}`} role="status">
                <span className="modern-toast-dot" />
                <span>{toast.message}</span>
            </div>

            <div
                className={`modern-modal-overlay ${alertPopupState.open ? 'is-open' : ''}`}
                onClick={closeAlertPopup}
            >
                <div
                    className="modern-modal modern-modal-alert"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modern-alert-popup-title"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="modern-modal-badge modern-modal-badge-ai">AI</div>
                    <h3 id="modern-alert-popup-title" className="modern-modal-title">
                        Nouvelle alerte detectee
                    </h3>
                    <p className="modern-modal-message">
                        Une alerte a ete remontee par le systeme de surveillance.
                    </p>

                    <div className="alert-popup-details">
                        <p className="alert-popup-row"><strong>Type:</strong> {alerte?.type || 'ANOMALIE'}</p>
                        <p className="alert-popup-row"><strong>Gravite:</strong> {alerte?.gravite || 'MOYENNE'}</p>
                        <p className="alert-popup-row"><strong>Zone:</strong> {alerte?.zone_id?.nom || 'Non specifiee'}</p>
                        <p className="alert-popup-row"><strong>Heure:</strong> {formattedAlertDate}</p>
                        <p className="alert-popup-description">{alerte?.description || 'Aucune description'}</p>
                    </div>

                    <div className="modern-modal-actions">
                        <button
                            type="button"
                            className="modern-btn modern-btn-secondary"
                            onClick={closeAlertPopup}
                        >
                            Fermer
                        </button>
                        <button
                            type="button"
                            className="modern-btn modern-btn-danger"
                            onClick={() => {
                                closeAlertPopup();
                                window.location.href = '/alertes';
                            }}
                        >
                            Voir les alertes
                        </button>
                    </div>
                </div>
            </div>
        </UiFeedbackContext.Provider>
    );
};

export const useUiFeedback = () => {
    const context = useContext(UiFeedbackContext);

    if (!context) {
        throw new Error('useUiFeedback must be used inside UiFeedbackProvider');
    }

    return context;
};

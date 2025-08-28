import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ShareStore.css';

const ShareStore = ({ storeData = null }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    if (!storeData) return null;

    const storeUrl = `${window.location.origin}/loja/${storeData.slug}`;
    const shareText = `Confira o cardápio da ${storeData.name}! 🍕`;

    // Copiar link para área de transferência
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(storeUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar link:', err);
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = storeUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    // Compartilhar no WhatsApp
    const shareWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${storeUrl}`)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Compartilhar no Facebook
    const shareFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
        window.open(facebookUrl, '_blank');
    };

    // Compartilhar no Twitter
    const shareTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storeUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    // Compartilhar no Telegram
    const shareTelegram = () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, '_blank');
    };

    // Compartilhar por email
    const shareEmail = () => {
        const subject = encodeURIComponent(`Confira o cardápio da ${storeData.name}`);
        const body = encodeURIComponent(`Olá!\n\n${shareText}\n\nAcesse: ${storeUrl}\n\nBom apetite!`);
        const emailUrl = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = emailUrl;
    };

    // Usar Web Share API se disponível
    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Cardápio - ${storeData.name}`,
                    text: shareText,
                    url: storeUrl
                });
            } catch (err) {
                // Compartilhamento cancelado pelo usuário
            }
        } else {
            setShowShareModal(true);
        }
    };

    return (
        <>
            {/* Botão de compartilhar */}
            <button 
                className="share-store-btn"
                onClick={nativeShare}
                title="Compartilhar loja"
            >
                <i className="fas fa-share-alt"></i>
                <span>Compartilhar</span>
            </button>

            {/* Modal de compartilhamento */}
            {showShareModal && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Compartilhar {storeData.name}</h3>
                            <button 
                                className="close-modal-btn"
                                onClick={() => setShowShareModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="share-modal-content">
                            {/* Link para copiar */}
                            <div className="share-link-section">
                                <label>Link da loja:</label>
                                <div className="share-link-container">
                                    <input 
                                        type="text" 
                                        value={storeUrl} 
                                        readOnly 
                                        className="share-link-input"
                                    />
                                    <button 
                                        className={`copy-link-btn ${copySuccess ? 'success' : ''}`}
                                        onClick={copyToClipboard}
                                    >
                                        {copySuccess ? (
                                            <>
                                                <i className="fas fa-check"></i>
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-copy"></i>
                                                Copiar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Botões de redes sociais */}
                            <div className="share-social-section">
                                <label>Compartilhar em:</label>
                                <div className="share-social-buttons">
                                    <button 
                                        className="share-social-btn whatsapp"
                                        onClick={shareWhatsApp}
                                        title="Compartilhar no WhatsApp"
                                    >
                                        <i className="fab fa-whatsapp"></i>
                                        WhatsApp
                                    </button>

                                    <button 
                                        className="share-social-btn facebook"
                                        onClick={shareFacebook}
                                        title="Compartilhar no Facebook"
                                    >
                                        <i className="fab fa-facebook-f"></i>
                                        Facebook
                                    </button>

                                    <button 
                                        className="share-social-btn twitter"
                                        onClick={shareTwitter}
                                        title="Compartilhar no Twitter"
                                    >
                                        <i className="fab fa-twitter"></i>
                                        Twitter
                                    </button>

                                    <button 
                                        className="share-social-btn telegram"
                                        onClick={shareTelegram}
                                        title="Compartilhar no Telegram"
                                    >
                                        <i className="fab fa-telegram-plane"></i>
                                        Telegram
                                    </button>

                                    <button 
                                        className="share-social-btn email"
                                        onClick={shareEmail}
                                        title="Compartilhar por email"
                                    >
                                        <i className="fas fa-envelope"></i>
                                        Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

ShareStore.propTypes = {
    storeData: PropTypes.shape({
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired
    })
};



export default ShareStore;
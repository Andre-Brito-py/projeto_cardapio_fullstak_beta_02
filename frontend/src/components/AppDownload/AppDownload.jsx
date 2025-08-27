import React from 'react';
import './AppDownload.css';

const AppDownload = () => {
    return (
        <div className='app-download' id='app-download'>
            <p>Para uma melhor experiência, baixe nosso app</p>
            <div className="app-download-platforms">
                <img src="/play_store.png" alt="Play Store" />
                <img src="/app_store.png" alt="App Store" />
            </div>
        </div>
    );
};

export default AppDownload;
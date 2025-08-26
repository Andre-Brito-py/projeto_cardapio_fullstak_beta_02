import React, { useState } from 'react';
import './BluetoothPrint.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const BluetoothPrint = ({ url, token }) => {
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Buscar impressoras Bluetooth
    const scanForPrinters = async () => {
        setIsScanning(true);
        try {
            const response = await axios.post(
                `${url}/api/print/scan`,
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                setPrinters(response.data.printers);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erro ao buscar impressoras:', error);
            toast.error('Erro ao buscar impressoras Bluetooth');
        } finally {
            setIsScanning(false);
        }
    };

    // Conectar a uma impressora
    const connectToPrinter = async (printerId) => {
        setIsConnecting(true);
        try {
            const response = await axios.post(
                `${url}/api/print/connect`,
                { printerId },
                { headers: { token } }
            );

            if (response.data.success) {
                setSelectedPrinter(printerId);
                setIsConnected(true);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erro ao conectar impressora:', error);
            toast.error('Erro ao conectar com a impressora');
        } finally {
            setIsConnecting(false);
        }
    };

    // Desconectar impressora
    const disconnectPrinter = async () => {
        try {
            const response = await axios.post(
                `${url}/api/print/disconnect`,
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                setSelectedPrinter(null);
                setIsConnected(false);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erro ao desconectar impressora:', error);
            toast.error('Erro ao desconectar impressora');
        }
    };

    // Teste de impressão
    const testPrint = async () => {
        try {
            const response = await axios.post(
                `${url}/api/print/test`,
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erro no teste de impressão:', error);
            toast.error('Erro no teste de impressão');
        }
    };

    return (
        <div className="bluetooth-print">
            <div className="bluetooth-print-header">
                <h2>Configuração de Impressora Bluetooth</h2>
                <p>Configure sua impressora térmica para imprimir pedidos automaticamente</p>
            </div>

            <div className="bluetooth-print-content">
                {/* Status da Conexão */}
                <div className="connection-status">
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        <div className="status-dot"></div>
                        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                    {isConnected && (
                        <button 
                            className="disconnect-btn"
                            onClick={disconnectPrinter}
                        >
                            Desconectar
                        </button>
                    )}
                </div>

                {/* Buscar Impressoras */}
                <div className="scan-section">
                    <button 
                        className={`scan-btn ${isScanning ? 'scanning' : ''}`}
                        onClick={scanForPrinters}
                        disabled={isScanning}
                    >
                        {isScanning ? 'Buscando...' : 'Buscar Impressoras'}
                    </button>
                </div>

                {/* Lista de Impressoras */}
                {printers.length > 0 && (
                    <div className="printers-list">
                        <h3>Impressoras Encontradas:</h3>
                        <div className="printers-grid">
                            {printers.map((printer) => (
                                <div 
                                    key={printer.id} 
                                    className={`printer-card ${selectedPrinter === printer.id ? 'selected' : ''}`}
                                >
                                    <div className="printer-info">
                                        <h4>{printer.name}</h4>
                                        <p>Endereço: {printer.address}</p>
                                        <p>Sinal: {printer.rssi} dBm</p>
                                    </div>
                                    <button 
                                        className="connect-btn"
                                        onClick={() => connectToPrinter(printer.id)}
                                        disabled={isConnecting || isConnected}
                                    >
                                        {isConnecting ? 'Conectando...' : 
                                         selectedPrinter === printer.id && isConnected ? 'Conectado' : 'Conectar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Teste de Impressão */}
                {isConnected && (
                    <div className="test-section">
                        <h3>Teste de Impressão</h3>
                        <p>Imprima um pedido de teste para verificar se a impressora está funcionando corretamente.</p>
                        <button 
                            className="test-btn"
                            onClick={testPrint}
                        >
                            Imprimir Teste
                        </button>
                    </div>
                )}

                {/* Instruções */}
                <div className="instructions">
                    <h3>Instruções:</h3>
                    <ol>
                        <li>Certifique-se de que sua impressora térmica está ligada e em modo de pareamento</li>
                        <li>Clique em "Buscar Impressoras" para encontrar dispositivos disponíveis</li>
                        <li>Selecione sua impressora na lista e clique em "Conectar"</li>
                        <li>Use "Imprimir Teste" para verificar se a conexão está funcionando</li>
                        <li>Após conectar, você poderá imprimir pedidos diretamente da página de pedidos</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default BluetoothPrint;
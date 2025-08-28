// import noble from 'noble'; // Comentado devido a problemas no Windows
import { SerialPort } from 'serialport';

class BluetoothPrintService {
    constructor() {
        this.connectedDevice = null;
        this.isScanning = false;
        this.printers = [];
        this.serialPort = null;
    }

    /**
     * Inicia a busca por dispositivos Bluetooth
     */
    async startScan() {
        // Funcionalidade Bluetooth desabilitada no Windows
        // Retorna lista vazia para evitar erros
        return new Promise((resolve) => {
            console.log('Bluetooth scan não disponível no Windows. Use impressão via porta serial.');
            resolve([]);
        });
    }

    /**
     * Conecta a um dispositivo Bluetooth específico
     */
    async connectToPrinter(printerId) {
        // Funcionalidade Bluetooth desabilitada no Windows
        return new Promise((resolve, reject) => {
            reject(new Error('Conexão Bluetooth não disponível no Windows. Use impressão via porta serial.'));
        });
    }

    /**
     * Formata QR code para impressão térmica
     */
    formatQRCodeForPrint(qrData) {
        const ESC = '\x1B';
        const INIT = ESC + '@';
        const CENTER = ESC + 'a1';
        const LEFT = ESC + 'a0';
        const BOLD_ON = ESC + 'E1';
        const BOLD_OFF = ESC + 'E0';
        const CUT = ESC + 'd3' + ESC + 'i';
        const LINE = '--------------------------------';
        
        let receipt = INIT;
        
        // Cabeçalho
        receipt += CENTER + BOLD_ON;
        receipt += `${qrData.storeName || 'RESTAURANTE'}\n`;
        receipt += BOLD_OFF + LINE + '\n';
        
        // Informações da mesa
        receipt += CENTER + BOLD_ON;
        receipt += `${qrData.tableName}\n`;
        receipt += `Mesa ${qrData.tableNumber}\n`;
        receipt += BOLD_OFF + LINE + '\n';
        
        // Instruções
        receipt += LEFT;
        if (qrData.instructions && Array.isArray(qrData.instructions)) {
            qrData.instructions.forEach(instruction => {
                receipt += `${instruction}\n`;
            });
        }
        receipt += '\n';
        
        // Espaço para QR Code (seria necessário uma impressora que suporte imagens)
        receipt += CENTER;
        receipt += '[QR CODE AQUI]\n';
        receipt += 'Escaneie com seu celular\n\n';
        
        receipt += LINE + '\n';
        receipt += 'Obrigado pela visita!\n\n';
        
        receipt += CUT;
        
        return receipt;
    }

    /**
     * Formata o pedido para impressão térmica
     */
    formatOrderForPrint(order) {
        const ESC = '\x1B';
        const INIT = ESC + '@';
        const CENTER = ESC + 'a1';
        const LEFT = ESC + 'a0';
        const BOLD_ON = ESC + 'E1';
        const BOLD_OFF = ESC + 'E0';
        const CUT = ESC + 'd3' + ESC + 'i';
        const LINE = '--------------------------------';
        
        let receipt = INIT;
        
        // Cabeçalho
        receipt += CENTER + BOLD_ON;
        receipt += 'RESTAURANTE DELIVERY\n';
        receipt += 'Tel: (11) 99999-9999\n';
        receipt += BOLD_OFF + LINE + '\n';
        
        // Informações do pedido
        receipt += LEFT;
        receipt += `Pedido: #${order._id.slice(-6)}\n`;
        receipt += `Data: ${new Date(order.date).toLocaleString('pt-BR')}\n`;
        receipt += `Status: ${order.status}\n`;
        receipt += LINE + '\n';
        
        // Endereço de entrega
        if (order.address) {
            receipt += BOLD_ON + 'ENDERECO DE ENTREGA:\n' + BOLD_OFF;
            receipt += `${order.address.firstName} ${order.address.lastName}\n`;
            receipt += `${order.address.street}\n`;
            receipt += `${order.address.city}, ${order.address.state}\n`;
            receipt += `CEP: ${order.address.zipcode}\n`;
            receipt += `Tel: ${order.address.phone}\n`;
            receipt += LINE + '\n';
        }
        
        // Itens do pedido
        receipt += BOLD_ON + 'ITENS DO PEDIDO:\n' + BOLD_OFF;
        
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                receipt += `${item.quantity}x ${item.name}\n`;
                receipt += `   R$ ${item.price.toFixed(2)}\n`;
                
                // Extras
                if (item.extras && item.extras.length > 0) {
                    receipt += '   Extras:\n';
                    item.extras.forEach(extra => {
                        receipt += `   + ${extra.name} R$ ${extra.price.toFixed(2)}\n`;
                    });
                }
                
                // Observações
                if (item.observations) {
                    receipt += `   Obs: ${item.observations}\n`;
                }
                
                receipt += '\n';
            });
        }
        
        receipt += LINE + '\n';
        
        // Total
        receipt += BOLD_ON;
        receipt += `SUBTOTAL: R$ ${(order.amount - 2).toFixed(2)}\n`;
        receipt += `ENTREGA:  R$ 2.00\n`;
        receipt += `TOTAL:    R$ ${order.amount.toFixed(2)}\n`;
        receipt += BOLD_OFF;
        
        receipt += LINE + '\n';
        receipt += CENTER;
        receipt += 'Obrigado pela preferencia!\n';
        receipt += 'Volte sempre!\n\n';
        
        receipt += CUT;
        
        return receipt;
    }

    /**
     * Imprime QR code
     */
    async printQRCode(qrData) {
        if (!this.connectedDevice) {
            throw new Error('Nenhuma impressora conectada');
        }

        const formattedQR = this.formatQRCodeForPrint(qrData);
        
        return new Promise((resolve, reject) => {
            this.connectedDevice.discoverServices(['18f0'], (error, services) => {
                if (error) {
                    return reject(error);
                }

                const service = services[0];
                service.discoverCharacteristics(['2af1'], (error, characteristics) => {
                    if (error) {
                        return reject(error);
                    }

                    const characteristic = characteristics[0];
                    const buffer = Buffer.from(formattedQR, 'utf8');
                    
                    characteristic.write(buffer, false, (error) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve({ success: true, message: 'QR code impresso com sucesso' });
                    });
                });
            });
        });
    }

    /**
     * Envia dados para impressão
     */
    async printOrder(order) {
        if (!this.connectedDevice) {
            throw new Error('Nenhuma impressora conectada');
        }

        const formattedOrder = this.formatOrderForPrint(order);
        
        return new Promise((resolve, reject) => {
            this.connectedDevice.discoverServices(['18f0'], (error, services) => {
                if (error) {
                    return reject(error);
                }

                const service = services[0];
                service.discoverCharacteristics(['2af1'], (error, characteristics) => {
                    if (error) {
                        return reject(error);
                    }

                    const characteristic = characteristics[0];
                    const buffer = Buffer.from(formattedOrder, 'utf8');
                    
                    characteristic.write(buffer, false, (error) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve({ success: true, message: 'Pedido impresso com sucesso' });
                    });
                });
            });
        });
    }

    /**
     * Desconecta da impressora
     */
    disconnect() {
        if (this.connectedDevice) {
            this.connectedDevice.disconnect();
            this.connectedDevice = null;
        }
    }

    /**
     * Imprime QR code via porta serial
     */
    async printQRCodeViaSerial(qrData, portPath = 'COM1') {
        return new Promise((resolve, reject) => {
            const port = new SerialPort({
                path: portPath,
                baudRate: 9600
            });

            port.on('open', () => {
                const formattedQR = this.formatQRCodeForPrint(qrData);
                port.write(formattedQR, (error) => {
                    if (error) {
                        port.close();
                        return reject(error);
                    }
                    
                    port.close();
                    resolve({ success: true, message: 'QR code impresso via serial' });
                });
            });

            port.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Método alternativo usando porta serial (para impressoras USB/Serial)
     */
    async printViaSerial(order, portPath = 'COM1') {
        return new Promise((resolve, reject) => {
            const port = new SerialPort({
                path: portPath,
                baudRate: 9600
            });

            port.on('open', () => {
                const formattedOrder = this.formatOrderForPrint(order);
                port.write(formattedOrder, (error) => {
                    if (error) {
                        port.close();
                        return reject(error);
                    }
                    
                    port.close();
                    resolve({ success: true, message: 'Pedido impresso via serial' });
                });
            });

            port.on('error', (error) => {
                reject(error);
            });
        });
    }
}

export default new BluetoothPrintService();
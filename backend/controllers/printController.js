import bluetoothPrintService from '../services/bluetoothPrintService.js';
import orderModel from '../models/orderModel.js';

// Buscar impressoras Bluetooth disponíveis
const scanPrinters = async (req, res) => {
    try {
        const printers = await bluetoothPrintService.startScan();
        res.json({
            success: true,
            printers: printers,
            message: `${printers.length} impressora(s) encontrada(s)`
        });
    } catch (error) {
        console.error('Erro ao buscar impressoras:', error);
        res.json({
            success: false,
            message: 'Erro ao buscar impressoras Bluetooth'
        });
    }
};

// Conectar a uma impressora específica
const connectPrinter = async (req, res) => {
    try {
        const { printerId } = req.body;
        
        if (!printerId) {
            return res.json({
                success: false,
                message: 'ID da impressora é obrigatório'
            });
        }

        const result = await bluetoothPrintService.connectToPrinter(printerId);
        res.json(result);
    } catch (error) {
        console.error('Erro ao conectar impressora:', error);
        res.json({
            success: false,
            message: 'Erro ao conectar com a impressora'
        });
    }
};

// Imprimir pedido via Bluetooth
const printOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.json({
                success: false,
                message: 'ID do pedido é obrigatório'
            });
        }

        // Buscar o pedido no banco de dados
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Imprimir o pedido
        const result = await bluetoothPrintService.printOrder(order);
        res.json(result);
    } catch (error) {
        console.error('Erro ao imprimir pedido:', error);
        res.json({
            success: false,
            message: 'Erro ao imprimir pedido'
        });
    }
};

// Imprimir pedido via porta serial (alternativa)
const printOrderSerial = async (req, res) => {
    try {
        const { orderId, portPath } = req.body;
        
        if (!orderId) {
            return res.json({
                success: false,
                message: 'ID do pedido é obrigatório'
            });
        }

        // Buscar o pedido no banco de dados
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Imprimir via porta serial
        const result = await bluetoothPrintService.printViaSerial(order, portPath);
        res.json(result);
    } catch (error) {
        console.error('Erro ao imprimir via serial:', error);
        res.json({
            success: false,
            message: 'Erro ao imprimir via porta serial'
        });
    }
};

// Desconectar impressora
const disconnectPrinter = async (req, res) => {
    try {
        bluetoothPrintService.disconnect();
        res.json({
            success: true,
            message: 'Impressora desconectada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao desconectar impressora:', error);
        res.json({
            success: false,
            message: 'Erro ao desconectar impressora'
        });
    }
};

// Imprimir QR code via Bluetooth
const printQRCode = async (req, res) => {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.json({
                success: false,
                message: 'Dados do QR code são obrigatórios'
            });
        }

        const result = await bluetoothPrintService.printQRCode(qrData);
        res.json(result);
    } catch (error) {
        console.error('Erro ao imprimir QR code:', error);
        res.json({
            success: false,
            message: 'Erro ao imprimir QR code via Bluetooth'
        });
    }
};

// Imprimir QR code via porta serial
const printQRCodeSerial = async (req, res) => {
    try {
        const { qrData, portPath } = req.body;
        
        if (!qrData) {
            return res.json({
                success: false,
                message: 'Dados do QR code são obrigatórios'
            });
        }

        const result = await bluetoothPrintService.printQRCodeViaSerial(qrData, portPath);
        res.json(result);
    } catch (error) {
        console.error('Erro ao imprimir QR code via serial:', error);
        res.json({
            success: false,
            message: 'Erro ao imprimir QR code via porta serial'
        });
    }
};

// Testar impressão (imprimir texto de teste)
const testPrint = async (req, res) => {
    try {
        const testOrder = {
            _id: 'TEST123456',
            date: new Date(),
            status: 'Teste',
            amount: 25.50,
            address: {
                firstName: 'Teste',
                lastName: 'Usuario',
                street: 'Rua de Teste, 123',
                city: 'São Paulo',
                state: 'SP',
                zipcode: '01234-567',
                phone: '(11) 99999-9999'
            },
            items: [
                {
                    name: 'Pizza Margherita',
                    quantity: 1,
                    price: 20.00,
                    extras: [
                        { name: 'Queijo Extra', price: 3.50 }
                    ],
                    observations: 'Sem cebola, por favor'
                }
            ]
        };

        const result = await bluetoothPrintService.printOrder(testOrder);
        res.json(result);
    } catch (error) {
        console.error('Erro no teste de impressão:', error);
        res.json({
            success: false,
            message: 'Erro no teste de impressão'
        });
    }
};

export {
    scanPrinters,
    connectPrinter,
    printOrder,
    printOrderSerial,
    printQRCode,
    printQRCodeSerial,
    disconnectPrinter,
    testPrint
};
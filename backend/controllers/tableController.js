import tableModel from '../models/tableModel.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';

// Criar nova mesa
const createTable = async (req, res) => {
    try {
        console.log('=== CRIANDO MESA ===');
        console.log('Body recebido:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Store ID:', req.storeId);
        console.log('Store:', req.store ? { id: req.store._id, name: req.store.name } : 'null');
        console.log('User:', req.user ? { id: req.user._id, role: req.user.role, storeId: req.user.storeId } : 'null');
        
        const { tableNumber, displayName, capacity, location, notes, isActive } = req.body;
        const storeId = req.user?.storeId || req.storeId;
        
        // Validação obrigatória
        if (!tableNumber) {
            console.log('Erro: tableNumber não fornecido');
            return res.status(400).json({ 
                success: false, 
                message: "Número da mesa é obrigatório" 
            });
        }
        
        // Verificar se temos storeId
        if (!storeId) {
            console.log('Erro: storeId não encontrado');
            return res.status(400).json({ 
                success: false, 
                message: "Loja não identificada" 
            });
        }
        
        // Converter tableNumber para string para consistência
        const tableNumberStr = tableNumber.toString();
        console.log('Table number convertido:', tableNumberStr);
        
        // Verificar se já existe uma mesa com este número na loja
        const existingTable = await tableModel.findOne({ storeId, tableNumber: tableNumberStr });
        if (existingTable) {
            console.log('Erro: Mesa já existe');
            return res.status(400).json({ 
                success: false, 
                message: "Já existe uma mesa com este número" 
            });
        }
        
        // Gerar QR code único
        const qrCodeId = uuidv4();
        console.log('QR Code gerado:', qrCodeId);
        
        // Criar nova mesa
        const table = new tableModel({
            storeId,
            tableNumber: tableNumberStr,
            displayName: displayName || `Mesa ${tableNumberStr}`,
            qrCode: qrCodeId,
            capacity: capacity ? parseInt(capacity) : 4,
            location: location || '',
            notes: notes || '',
            isActive: isActive !== undefined ? isActive : true
        });
        
        // Gerar URL do QR code
        table.qrCodeUrl = table.generateQRCodeUrl();
        
        console.log('Mesa a ser salva:', JSON.stringify(table.toObject(), null, 2));
        await table.save();
        
        console.log('Mesa criada com sucesso:', table._id);
        
        res.json({
            success: true,
            message: "Mesa criada com sucesso",
            data: table
        });
    } catch (error) {
        console.error('=== ERRO DETALHADO ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('Código:', error.code);
        console.error('KeyPattern:', error.keyPattern);
        console.error('KeyValue:', error.keyValue);
        
        // Tratar erro de duplicidade (código 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            if (field === 'qrCode') {
                return res.status(400).json({ 
                    success: false, 
                    message: "Erro interno: QR Code duplicado" 
                });
            }
            return res.status(400).json({ 
                success: false, 
                message: "Já existe uma mesa com este número" 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Erro interno do servidor",
            error: error.message 
        });
    }
};

// Listar todas as mesas da loja
const listTables = async (req, res) => {
    try {
        const storeId = req.user?.storeId || req.storeId;
        
        if (!storeId) {
            return res.json({ success: false, message: "ID da loja não encontrado" });
        }
        
        const tables = await tableModel.find({ storeId }).sort({ tableNumber: 1 });
        
        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.log('Erro ao listar mesas:', error);
        res.json({ success: false, message: "Erro ao listar mesas" });
    }
};

// Obter mesa específica
const getTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const storeId = req.user?.storeId || req.storeId;
        
        const table = await tableModel.findOne({ _id: tableId, storeId });
        
        if (!table) {
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.log('Erro ao obter mesa:', error);
        res.json({ success: false, message: "Erro ao obter mesa" });
    }
};

// Atualizar mesa
const updateTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const { tableNumber, displayName, capacity, location, notes, isActive } = req.body;
        const storeId = req.user?.storeId || req.storeId;
        
        const table = await tableModel.findOne({ _id: tableId, storeId });
        
        if (!table) {
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        // Verificar se o novo número da mesa já existe (se foi alterado)
        if (tableNumber && tableNumber !== table.tableNumber) {
            const existingTable = await tableModel.findOne({ storeId, tableNumber });
            if (existingTable) {
                return res.json({ success: false, message: "Já existe uma mesa com este número" });
            }
        }
        
        // Atualizar campos
        if (tableNumber) table.tableNumber = tableNumber;
        if (displayName) table.displayName = displayName;
        if (capacity) table.capacity = capacity;
        if (location !== undefined) table.location = location;
        if (notes !== undefined) table.notes = notes;
        if (isActive !== undefined) table.isActive = isActive;
        
        await table.save();
        
        res.json({
            success: true,
            message: "Mesa atualizada com sucesso",
            data: table
        });
    } catch (error) {
        console.log('Erro ao atualizar mesa:', error);
        res.json({ success: false, message: "Erro ao atualizar mesa" });
    }
};

// Deletar mesa
const deleteTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const storeId = req.user?.storeId || req.storeId;
        
        const table = await tableModel.findOneAndDelete({ _id: tableId, storeId });
        
        if (!table) {
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        res.json({
            success: true,
            message: "Mesa deletada com sucesso"
        });
    } catch (error) {
        console.log('Erro ao deletar mesa:', error);
        res.json({ success: false, message: "Erro ao deletar mesa" });
    }
};

// Gerar QR code para mesa específica
const generateQRCode = async (req, res) => {
    try {
        const { tableId } = req.params;
        const storeId = req.user?.storeId || req.storeId;
        
        const table = await tableModel.findOne({ _id: tableId, storeId });
        
        if (!table) {
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        // Gerar QR code como base64
        const qrCodeDataURL = await QRCode.toDataURL(table.qrCodeUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        res.json({
            success: true,
            data: {
                table: table,
                qrCode: qrCodeDataURL,
                url: table.qrCodeUrl
            }
        });
    } catch (error) {
        console.log('Erro ao gerar QR code:', error);
        res.json({ success: false, message: "Erro ao gerar QR code" });
    }
};

// Gerar QR codes para todas as mesas
const generateAllQRCodes = async (req, res) => {
    try {
        console.log('=== GERANDO QR CODES PARA TODAS AS MESAS ===');
        console.log('User:', req.user ? { id: req.user._id, role: req.user.role, storeId: req.user.storeId } : 'null');
        console.log('StoreId from req:', req.storeId);
        
        const storeId = req.user?.storeId || req.storeId;
        console.log('StoreId final:', storeId);
        
        if (!storeId) {
            console.log('Erro: ID da loja não encontrado');
            return res.json({ success: false, message: "ID da loja não encontrado" });
        }
        
        console.log('Buscando mesas ativas para a loja:', storeId);
        const tables = await tableModel.find({ storeId, isActive: true }).sort({ tableNumber: 1 });
        console.log('Mesas encontradas:', tables.length);
        
        if (tables.length === 0) {
            console.log('Nenhuma mesa ativa encontrada');
            return res.json({ success: false, message: "Nenhuma mesa ativa encontrada" });
        }
        
        const qrCodes = [];
        
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            console.log(`Processando mesa ${i + 1}/${tables.length}: ${table.tableNumber}`);
            console.log('QR Code URL da mesa:', table.qrCodeUrl);
            
            // Verificar se a mesa tem qrCodeUrl
            if (!table.qrCodeUrl) {
                console.log('Mesa sem qrCodeUrl, gerando...');
                table.qrCodeUrl = table.generateQRCodeUrl();
                await table.save();
                console.log('QR Code URL gerada:', table.qrCodeUrl);
            }
            
            const qrCodeDataURL = await QRCode.toDataURL(table.qrCodeUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log(`QR Code gerado para mesa ${table.tableNumber}`);
            
            qrCodes.push({
                table: table,
                qrCode: qrCodeDataURL,
                url: table.qrCodeUrl
            });
        }
        
        console.log('QR Codes gerados com sucesso:', qrCodes.length);
        
        res.json({
            success: true,
            data: qrCodes
        });
    } catch (error) {
        console.error('=== ERRO DETALHADO AO GERAR QR CODES ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        res.json({ success: false, message: "Erro ao gerar QR codes" });
    }
};

// Obter mesa pelo QR code (para uso público)
const getTableByQRCode = async (req, res) => {
    try {
        const { qrCode } = req.params;
        
        const table = await tableModel.findOne({ qrCode }).populate('storeId', 'name slug settings.isOpen');
        
        if (!table) {
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        if (!table.isActive) {
            return res.json({ success: false, message: "Mesa não está ativa" });
        }
        
        res.json({
            success: true,
            data: {
                table: {
                    _id: table._id,
                    tableNumber: table.tableNumber,
                    displayName: table.displayName,
                    capacity: table.capacity
                },
                store: table.storeId
            }
        });
    } catch (error) {
        console.log('Erro ao obter mesa por QR code:', error);
        res.json({ success: false, message: "Erro ao obter mesa" });
    }
};

// Imprimir QR code para mesa específica
const printTableQRCode = async (req, res) => {
    try {
        console.log('=== INICIANDO IMPRESSÃO DE QR CODE INDIVIDUAL ===');
        const { tableId } = req.params;
        const storeId = req.user?.storeId || req.storeId;
        
        console.log('Table ID:', tableId);
        console.log('Store ID:', storeId);
        
        const table = await tableModel.findOne({ _id: tableId, storeId }).populate('storeId', 'name');
        
        if (!table) {
            console.log('Mesa não encontrada');
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        console.log('Mesa encontrada:', table.displayName);
        
        // Verificar se a mesa tem qrCodeUrl
        if (!table.qrCodeUrl) {
            console.log('Gerando qrCodeUrl para a mesa');
            table.qrCodeUrl = table.generateQRCodeUrl();
            await table.save();
        }
        
        console.log('QR Code URL:', table.qrCodeUrl);
        
        // Gerar QR code como buffer
        console.log('Gerando QR code buffer...');
        const qrCodeBuffer = await QRCode.toBuffer(table.qrCodeUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        console.log('QR code buffer gerado, tamanho:', qrCodeBuffer.length);
        
        // Criar PDF
        console.log('Criando documento PDF...');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        // Configurar headers para download do PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QR-Mesa-${table.tableNumber}.pdf"`);
        
        console.log('Headers configurados, iniciando pipe...');
        
        // Pipe do PDF para a resposta
        doc.pipe(res);
        
        // Título
        doc.fontSize(20).text(table.storeId?.name || 'Restaurante', { align: 'center' });
        doc.moveDown();
        
        // Nome da mesa
        doc.fontSize(16).text(`${table.displayName}`, { align: 'center' });
        doc.moveDown();
        
        // QR Code
        console.log('Adicionando QR code ao PDF...');
        doc.image(qrCodeBuffer, {
            fit: [200, 200],
            align: 'center',
            valign: 'center'
        });
        
        doc.moveDown();
        
        // Instruções
        doc.fontSize(12).text('Escaneie o QR Code para acessar o cardápio', { align: 'center' });
        doc.text('e fazer seu pedido diretamente do seu celular', { align: 'center' });
        
        // Finalizar PDF
        console.log('Finalizando PDF...');
        doc.end();
        
        console.log('PDF gerado com sucesso!');
        
    } catch (error) {
        console.error('=== ERRO DETALHADO AO GERAR PDF INDIVIDUAL ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        // Verificar se a resposta já foi enviada
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Erro ao gerar PDF do QR code" });
        }
    }
};

// Imprimir QR codes para todas as mesas
const printAllQRCodes = async (req, res) => {
    try {
        console.log('=== INICIANDO IMPRESSÃO DE TODOS OS QR CODES ===');
        const storeId = req.user?.storeId || req.storeId;
        
        console.log('Store ID:', storeId);
        
        if (!storeId) {
            console.log('ID da loja não encontrado');
            return res.json({ success: false, message: "ID da loja não encontrado" });
        }
        
        const tables = await tableModel.find({ storeId, isActive: true })
            .sort({ tableNumber: 1 })
            .populate('storeId', 'name');
        
        console.log('Mesas encontradas:', tables.length);
        
        if (tables.length === 0) {
            console.log('Nenhuma mesa ativa encontrada');
            return res.json({ success: false, message: "Nenhuma mesa ativa encontrada" });
        }
        
        // Criar PDF
        console.log('Criando documento PDF...');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        // Configurar headers para download do PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QR-Codes-Todas-Mesas.pdf"`);
        
        console.log('Headers configurados, iniciando pipe...');
        
        // Pipe do PDF para a resposta
        doc.pipe(res);
        
        // Título principal
        doc.fontSize(20).text(tables[0].storeId?.name || 'Restaurante', { align: 'center' });
        doc.fontSize(16).text('QR Codes das Mesas', { align: 'center' });
        doc.moveDown(2);
        
        let currentY = doc.y;
        let currentX = 50;
        const qrSize = 150;
        const spacing = 20;
        const pageWidth = doc.page.width - 100; // Margem de 50 de cada lado
        const qrsPerRow = Math.floor(pageWidth / (qrSize + spacing));
        
        console.log('Configurações do layout:', { qrSize, spacing, pageWidth, qrsPerRow });
        
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            console.log(`Processando mesa ${i + 1}/${tables.length}: ${table.displayName}`);
            
            // Verificar se a mesa tem qrCodeUrl
            if (!table.qrCodeUrl) {
                console.log('Gerando qrCodeUrl para mesa:', table.displayName);
                table.qrCodeUrl = table.generateQRCodeUrl();
                await table.save();
            }
            
            // Gerar QR code como buffer
            console.log('Gerando QR code buffer para:', table.displayName);
            const qrCodeBuffer = await QRCode.toBuffer(table.qrCodeUrl, {
                width: qrSize,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log('QR code buffer gerado, tamanho:', qrCodeBuffer.length);
            
            // Verificar se precisa de nova página
            if (currentY + qrSize + 60 > doc.page.height - 50) {
                console.log('Adicionando nova página');
                doc.addPage();
                currentY = 50;
                currentX = 50;
            }
            
            // Verificar se precisa de nova linha
            if (i % qrsPerRow === 0 && i > 0) {
                currentY += qrSize + 60;
                currentX = 50;
            }
            
            // Nome da mesa
            doc.fontSize(12).text(table.displayName, currentX, currentY, {
                width: qrSize,
                align: 'center'
            });
            
            // QR Code
            console.log('Adicionando QR code ao PDF para:', table.displayName);
            doc.image(qrCodeBuffer, currentX, currentY + 20, {
                width: qrSize,
                height: qrSize
            });
            
            currentX += qrSize + spacing;
        }
        
        // Finalizar PDF
        console.log('Finalizando PDF...');
        doc.end();
        
        console.log('PDF de todos os QR codes gerado com sucesso!');
        
    } catch (error) {
        console.error('=== ERRO DETALHADO AO GERAR PDF DE TODOS OS QR CODES ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        // Verificar se a resposta já foi enviada
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Erro ao gerar PDF dos QR codes" });
        }
    }
};

// Imprimir QR code diretamente na impressora térmica (mesa específica)
const printTableQRCodeDirect = async (req, res) => {
    try {
        console.log('=== INICIANDO IMPRESSÃO DIRETA DE QR CODE INDIVIDUAL ===');
        const { tableId } = req.params;
        const storeId = req.user?.storeId || req.storeId;
        
        console.log('Table ID:', tableId);
        console.log('Store ID:', storeId);
        
        const table = await tableModel.findOne({ _id: tableId, storeId }).populate('storeId', 'name');
        
        if (!table) {
            console.log('Mesa não encontrada');
            return res.json({ success: false, message: "Mesa não encontrada" });
        }
        
        console.log('Mesa encontrada:', table.displayName);
        
        // Verificar se a mesa tem qrCodeUrl
        if (!table.qrCodeUrl) {
            console.log('Gerando qrCodeUrl para a mesa');
            table.qrCodeUrl = table.generateQRCodeUrl();
            await table.save();
        }
        
        console.log('QR Code URL:', table.qrCodeUrl);
        
        // Gerar QR code como buffer
        console.log('Gerando QR code buffer...');
        const qrCodeBuffer = await QRCode.toBuffer(table.qrCodeUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        console.log('QR code buffer gerado, tamanho:', qrCodeBuffer.length);
        
        // Integração com o serviço de impressão térmica
        const printData = {
            type: 'qr_code',
            storeName: table.storeId?.name || 'Restaurante',
            tableName: table.displayName,
            tableNumber: table.tableNumber,
            qrCodeBuffer: qrCodeBuffer.toString('base64'),
            instructions: [
                'Escaneie o QR Code para acessar o cardápio',
                'e fazer seu pedido diretamente do seu celular'
            ]
        };
        
        console.log('Dados preparados para impressão térmica');
        
        // Tentar imprimir via porta serial primeiro (mais comum para impressoras térmicas USB)
        try {
            const axios = (await import('axios')).default;
            const printResponse = await axios.post(`${process.env.BASE_URL || 'http://localhost:4000'}/api/print/print-qr-serial`, {
                qrData: printData,
                portPath: process.env.THERMAL_PRINTER_PORT || 'COM1'
            }, {
                headers: {
                    'Authorization': req.headers.authorization,
                    'Content-Type': 'application/json'
                }
            });
            
            if (printResponse.data.success) {
                console.log('QR code enviado para impressora térmica com sucesso');
                res.json({
                    success: true,
                    message: `QR code da ${table.displayName} impresso com sucesso!`,
                    printResult: printResponse.data
                });
            } else {
                throw new Error(printResponse.data.message || 'Erro na impressão');
            }
        } catch (printError) {
            console.log('Erro na impressão via serial, tentando Bluetooth...', printError.message);
            
            // Se falhar, tentar via Bluetooth
            try {
                const axios = (await import('axios')).default;
                const printResponse = await axios.post(`${process.env.BASE_URL || 'http://localhost:4000'}/api/print/print-qr`, {
                    qrData: printData
                }, {
                    headers: {
                        'Authorization': req.headers.authorization,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (printResponse.data.success) {
                    console.log('QR code enviado para impressora Bluetooth com sucesso');
                    res.json({
                        success: true,
                        message: `QR code da ${table.displayName} impresso via Bluetooth!`,
                        printResult: printResponse.data
                    });
                } else {
                    throw new Error(printResponse.data.message || 'Erro na impressão Bluetooth');
                }
            } catch (bluetoothError) {
                console.log('Erro na impressão via Bluetooth:', bluetoothError.message);
                
                // Se ambos falharem, retornar os dados para o frontend lidar
                res.json({
                    success: true,
                    message: `QR code da ${table.displayName} preparado (impressora não conectada)`,
                    data: printData,
                    warning: 'Impressora térmica não encontrada. Conecte uma impressora e tente novamente.'
                });
            }
        }
        
        console.log('Impressão direta de QR code concluída!');
        
    } catch (error) {
        console.error('=== ERRO DETALHADO AO IMPRIMIR QR CODE DIRETAMENTE ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({ success: false, message: "Erro ao imprimir QR code diretamente" });
    }
};

// Imprimir QR codes diretamente na impressora térmica (todas as mesas)
const printAllQRCodesDirect = async (req, res) => {
    try {
        console.log('=== INICIANDO IMPRESSÃO DIRETA DE TODOS OS QR CODES ===');
        const storeId = req.user?.storeId || req.storeId;
        
        console.log('Store ID:', storeId);
        
        if (!storeId) {
            console.log('ID da loja não encontrado');
            return res.json({ success: false, message: "ID da loja não encontrado" });
        }
        
        const tables = await tableModel.find({ storeId, isActive: true })
            .sort({ tableNumber: 1 })
            .populate('storeId', 'name');
        
        console.log('Mesas encontradas:', tables.length);
        
        if (tables.length === 0) {
            console.log('Nenhuma mesa ativa encontrada');
            return res.json({ success: false, message: "Nenhuma mesa ativa encontrada" });
        }
        
        const printDataArray = [];
        
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            console.log(`Processando mesa ${i + 1}/${tables.length}: ${table.displayName}`);
            
            // Verificar se a mesa tem qrCodeUrl
            if (!table.qrCodeUrl) {
                console.log('Gerando qrCodeUrl para mesa:', table.displayName);
                table.qrCodeUrl = table.generateQRCodeUrl();
                await table.save();
            }
            
            // Gerar QR code como buffer
            console.log('Gerando QR code buffer para:', table.displayName);
            const qrCodeBuffer = await QRCode.toBuffer(table.qrCodeUrl, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log('QR code buffer gerado, tamanho:', qrCodeBuffer.length);
            
            const tableData = {
                type: 'qr_code',
                storeName: tables[0].storeId?.name || 'Restaurante',
                tableName: table.displayName,
                tableNumber: table.tableNumber,
                qrCodeBuffer: qrCodeBuffer.toString('base64'),
                instructions: [
                    'Escaneie o QR Code para acessar o cardápio',
                    'e fazer seu pedido diretamente do seu celular'
                ]
            };
            
            printDataArray.push(tableData);
        }
        
        console.log('Dados preparados para impressão térmica de todas as mesas');
        
        // Tentar imprimir todas as mesas via impressora térmica
        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        for (const tableData of printDataArray) {
            try {
                const axios = (await import('axios')).default;
                const printResponse = await axios.post(`${process.env.BASE_URL || 'http://localhost:4000'}/api/print/print-qr-serial`, {
                    qrData: tableData,
                    portPath: process.env.THERMAL_PRINTER_PORT || 'COM1'
                }, {
                    headers: {
                        'Authorization': req.headers.authorization,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (printResponse.data.success) {
                    successCount++;
                    results.push({ table: tableData.tableName, status: 'success', method: 'serial' });
                    console.log(`QR code da ${tableData.tableName} impresso com sucesso via serial`);
                } else {
                    throw new Error(printResponse.data.message || 'Erro na impressão serial');
                }
            } catch (serialError) {
                console.log(`Erro na impressão serial para ${tableData.tableName}, tentando Bluetooth...`);
                
                // Tentar via Bluetooth se serial falhar
                try {
                    const axios = (await import('axios')).default;
                    const printResponse = await axios.post(`${process.env.BASE_URL || 'http://localhost:4000'}/api/print/print-qr`, {
                        qrData: tableData
                    }, {
                        headers: {
                            'Authorization': req.headers.authorization,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (printResponse.data.success) {
                        successCount++;
                        results.push({ table: tableData.tableName, status: 'success', method: 'bluetooth' });
                        console.log(`QR code da ${tableData.tableName} impresso com sucesso via Bluetooth`);
                    } else {
                        throw new Error(printResponse.data.message || 'Erro na impressão Bluetooth');
                    }
                } catch (bluetoothError) {
                    errorCount++;
                    results.push({ table: tableData.tableName, status: 'error', error: bluetoothError.message });
                    console.log(`Erro na impressão da ${tableData.tableName}:`, bluetoothError.message);
                }
            }
        }
        
        const message = successCount > 0 
            ? `${successCount} QR codes impressos com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ''}!`
            : `Falha na impressão de todos os QR codes. Verifique se a impressora está conectada.`;
        
        res.json({
            success: successCount > 0,
            message: message,
            data: printDataArray,
            results: results,
            totalTables: tables.length,
            successCount: successCount,
            errorCount: errorCount,
            warning: errorCount > 0 ? 'Algumas impressões falharam. Verifique a conexão da impressora.' : null
        });
        
        console.log('Impressão direta de todos os QR codes concluída!');
        
    } catch (error) {
        console.error('=== ERRO DETALHADO AO IMPRIMIR TODOS OS QR CODES DIRETAMENTE ===');
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({ success: false, message: "Erro ao imprimir QR codes diretamente" });
    }
};

export {
    createTable,
    listTables,
    getTable,
    updateTable,
    deleteTable,
    generateQRCode,
    generateAllQRCodes,
    getTableByQRCode,
    printTableQRCode,
    printAllQRCodes,
    printTableQRCodeDirect,
    printAllQRCodesDirect
};
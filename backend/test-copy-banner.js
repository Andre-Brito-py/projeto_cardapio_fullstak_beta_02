import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testando cópia do banner padrão...');

// Caminhos
const iconsPath = path.join(__dirname, '..', 'icons');
const uploadsPath = path.join(__dirname, 'uploads');
const bannerSource = path.join(iconsPath, 'banner_principal.png');
const bannerDest = path.join(uploadsPath, 'banner_principal.png');

console.log('📁 Caminho dos ícones:', iconsPath);
console.log('📁 Caminho do uploads:', uploadsPath);
console.log('📄 Banner origem:', bannerSource);
console.log('📄 Banner destino:', bannerDest);

// Verificar se o arquivo de origem existe
if (fs.existsSync(bannerSource)) {
    console.log('✅ Banner de origem encontrado!');
    
    // Criar pasta uploads se não existir
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('📁 Pasta uploads criada');
    }
    
    // Copiar o arquivo
    try {
        fs.copyFileSync(bannerSource, bannerDest);
        console.log('✅ Banner copiado com sucesso!');
        
        // Verificar se foi copiado
        if (fs.existsSync(bannerDest)) {
            console.log('✅ Banner confirmado no destino!');
        } else {
            console.log('❌ Banner não encontrado no destino após cópia');
        }
    } catch (error) {
        console.error('❌ Erro ao copiar banner:', error);
    }
} else {
    console.log('❌ Banner de origem não encontrado!');
    console.log('📁 Listando conteúdo da pasta icons:');
    try {
        const files = fs.readdirSync(iconsPath);
        files.forEach(file => console.log('  -', file));
    } catch (error) {
        console.error('❌ Erro ao listar pasta icons:', error);
    }
}

console.log('🏁 Teste concluído!');
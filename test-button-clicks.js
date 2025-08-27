// Script para testar cliques nos botões da tabela de lojas
// Execute este script no console do navegador na página do StoreManagement

console.log('🧪 Iniciando teste de cliques nos botões...');

// Função para testar se os botões estão clicáveis
function testButtonClicks() {
    const buttons = document.querySelectorAll('.stores-table .actions button');
    
    console.log(`📊 Encontrados ${buttons.length} botões na tabela`);
    
    if (buttons.length === 0) {
        console.log('❌ Nenhum botão encontrado na tabela!');
        return;
    }
    
    buttons.forEach((button, index) => {
        const buttonType = button.className.includes('edit-btn') ? 'Editar' :
                          button.className.includes('toggle-btn') ? 'Ativar/Desativar' :
                          button.className.includes('delete-btn') ? 'Excluir' : 'Desconhecido';
        
        console.log(`🔍 Botão ${index + 1}: ${buttonType}`);
        console.log(`   - Disabled: ${button.disabled}`);
        console.log(`   - Display: ${getComputedStyle(button).display}`);
        console.log(`   - Visibility: ${getComputedStyle(button).visibility}`);
        console.log(`   - Pointer Events: ${getComputedStyle(button).pointerEvents}`);
        console.log(`   - Z-Index: ${getComputedStyle(button).zIndex}`);
        console.log(`   - Position: ${getComputedStyle(button).position}`);
        
        // Verificar se há elementos sobrepondo
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        
        if (elementAtPoint === button) {
            console.log(`   ✅ Botão está acessível para clique`);
        } else {
            console.log(`   ❌ Elemento sobrepondo: ${elementAtPoint?.tagName} (${elementAtPoint?.className})`);
        }
        
        // Adicionar listener de teste
        const testListener = (e) => {
            console.log(`🎯 Clique detectado no botão ${buttonType}!`);
            e.preventDefault();
            e.stopPropagation();
        };
        
        button.addEventListener('click', testListener, { once: true });
        console.log(`   📝 Listener de teste adicionado`);
    });
}

// Função para verificar sobreposições de z-index
function checkZIndexIssues() {
    console.log('🔍 Verificando problemas de z-index...');
    
    const allElements = document.querySelectorAll('*');
    const highZIndexElements = [];
    
    allElements.forEach(el => {
        const zIndex = getComputedStyle(el).zIndex;
        if (zIndex !== 'auto' && parseInt(zIndex) > 50) {
            highZIndexElements.push({
                element: el,
                zIndex: parseInt(zIndex),
                className: el.className,
                tagName: el.tagName
            });
        }
    });
    
    highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);
    
    console.log(`📊 Elementos com z-index alto (>50):`);
    highZIndexElements.forEach(item => {
        console.log(`   - ${item.tagName}.${item.className}: z-index ${item.zIndex}`);
    });
}

// Função para verificar se há overlays ativos
function checkActiveOverlays() {
    console.log('🔍 Verificando overlays ativos...');
    
    const overlays = document.querySelectorAll('.store-form-overlay, .sidebar-backdrop, .overlay');
    
    if (overlays.length === 0) {
        console.log('✅ Nenhum overlay encontrado');
    } else {
        overlays.forEach((overlay, index) => {
            const isVisible = getComputedStyle(overlay).display !== 'none' && 
                             getComputedStyle(overlay).visibility !== 'hidden' &&
                             getComputedStyle(overlay).opacity !== '0';
            
            console.log(`   Overlay ${index + 1}: ${overlay.className}`);
            console.log(`   - Visível: ${isVisible}`);
            console.log(`   - Z-Index: ${getComputedStyle(overlay).zIndex}`);
            
            if (isVisible) {
                console.log('❌ Overlay ativo pode estar bloqueando cliques!');
            }
        });
    }
}

// Função para simular clique em um botão específico
function simulateClick(buttonIndex = 0) {
    const buttons = document.querySelectorAll('.stores-table .actions button');
    
    if (buttons[buttonIndex]) {
        console.log(`🎯 Simulando clique no botão ${buttonIndex + 1}...`);
        
        // Tentar diferentes tipos de eventos
        const events = ['mousedown', 'mouseup', 'click'];
        
        events.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            const result = buttons[buttonIndex].dispatchEvent(event);
            console.log(`   ${eventType}: ${result ? 'Sucesso' : 'Bloqueado'}`);
        });
    } else {
        console.log('❌ Botão não encontrado!');
    }
}

// Executar todos os testes
console.log('🚀 Executando bateria de testes...');
console.log('\n1. Testando cliques nos botões:');
testButtonClicks();

console.log('\n2. Verificando z-index:');
checkZIndexIssues();

console.log('\n3. Verificando overlays:');
checkActiveOverlays();

console.log('\n📝 Instruções:');
console.log('- Para simular um clique: simulateClick(0) // 0 = primeiro botão');
console.log('- Para re-executar testes: testButtonClicks()');
console.log('- Tente clicar nos botões e observe os logs no console');

// Disponibilizar funções globalmente para uso manual
window.testButtonClicks = testButtonClicks;
window.simulateClick = simulateClick;
window.checkZIndexIssues = checkZIndexIssues;
window.checkActiveOverlays = checkActiveOverlays;

console.log('\n✅ Script de teste carregado! Funções disponíveis: testButtonClicks(), simulateClick(), checkZIndexIssues(), checkActiveOverlays()');
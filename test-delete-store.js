async function testDeleteStore() {
    const baseUrl = 'http://localhost:4000';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWRjZDFhOWVjYTViNmM4NTU5MGQxNyIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc1NjMxMzIyMywiZXhwIjoxNzU2OTE4MDIzfQ.TIv2Ei0VDxA04mtM4QD3jhUiOgP1f8lEQqbASnORFgo';
    
    try {
        // Primeiro, listar as lojas para pegar um ID
        console.log('=== LISTANDO LOJAS ===');
        const listResponse = await fetch(`${baseUrl}/api/system/stores`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const listData = await listResponse.json();
        console.log('Status da listagem:', listResponse.status);
        console.log('Dados das lojas:', JSON.stringify(listData, null, 2));
        
        if (listData.success && listData.data.stores.length > 0) {
            const storeId = listData.data.stores[0]._id;
            console.log('\n=== TESTANDO EXCLUSÃO ===');
            console.log('Store ID para teste:', storeId);
            
            // Tentar excluir a primeira loja
            const deleteResponse = await fetch(`${baseUrl}/api/system/stores/${storeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Status da exclusão:', deleteResponse.status);
            console.log('Headers da resposta:', Object.fromEntries(deleteResponse.headers.entries()));
            
            const responseText = await deleteResponse.text();
            console.log('Resposta bruta:', responseText);
            
            try {
                const deleteData = JSON.parse(responseText);
                console.log('Resposta da exclusão (JSON):', JSON.stringify(deleteData, null, 2));
            } catch (parseError) {
                console.log('Erro ao fazer parse do JSON:', parseError.message);
                console.log('Resposta não é JSON válido');
            }
        } else {
            console.log('Nenhuma loja encontrada para testar exclusão');
        }
        
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

testDeleteStore();
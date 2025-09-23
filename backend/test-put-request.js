const http = require('http');

const data = JSON.stringify({
    name: 'Loja Teste Atualizada',
    description: 'Teste de interceptação PUT'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/system/stores/3',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Fazendo requisição PUT para:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('Resposta:', responseData);
    });
});

req.on('error', (e) => {
    console.error('Erro na requisição:', e.message);
});

req.write(data);
req.end();
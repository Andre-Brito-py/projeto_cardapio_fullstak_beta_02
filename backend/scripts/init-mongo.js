// Script de inicialização do MongoDB
// Este script é executado automaticamente quando o container do MongoDB é criado

print('Iniciando configuração do banco de dados...');

// Conectar ao banco de dados principal
db = db.getSiblingDB('food-delivery-multitenant');

// Criar usuário para a aplicação
db.createUser({
  user: 'fooddelivery',
  pwd: 'fooddelivery123',
  roles: [
    {
      role: 'readWrite',
      db: 'food-delivery-multitenant'
    }
  ]
});

// Criar coleções básicas
db.createCollection('users');
db.createCollection('stores');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('categories');
db.createCollection('banners');
db.createCollection('telegramcontacts');
db.createCollection('telegramcampaigns');

// Criar índices para performance
db.users.createIndex({ email: 1 }, { unique: true });
db.stores.createIndex({ subdomain: 1 }, { unique: true });
db.products.createIndex({ storeId: 1 });
db.orders.createIndex({ storeId: 1 });
db.categories.createIndex({ storeId: 1 });
db.banners.createIndex({ storeId: 1 });
db.telegramcontacts.createIndex({ storeId: 1 });
db.telegramcampaigns.createIndex({ storeId: 1 });

print('Configuração do banco de dados concluída!');
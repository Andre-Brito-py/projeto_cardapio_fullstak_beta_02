import axios from 'axios';

// Serviço para comunicação com o backend
class BackendService {
  constructor() {
    this.baseUrl = 'http://localhost:4000/api';
    this.token = localStorage.getItem('token');
  }

  // Configurar headers com token
  getHeaders() {
    // Sempre buscar o token mais atual do localStorage
    const currentToken = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Atualizar token
  updateToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // === OPERAÇÕES DO CARDÁPIO ===
  
  // Listar todos os produtos do cardápio
  async getMenuItems() {
    try {
      const response = await axios.get(`${this.baseUrl}/food/admin/list`, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao buscar cardápio'
      };
    }
  }

  // Atualizar status de disponibilidade de um produto
  async updateItemAvailability(itemId, available) {
    try {
      const response = await axios.put(`${this.baseUrl}/food/stock-status`, {
        foodId: itemId,
        available: available
      }, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        message: `Item ${available ? 'disponibilizado' : 'marcado como indisponível'} com sucesso`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao atualizar disponibilidade'
      };
    }
  }

  // Atualizar preço de um produto
  async updateItemPrice(itemId, newPrice) {
    try {
      const response = await axios.put(`${this.baseUrl}/food/update`, {
        id: itemId,
        price: newPrice
      }, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        message: `Preço atualizado para R$ ${newPrice.toFixed(2)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao atualizar preço'
      };
    }
  }

  // Adicionar novo item ao cardápio
  async addMenuItem(itemData) {
    try {
      const formData = new FormData();
      Object.keys(itemData).forEach(key => {
        formData.append(key, itemData[key]);
      });

      const response = await axios.post(`${this.baseUrl}/food/add`, formData, {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        message: 'Item adicionado ao cardápio com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao adicionar item'
      };
    }
  }

  // Remover item do cardápio
  async removeMenuItem(itemId) {
    try {
      const response = await axios.post(`${this.baseUrl}/food/remove`, {
        id: itemId
      }, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        message: 'Item removido do cardápio com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao remover item'
      };
    }
  }

  // === OPERAÇÕES DE PEDIDOS ===
  
  // Listar pedidos em andamento
  async getActiveOrders() {
    try {
      const response = await axios.get(`${this.baseUrl}/order/list`, {
        headers: this.getHeaders()
      });
      
      // Filtrar apenas pedidos em andamento
      const activeOrders = response.data.data?.filter(order => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      ) || [];
      
      return {
        success: true,
        data: activeOrders
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao buscar pedidos'
      };
    }
  }

  // Listar todos os pedidos
  async getAllOrders() {
    try {
      const response = await axios.get(`${this.baseUrl}/order/list`, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao buscar pedidos'
      };
    }
  }

  // === OPERAÇÕES DE RELATÓRIOS ===
  
  // Gerar relatório diário
  async getDailyReport() {
    try {
      const response = await axios.get(`${this.baseUrl}/liza/daily-report`, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        data: response.data.report
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao gerar relatório'
      };
    }
  }

  // === OPERAÇÕES DE BUSCA ===
  
  // Buscar item do cardápio por nome
  async findMenuItem(itemName) {
    try {
      const menuResult = await this.getMenuItems();
      if (!menuResult.success) {
        return menuResult;
      }

      const items = menuResult.data.filter(item => 
        item.name.toLowerCase().includes(itemName.toLowerCase())
      );

      return {
        success: true,
        data: items,
        found: items.length > 0
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar item no cardápio'
      };
    }
  }

  // Buscar pedido por ID
  async findOrder(orderId) {
    try {
      const ordersResult = await this.getAllOrders();
      if (!ordersResult.success) {
        return ordersResult;
      }

      const order = ordersResult.data.find(order => 
        order._id === orderId || order.id === orderId
      );

      return {
        success: true,
        data: order,
        found: !!order
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar pedido'
      };
    }
  }
}

export default new BackendService();
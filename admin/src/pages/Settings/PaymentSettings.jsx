import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PaymentSettings = () => {
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availablePaymentMethods = [
    { value: 'dinheiro', label: '💵 Dinheiro', description: 'Pagamento em dinheiro' },
    { value: 'pix', label: '💳 PIX', description: 'Pagamento via PIX' },
    { value: 'cartao_credito', label: '💳 Cartão de Crédito', description: 'Pagamento com cartão de crédito' },
    { value: 'cartao_debito', label: '💳 Cartão de Débito', description: 'Pagamento com cartão de débito' },
    { value: 'vale_refeicao', label: '🍽️ Vale Refeição', description: 'Vale refeição (Sodexo, Ticket, etc.)' },
    { value: 'vale_alimentacao', label: '🛒 Vale Alimentação', description: 'Vale alimentação (Sodexo, Ticket, etc.)' }
  ];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await axios.get('/api/settings/payment-methods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAcceptedPaymentMethods(response.data.acceptedPaymentMethods || []);
      }
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      toast.error('Erro ao carregar configurações de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodToggle = (methodValue) => {
    setAcceptedPaymentMethods(prev => {
      if (prev.includes(methodValue)) {
        // Não permitir desmarcar se for o último método
        if (prev.length === 1) {
          toast.warning('Pelo menos uma forma de pagamento deve estar ativa');
          return prev;
        }
        return prev.filter(method => method !== methodValue);
      } else {
        return [...prev, methodValue];
      }
    });
  };

  const handleSave = async () => {
    if (acceptedPaymentMethods.length === 0) {
      toast.error('Selecione pelo menos uma forma de pagamento');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await axios.post('/api/settings/payment-methods', {
        acceptedPaymentMethods
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Configurações de pagamento salvas com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar formas de pagamento:', error);
      toast.error('Erro ao salvar configurações de pagamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Configurações de Pagamento
              </h5>
              <p className="text-muted mb-0 mt-2">
                Selecione as formas de pagamento que sua loja aceita. Essas opções aparecerão no sistema de balcão.
              </p>
            </div>
            <div className="card-body">
              <div className="row">
                {availablePaymentMethods.map(method => (
                  <div key={method.value} className="col-md-6 col-lg-4 mb-3">
                    <div className={`card h-100 ${acceptedPaymentMethods.includes(method.value) ? 'border-success' : 'border-light'}`}>
                      <div className="card-body d-flex flex-column">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`payment-${method.value}`}
                            checked={acceptedPaymentMethods.includes(method.value)}
                            onChange={() => handleMethodToggle(method.value)}
                          />
                          <label className="form-check-label fw-bold" htmlFor={`payment-${method.value}`}>
                            {method.label}
                          </label>
                        </div>
                        <p className="text-muted small mb-0">{method.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      {acceptedPaymentMethods.length} forma(s) de pagamento selecionada(s)
                    </small>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving || acceptedPaymentMethods.length === 0}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Salvar Configurações
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
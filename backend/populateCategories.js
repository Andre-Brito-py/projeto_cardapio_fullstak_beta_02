import { addCategory } from './controllers/categoryController.js';

// Dados das categorias iniciais baseadas no menu_list original
const initialCategories = [
    {
        name: "Salad",
        description: "Fresh and healthy salads",
        image: "menu_1.svg"
    },
    {
        name: "Rolls",
        description: "Delicious rolls and wraps",
        image: "menu_2.svg"
    },
    {
        name: "Deserts",
        description: "Sweet desserts and treats",
        image: "menu_3.svg"
    },
    {
        name: "Sandwich",
        description: "Tasty sandwiches",
        image: "menu_4.svg"
    },
    {
        name: "Cake",
        description: "Delicious cakes for all occasions",
        image: "menu_5.svg"
    },
    {
        name: "Pure Veg",
        description: "Pure vegetarian dishes",
        image: "menu_6.svg"
    },
    {
        name: "Pasta",
        description: "Italian pasta dishes",
        image: "menu_7.svg"
    },
    {
        name: "Noodles",
        description: "Asian noodle dishes",
        image: "menu_8.svg"
    }
];

// Função para popular as categorias
export const populateInitialCategories = () => {
    console.log('Populando categorias iniciais...');
    
    initialCategories.forEach((category, index) => {
        // Simular req e res objects
        const mockReq = {
            body: {
                name: category.name,
                description: category.description
            },
            file: {
                filename: category.image
            }
        };
        
        const mockRes = {
            json: (response) => {
                if (response.success) {
                    console.log(`✅ Categoria '${category.name}' adicionada com sucesso`);
                } else {
                    console.log(`❌ Erro ao adicionar categoria '${category.name}': ${response.message}`);
                }
            }
        };
        
        // Adicionar categoria com delay para evitar conflitos
        setTimeout(() => {
            addCategory(mockReq, mockRes);
        }, index * 100);
    });
    
    console.log('Processo de população de categorias iniciado!');
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    populateInitialCategories();
}
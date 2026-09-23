# 🚗 Carona Bairro - MVP de Carona Comunitária

Uma aplicação web simples, moderna e otimizada para mobile que conecta moradores de um bairro a motoristas que fazem trajetos regulares (ex: do bairro ao centro). O foco é facilitar a reserva de vagas via WhatsApp sem necessidade de back-end complexo ou login de usuários.

## ✨ Funcionalidades

### Para Passageiros
- **Visualização de Horários:** Lista clara de caronas disponíveis com horário, motorista, carro e valor.
- **Indicador de Vagas:** Visualização em tempo real de assentos livres (com cores para poucas vagas ou lotado).
- **Reserva Rápida:** Formulário simples (Nome e WhatsApp) que abre diretamente uma conversa no WhatsApp do motorista com a mensagem pré-preenchida.
- **Design Mobile-First:** Interface pensada primariamente para uso em celulares.

### Para Motoristas (Novo!)
- **Cadastro de Carona:** Painel acessível na própria página para cadastrar nova viagem.
- **Dados Personalizados:** O motorista define seu nome, telefone, modelo do carro, horário, valor e número de vagas.
- **Contato Direto:** Cada card de carona direciona o passageiro especificamente para o WhatsApp daquele motorista.

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica.
- **CSS3:** Estilização responsiva, variáveis CSS e layout moderno (sem frameworks pesados).
- **JavaScript (Vanilla):** Lógica de renderização, manipulação do DOM e persistência local (`localStorage`).
- **WhatsApp API:** Redirecionamento inteligente via link `wa.me`.

## 🚀 Como Hospedar no Vercel

Este projeto é estático e extremamente leve, perfeito para hospedagem gratuita no Vercel.

1. **Crie um repositório no GitHub** com os arquivos deste projeto (`index.html`, `style.css`, `javascript.js`).
2. **Acesse [Vercel.com](https://vercel.com)** e faça login.
3. Clique em **"Add New Project"**.
4. Importe o repositório do GitHub que você acabou de criar.
5. Clique em **"Deploy"**.

Pronto! Em segundos seu site estará no ar com HTTPS automático.

## ⚙️ Configuração Inicial

Embora o sistema permita cadastro dinâmico de motoristas via interface, você pode definir dados iniciais ou configurar o comportamento padrão editando o arquivo `javascript.js`.

Abra o arquivo `javascript.js` e localize a seção de configuração:

```javascript
// Configurações Globais
const CONFIG = {
  // Se não houver nenhuma carona cadastrada, estas serão as padrão
  defaultRides: [
    {
      id: 1,
      driverName: "João Silva",
      driverPhone: "5511999999999", // Formato internacional sem + ou traços
      carModel: "Toyota Corolla",
      time: "06:30",
      price: 5.00,
      totalSeats: 4,
      availableSeats: 2
    },
    // ... mais carros
  ]
};
```

> **Nota sobre Telefones:** Para o redirecionamento do WhatsApp funcionar corretamente, os números devem estar no formato internacional apenas com dígitos (ex: `5511999998888` para Brasil + DDD + Número).

## 💾 Persistência de Dados

Atualmente, o aplicativo utiliza o **`localStorage`** do navegador para salvar as caronas cadastradas pelos motoristas.
- **Vantagem:** Não requer banco de dados, servidor ou configuração complexa. Funciona imediatamente.
- **Limitação:** Os dados ficam salvos apenas no dispositivo/navegador de quem cadastrou. Se o motorista limpar o cache do navegador, os dados somem.
- **Uso Ideal:** Este MVP é perfeito para comunidades pequenas onde o administrador cadastra as rotas iniciais e os usuários apenas consomem a informação, ou para testes de validação de ideia.

Para um produto final escalável onde todos veem as mesmas rotas independentemente do dispositivo, seria necessário integrar com um banco de dados (como Firebase ou Supabase).

## 🎨 Personalização Visual

As cores e fontes podem ser alteradas facilmente no início do arquivo `style.css` através de variáveis CSS:

```css
:root {
  --primary-color: #10b981; /* Verde principal */
  --secondary-color: #064e3b; /* Verde escuro */
  --accent-color: #f59e0b; /* Laranja para alertas */
  --bg-color: #f3f4f6;
  --text-color: #1f2937;
  --card-bg: #ffffff;
}
```

## 📄 Estrutura de Arquivos

```
/
├── index.html        # Estrutura da página
├── style.css         # Estilos e responsividade
├── javascript.js     # Lógica de negócios e interação
└── README.md         # Documentação do projeto
```

## 🤝 Contribuição

Sinta-se à vontade para fazer fork e melhorar este projeto. Sugestões de melhorias futuras:
- Integração com Firebase para banco de dados em tempo real.
- Sistema de avaliação de motoristas.
- Filtro por dias da semana (Segunda, Quarta, Sexta).

## 📫 Licença

Este projeto é open source e pode ser utilizado livremente para fins educacionais e comerciais.

---

Desenvolvido com ❤️ para fortalecer a comunidade do bairro.

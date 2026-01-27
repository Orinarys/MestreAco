# Mestre Aço SP - Sistema de Gestão de Produção v2.0

Este é um sistema moderno de gestão de pedidos e produção desenvolvido em **React** com **Tailwind CSS**. Ele foi estruturado para ser facilmente utilizado no VS Code e oferece uma interface profissional e intuitiva.

## 🚀 Como rodar o projeto

Para rodar este projeto no seu computador, siga os passos abaixo:

1. **Pré-requisitos:**
   - Tenha o [Node.js](https://nodejs.org/) instalado.
   - Tenha o [VS Code](https://code.visualstudio.com/) instalado.

2. **Instalação:**
   - Abra a pasta do projeto no VS Code.
   - Abra o terminal (Ctrl + `) e digite:
     ```bash
     npm install
     ```

3. **Execução:**
   - No terminal, digite:
     ```bash
     npm start
     ```
   - O sistema abrirá automaticamente no seu navegador em `http://localhost:3000`.

## 📂 Estrutura de Pastas

- `src/components/`: Componentes visuais (Dashboard, Configurações).
- `src/hooks/`: Lógica de persistência de dados (LocalStorage).
- `src/utils/`: Constantes e configurações globais (Vendedores, Tipos de Telha).
- `src/App.js`: Componente principal e lógica de pedidos.
- `public/`: Arquivos estáticos e HTML base.

## ✨ Melhorias Implementadas

- **Modularização:** Código dividido em componentes para facilitar a manutenção.
- **Interface Moderna:** Design limpo usando Tailwind CSS com feedback visual.
- **Persistência Robusta:** Uso de Hooks customizados para salvar dados no navegador.
- **Dashboard Aprimorado:** Visualização clara de métricas por vendedor e por tipo de EPS.
- **Configurações Flexíveis:** Ajuste de produtividade (m/h) diretamente na interface.

## 💾 Backup de Dados

O sistema salva tudo localmente no seu navegador. Recomendamos usar a função **Exportar** regularmente para criar arquivos de backup (.json) que podem ser restaurados a qualquer momento usando a função **Importar**.

---
Desenvolvido para **Mestre Aço SP**.

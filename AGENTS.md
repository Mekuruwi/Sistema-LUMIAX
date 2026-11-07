# Orientações do projeto

## Objetivo do produto

Este sistema gerencia a demanda mensal de clientes. A prioridade inicial é importar, validar, processar e persistir os dados; as análises do dashboard serão desenvolvidas depois que esse fluxo estiver confiável.

O fluxo principal deve ser claro e rastreável:

1. Importar as bases de apoio em `.xlsx`, `.xls` ou `.csv`.
2. Selecionar o mês/ano e importar o arquivo de demanda correspondente.
3. Validar o arquivo e apresentar um resumo dos dados válidos e dos problemas encontrados.
4. Processar e salvar os dados somente depois das validações necessárias, sem deixar uma importação incompleta aparentar sucesso.
5. Exibir o resultado da operação, incluindo quantidades processadas, ignoradas e erros com referência à linha ou ao campo quando possível.

Não invente nomes de colunas, regras de negócio, chaves de identificação, tratamento de duplicidades ou política para reimportar um mês. Confirme esses detalhes a partir dos arquivos e requisitos disponíveis antes de implementá-los. Associe cada importação de demanda ao seu período e torne explícito o que acontece ao reprocessar o mesmo período.

## Páginas e escopo

Manter a navegação principal com estas páginas:

- **Dashboard:** inicialmente exibir um estado vazio informativo ou o status das importações. Não criar indicadores, gráficos ou dados fictícios; análises entram em uma etapa posterior.
- **Importação:** concentrar o fluxo das bases de apoio e dos arquivos mensais de demanda, deixando claro o tipo de arquivo, período, validação, processamento e resultado.
- **Saúde do sistema:** apresentar diagnóstico e estado operacional, sem misturar com análises da demanda.
- **Tabelas:** organizar consulta e manutenção das tabelas de apoio e dos dados importados, conforme as regras confirmadas.
- **Configurações:** reunir preferências e configurações do sistema, seguindo os padrões visuais da referência.

Não acrescentar páginas ou funcionalidades de negócio fora desse escopo sem necessidade confirmada.

## Referência visual e experiência

Usar `C:\Sites\Funil versão 2` como referência visual. Reproduzir a linguagem visual, não as regras ou entidades do funil comercial.

- Manter uma aplicação desktop organizada em barra de título e navegação lateral recolhível; destacar a página ativa e usar ícones consistentes do Lucide.
- Adotar como tema padrão o estilo corporativo da referência: fundo `#FFFFFF`, superfície secundária `#F3F4F6`, texto principal `#1B2A4E`, texto secundário `#6B7280`, borda `#E5E7EB` e destaque `#1B2A4E`.
- Dar suporte aos temas claro e escuro usando tokens de cor centralizados, sem espalhar cores fixas pelos componentes. No modo escuro corporativo, usar como base `#111827`, `#1F2937`, `#F9FAFB`, `#B8C0D4`, `#374151` e destaque `#818CF8`.
- Reutilizar o padrão da referência de cabeçalhos claros, superfícies com bordas discretas, cartões de cantos arredondados, espaçamento consistente e estados de interação contidos. Evitar gradientes, sombras pesadas ou uma identidade visual diferente.
- Na importação, oferecer seleção de arquivo e arrastar/soltar, indicar nome e tamanho do arquivo, desabilitar ações durante o processamento e comunicar estados de carregamento, sucesso e erro em português.
- Manter conteúdo rolável dentro da página, preservar a navegação e oferecer estados vazios e mensagens de erro compreensíveis. Usar controles acessíveis, rótulos visíveis e estados de foco; respeitar `prefers-reduced-motion`.

Consultar `src/index.css`, `src/components/Sidebar.tsx`, `src/App.tsx` e as páginas de importação e configurações da referência para detalhes de implementação quando a pasta estiver disponível. Não copiar textos, nomes de negócio ou funcionalidades exclusivas do funil.

## Arquitetura e dados

- Antes de alterar, inspecione a estrutura, dependências e convenções já existentes neste repositório; preserve o que já estiver estabelecido.
- Se o projeto ainda estiver sendo iniciado, alinhar a implementação à base da referência: Electron, React, TypeScript, Vite, Tailwind CSS, Zustand e Lucide React. Para persistência local, preferir SQLite atrás de uma camada de serviço.
- Usar Knex como query builder e camada de acesso relacional, não como modelo de domínio nem como API exposta à interface. Definir um contrato `DatabaseAdapter` com operações tipadas do domínio e uma implementação base `KnexDatabaseAdapter` para operações compartilhadas; manter configuração de driver e diferenças específicas nos adaptadores concretos.
- Criar uma `DatabaseFactory` que receba configuração validada e selecione explicitamente o adaptador. Para SQLite, seguir a combinação de Knex com `better-sqlite3` da referência. Só adicionar outros drivers/provedores quando fizerem parte do escopo confirmado; provedores sem suporte compatível no Knex devem ter adaptador próprio, sem simular compatibilidade.
- Centralizar o ciclo de vida da conexão (criação, teste, conexão e encerramento) no processo principal. Criar/atualizar o esquema com migrações versionadas e reprodutíveis; manter consultas parametrizadas, chaves/índices coerentes com as regras confirmadas e transações para operações de lote.
- Deixar tabelas, colunas, restrições e unicidade dependerem do modelo de dados aprovado. Não copiar o esquema `funil` da referência: definir entidades próprias para bases de apoio, demanda mensal e histórico de importações, sem presumir nomes de campo ainda não confirmados.
- Separar interface, leitura/normalização de planilhas, validação e persistência. Componentes de página não devem conter consultas SQL nem concentrar todo o processamento de arquivos.
- Tratar arquivos importados como entrada não confiável: verificar formato, estrutura, campos obrigatórios e valores antes de persistir. Mostrar erros por linha e não descartar registros silenciosamente.
- Persistir cada lote de forma transacional quando o banco utilizado permitir. Registrar informações suficientes para identificar o arquivo, o período, a data, o resultado e as contagens da importação, respeitando o modelo de dados definido para o produto.
- Se usar Electron, manter o acesso ao banco no processo principal, expor apenas operações necessárias por IPC validado e preservar isolamento de contexto. Não habilitar acesso direto do renderer a Node.js ou ao banco.
- Não salvar credenciais ou dados sensíveis em texto puro. Não registrar conteúdo de planilhas nem informações pessoais em logs de diagnóstico.

## Roteiro de implementação

Implementar na ordem abaixo. Cada etapa deve estar funcional e validada antes de avançar; não antecipar gráficos ou análises do dashboard.

1. **Descoberta dos arquivos e regras de negócio**
   - Reunir exemplos reais de cada base de apoio e arquivo mensal; identificar formatos, cabeçalhos, tipos de dados, campos obrigatórios, chaves, relações e variações entre meses.
   - Definir com o responsável o período, comportamento de reimportação, critérios de duplicidade, tratamento de linhas inválidas e se a importação parcial pode ser aceita.
   - **Conclusão:** regras e exemplos documentados, com dúvidas sobre dados ou decisões de sobrescrita resolvidas antes de criar o esquema definitivo.

2. **Estrutura da aplicação e navegação**
   - Inspecionar o repositório e criar ou completar a estrutura Electron/React/TypeScript já adotada no projeto, preservando as convenções existentes.
   - Montar as páginas Dashboard, Importação, Saúde do sistema, Tabelas e Configurações e a navegação lateral no estilo da referência. O Dashboard fica em estado vazio/status, sem métricas inventadas.
   - **Conclusão:** aplicação inicia, todas as páginas abrem e a navegação mantém o padrão visual definido neste arquivo.

3. **Modelo de dados, conexão e adaptador Knex**
   - Definir o modelo relacional a partir das regras aprovadas: bases de apoio, registros de demanda associados ao período e metadados/histórico das importações.
   - Implementar o contrato tipado `DatabaseAdapter`, a implementação compartilhada `KnexDatabaseAdapter`, o adaptador SQLite com `better-sqlite3` e a `DatabaseFactory`. Manter o Knex e as credenciais exclusivamente no processo principal.
   - Criar migrações versionadas, índices e restrições necessários; implementar teste de conexão e operações tipadas de persistência. Deixar particularidades de outros drivers em adaptadores próprios.
   - **Conclusão:** banco novo pode ser criado pelas migrações, operações essenciais funcionam via contrato do adaptador e testes cobrem conexão, consulta e transação sem acesso SQL pela interface.

4. **Leitura, normalização e validação de planilhas**
   - Implementar serviços independentes para ler `.xlsx`, `.xls` e `.csv`, normalizar cabeçalhos e valores conforme os formatos confirmados e validar linhas sem gravar dados.
   - Produzir um resultado tipado com linhas válidas, problemas localizados por linha/campo e contagens. Revalidar dados recebidos no processo principal/IPC; validação na interface não é uma fronteira de confiança.
   - **Conclusão:** testes cobrem arquivos válidos, formatos inválidos, campos ausentes, valores malformados e cabeçalhos alternativos conhecidos; nenhuma linha é descartada sem aparecer no relatório.

5. **Importação das bases de apoio**
   - Implementar seleção/arrastar e soltar, pré-validação e resumo antes de confirmar a gravação de cada base. Aplicar as regras aprovadas para substituição, atualização ou inclusão.
   - Persistir cada operação de forma transacional e registrar arquivo, tipo, data, resultado e contagens, sem guardar o conteúdo sensível do arquivo no log.
   - **Conclusão:** a pessoa usuária consegue importar uma base, revisar o resultado e identificar erros; falhas de banco não deixam substituições ou gravações parciais.

6. **Importação e processamento da demanda mensal**
   - Solicitar o período de referência, validar o arquivo de demanda e apresentar prévia/resumo antes do processamento.
   - Aplicar as regras aprovadas de associação às bases de apoio, duplicidade e reprocessamento do mesmo período. Gravar os registros e o histórico do lote na mesma transação sempre que possível.
   - **Conclusão:** demanda salva fica ligada ao período e ao lote de origem; sucesso só é informado após commit, e falhas/validações reportam claramente o que não foi salvo.

7. **Consulta, saúde do sistema e configurações**
   - Implementar em Tabelas a consulta e manutenção permitidas para bases de apoio, períodos e importações, respeitando as permissões e regras de domínio.
   - Implementar Saúde do sistema com estado da conexão, versão/esquema do banco e operações recentes, sem exibir conteúdo sensível. Manter Configurações para opções de banco e aparência necessárias ao produto.
   - **Conclusão:** páginas refletem dados reais, erros de conexão são visíveis e nenhuma funcionalidade oferece acesso direto ao banco pelo renderer.

8. **Verificação integrada e documentação**
   - Testar o percurso completo: banco vazio, migrações, importação das bases, validação e gravação de demanda, reimportação conforme regra aprovada e recuperação após erro.
   - Executar lint, verificação de tipos, testes e build definidos pelo repositório; documentar formatos aceitos, regras de importação e recuperação/backup.
   - **Conclusão:** fluxo validado de ponta a ponta, sem dados fictícios, com resultados de testes registrados e instruções de operação atualizadas.

## Código e validação

- Seguir as convenções, formatação, tipos e padrões já presentes no repositório; preferir funções e tipos explícitos a coerções ou valores genéricos.
- Manter a interface e as mensagens em português do Brasil, inclusive formatos de data e números quando aplicável.
- Cobrir com testes a validação e normalização das planilhas, casos inválidos, duplicidades conforme a regra aprovada e persistência do lote.
- Executar os comandos de lint, verificação de tipos, testes e build que estiverem definidos no `package.json`. Não inventar comandos ausentes; registrar claramente qualquer validação que não possa ser executada.
- Atualizar a documentação do fluxo de importação quando uma mudança alterar seu comportamento.

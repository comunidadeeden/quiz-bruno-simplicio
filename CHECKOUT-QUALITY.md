# Qualidade dos cliques — 01/10/2026

As seis paginas carregam um observador adicional. Ele nao altera navegacao, conteudo, GTM ou Pixel e nunca envia checkout_click. Usa a sessao nativa e registra somente evidencia cta_click com quality_evidence_only=true e cta_index=0, fora do engajamento por botao.

isTrusted, visibilidade e webdriver sao sinais declarados pelo navegador, nao prova de humanidade. O coletor preserva somente booleanos, identifica User-Agent explicitamente automatizado sem salvar UA/IP e nao aceita bot score enviado pelo cliente. Redes, paises e idiomas nunca sao motivo de exclusao.

Evidencia de quiz exige sessao existente e herda a tag do quiz no banco. Evidencia de pagina herda a tag do page_view original. Idempotencia por event_id e test_mode permanecem. O sincronizador existente repassa as propriedades ao Dash; eventos de teste nao sao sincronizados.

O Dash separa bruto, suspeito e apos filtro. Sem sinais de interacao, a sessao permanece sem verificacao. Nao confirma carregamento da Hotmart. Vendas sao independentes e nunca removidas por essa classificacao.

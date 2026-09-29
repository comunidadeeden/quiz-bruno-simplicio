# Meu Raio X 01

Quiz de observação visual em /meuraiox01/. Criado como variação de venda; não é o exercício de aquecimento.

## Conteúdo e referências
- Referências de corpo: inspiradas apenas nas proporções visíveis das páginas 10, 17, 25, 31 e 37 de slide 2 .pdf. Prancha ilustrada gerada para a interface; não é reprodução exata do material nem instrumento validado.
- Contornos dos olhos: diagramas neutros de curva inferior, linha lateral e curva com pequenas linhas. Os desenhos esquemáticos da página 3 de slide 3.pdf não especificam coordenadas anatômicas suficientes para uma reprodução clínica. Não apresentar esta interface como validação desses sinais.
- Direita/esquerda sempre se referem à própria pessoa, com orientação sobre câmera espelhada.
- Resultados resumem apenas comparações informadas. Nenhuma característica visual é convertida em personalidade, trauma, abuso, narcisismo, estado emocional ou história parental.
- Interpretações psicológicas do prompt não foram implementadas. Não adicionar pontuação de personalidade a BODY_REFERENCES/FACE_FEATURES.

## Estrutura
- index.html: sem cabeçalho de marca, link de reinício ou botão de volta ao início no topo.
- meuraiox01.css: botões azuis; links de compra verdes; cartões responsivos.
- meuraiox01.js: fluxo, escolhas, mapa, checkout, integração de leads e eventos de funil.
- assets/body-atlas.png: 5 colunas e 2 linhas (masculinas/femininas), exibidas por posições CSS.
- FACE_FEATURES é a lista modular de observações: o fluxo e o resumo crescem automaticamente. O esquema de captura deve acompanhar novas entradas.

## Integrações
- Checkout e vídeo da versão atual de venda, com UTMs preservadas.
- Captura temporariamente desativada: a versão pública não solicita nome/telefone e não envia respostas. Aba exclusiva preparada: Leads Meu Raio X 01 (gid 23092501) na planilha de vendas. O exercício de aquecimento mantém sua planilha separada.
- Nenhuma foto é solicitada, recebida ou armazenada. As escolhas físicas e o contato não são enviados como parâmetros dos eventos Meta/VK.
- Coletor independente preparado em apps-script/meuraiox01-leads.gs: destino fixo, trava contra gravações simultâneas, atualização por submission_id, proteção contra eventos atrasados e fórmulas. Criação/publicação do novo projeto depende da autorização explícita solicitada ao usuário. Nenhum coletor antigo foi alterado.
- ?test_mode=1 desliga pixels, vídeo remoto e gravações; mantém o fluxo e o checkout inspecionável.
- workshopDateText usa o mesmo padrão das outras variantes para a atualização semanal.

## Verificação e pendências
- 3.250 combinações de resultados verificadas; fluxo no celular e desktop, volta na escolha do lado, validação de contato e checkout testados.
- Um teste no coletor legado revelou mistura de envios concorrentes na linha 76524. Removidos apenas os campos pertencentes ao teste; dados reais preservados. O novo quiz deixou de usar esse coletor.
- O VK converte UTMs em sck no checkout Hotmart. Origem e campanha conferidas na URL resultante.
- Integração exclusiva ainda não publicada: revisão automática bloqueou tanto alteração de projeto compartilhado quanto criação de novo projeto sem consentimento explícito. Pergunta enviada ao usuário.

## Ajustes visuais de 26/09/2026
- Abertura com trecho azul, chamada em fundo vermelho e scanner igual ao Raio X 01; tags removidas.
- Homem/Mulher escolhe a série de fotos; códigos TE, TO, TP, TM, TR identificam as referências corporais.
- Ilustrações revisadas em assets/body-atlas-v2.png. Edição pelo image_gen integrado: manter grade 5x2, pose e paleta; aumentar diferenças de silhueta; terceiro corpo com ombros largos, quadril e pernas mais estreitos; quarto mais compacto. Não associar essas proporções a diagnóstico ou personalidade.
- Fotos originais fornecidas pelo usuário copiadas como volume/sulco/expressao, com variantes homem/mulher. Não foi feita alteração do conteúdo das fotos.
- Diagramas corrigidos para volume inferior, sulco descendente em direção à bochecha, abertura do olho/curva inferior/canto da boca; nenhum sinal determina um acontecimento familiar no resultado.
- Sem voltar/skip: primeira e segunda seleção corporal obrigatórias; apenas sim/não na comparação facial; lado solicitado no sim.
- Referências secundárias centralizadas. Fotos ampliáveis e ícones de lateralidade nas opções.
- Retirados aviso final e bloco azul solicitado; oferta direta para aprofundar no workshop.
- Resultado de personalidade/história familiar por aparência não implementado. Pergunta sobre inclusão de três perguntas de autorrelato enviada; aguarda escolha do usuário. Não acrescentar as perguntas silenciosamente.

- Publicação verificada: dpl_5gLUW4qfnYHpfctm93XphJPieULq; JS v5, CSS v3. Fluxos masculino/feminino, sim/não, escolha dos lados, ampliação, centralização e remoção dos textos conferidos em navegador; 3.250 combinações do resumo e UTMs verificadas.

## Telas fixas de 26/09/2026
- Estrutura em 100dvh, com conteúdo flexível e ações fora da área de conteúdo. As telas comuns cabem sem rolagem; overflow interno permanece como fallback para zoom e janelas muito baixas.
- Grade corporal móvel em duas linhas (3+2); segunda seleção 2x2. Atlas v2 exibido por SVG com proporções preservadas.
- Resultado separado em quatro telas: corpo, rosto, workshop e vídeo. Botão verde disponível em todas, com avanço sem botão de voltar.
- Player retrato ajustado ao espaço disponível, incluindo sobreposições do próprio vídeo.
- Captura continua desativada; respostas, UTMs, preço e data preservados.
- JS v7 / CSS v5. Testes de fluxo masculino/feminino e medidas de layout em 320x568, 375x667, 390x844 e 1280x720.
- Publicado e conferido em produção: dpl_2nzyd7K2XFR8w8dXHkwW5hCYk1ay. HTML, JS e CSS publicados idênticos aos arquivos testados; abertura conferida no domínio público.

## Oferta em uma tela — 26/09/2026
- Oferta e vídeo reunidos no resultado 3 de 3. Removidos a chamada “Assista ao vídeo” e o avanço extra para o player.
- Tópicos acima do vídeo: traços de caráter do método; traumas e impactos nas relações; comportamentos narcisistas e sinais de alerta. Não foi adicionada promessa de inferência de trauma/narcisismo pela aparência.
- Um único CTA verde abaixo do vídeo, dentro do conteúdo, sem barra de ações fixa na última tela.
- Layout verificado em 320x568, 375x667, 390x844 e 1280x720; sem overflow nesses tamanhos; UTMs preservadas.
- JS v8 / CSS v6.
- Publicação conferida: dpl_FmFtsGB2GCyyPHytxa6NxRRaLssn. HTML/JS/CSS idênticos aos testados; último passo conferido no domínio público.

## Descrições dos cartões — 26/09/2026
- Características físicas adaptadas dos cinco prints fornecidos, na ordem TE, TO, TP, TM e TR. Textos compactos nas duas seleções corporais e resumo consistente no resultado.
- TE: cabeça/testa maiores, corpo magro, juntas marcadas, barriga localizada. TO: cabeça/bochechas redondas, corpo rechonchudo e contornos suaves. TP: queixo pontudo, tronco largo em triângulo invertido e tornozelos finos. TM: corpo em blocos, quadrado/retangular, tornozelos grossos. TR: corpo formoso, rosto harmônico e curvas acentuadas.
- Mantidas as ilustrações; nenhum atributo psicológico/sexual foi deduzido das proporções. Metáforas do material resumidas em características físicas observáveis.
- Em telas até 380x600, o texto auxiliar da seleção corporal cede espaço aos cartões; título e instrução de toque permanecem.
- Conferidos os caminhos masculino e feminino, a segunda escolha, resumo e ausência de overflow em 320x568, 375x667, 390x844 e 1280x720. JS v9 / CSS v7.
- Publicação conferida: dpl_8vMSvAjcsEhcWCb82yeDLXbBsdUg. Ordem TE/TO/TP/TM/TR e textos validados no domínio público; HTML/JS/CSS idênticos aos arquivos locais.

## Uma escolha e resultado contínuo — 26/09/2026
- Removida a segunda escolha de corpo: seis etapas sem captura (referências, corpo, preparo e três comparações faciais).
- Perguntas continuam no viewport; ao concluir, html.result-open libera a rolagem do documento. Resultado corporal, oferta e vídeo compõem a mesma página, com apenas um CTA abaixo do vídeo.
- Removidos a paginação do resultado e o resumo visual de pontos/lados faciais. Nenhuma correspondência entre aparência e personalidade, trauma ou vivências parentais foi implementada.
- Características para textos dos perfis ainda não enviadas. Resultado mantém a descrição física da única referência escolhida.
- Campo legado de corpo complementar fica vazio no payload; captura continua desativada.
- Conferidos escolha única, avanço direto para preparo, sim/lado direito e não, caminhos masculino/feminino, resultado contínuo no celular/desktop, vídeo e UTM no checkout. JS v10 / CSS v8.
- Publicação conferida: dpl_wfi6cjkJTfo8zYUAx3u4PnpjMJwR. Arquivos idênticos aos testados; uma escolha e resultado/oferta contínuos confirmados no domínio público.

## Perfis e temas de estudo — 26/09/2026
- Textos educativos aprovados para TE, TO, TP, TM e TR, adaptados dos cinco prints de características. A referência corporal escolhida abre a descrição desse perfil no material, em terceira pessoa, sem classificar a personalidade do participante.
- Seção geral de estudo sobre peso, ausência e manipulação com perguntas sobre relatos de responsabilidades, apoio e controle nas relações. Os três temas aparecem para todos, independentemente das escolhas visuais e dos lados do rosto; não há inferência de vivências maternas/paternas por aparência.
- Mantidos uma seleção corporal, seis etapas, perguntas sem rolagem em telas comuns e resultado/oferta/vídeo juntos com rolagem. Um único botão de compra abaixo do vídeo. Captura continua desativada.
- JS v11 / CSS v9. Sintaxe verificada; caminhos feminino/TE/não e masculino/TP/sim com todos os lados conferidos em navegador. Telas móveis de 320x568 e 390x844 sem overflow horizontal; UTMs preservadas no checkout.
- Publicação conferida: dpl_Mi6YkUtNiZQPf7p3vLYmmcVnaxM2. HTML/JS/CSS idênticos aos arquivos validados; perfil TR e temas gerais conferidos no domínio público. Resultado com rolagem, sem overflow horizontal e com um único CTA abaixo do vídeo.

## Respostas declaradas e orientação dos lados — 26/09/2026
- Esclarecido no preparo e na pergunta de lateralidade que os lados são os do próprio respondente, independentemente da posição na imagem ou do espelhamento da selfie.
- Acrescentada a opção “Não consigo identificar”. Respostas da sessão estruturadas com marca (ID da referência visual), presente (true/false/null), lado_usuario, status (declarado/inconclusivo) e origem (resposta_usuario).
- Não/inconclusivo mantêm lado nulo; inconclusivo não é convertido em não. Os dados ficam na memória da sessão; nenhuma captura, persistência ou integração foi ativada.
- Não implementada classificação individual de história familiar a partir das características físicas declaradas. Seção educativa geral preservada.
- JS v12. Sintaxe e casos sim/direito/esquerdo/ambos, não e inconclusivo validados; fluxo com respostas mistas e layout 320x568 conferidos em navegador.
- Publicado e conferido: dpl_HKSMVLF3RHhjf4MKS1ixHdMrLUwY. HTML/JS publicados idênticos aos arquivos testados; três opções de resposta conferidas no domínio público.

## Consulta à nomenclatura didática — 26/09/2026
- A pedido do usuário, substituída a seção geral por consulta explícita à nomenclatura do material, com a atribuição “Você selecionou uma característica que, no material do treinamento, é apresentada como…”. Não é apresentada como descoberta de trauma ou história familiar do participante.
- Glossário centralizado: curva/peso, lateral/ausência e linhas/manipulação; direito do próprio respondente consulta o termo paterno, esquerdo o materno, ambos os dois. As nove correspondências foram fornecidas pelo usuário.
- Respostas brutas da sessão preservam referencia_visual, marca, presente, lado_usuario, status e origem. Referências educativas são derivadas separadamente, com referencia_metodo, codigo_material e nomenclatura_material. Não há novo envio ou persistência.
- Não/inconclusivo não recebem termos maternos/paternos; aparecem como registros de comparação distintos. A contagem é de referências selecionadas (0–3), não de termos ou experiências.
- Explicação visível: “A presença visual isolada não comprova que determinada experiência ocorreu.” Ponte comercial em primeira pessoa: “E isso é só o começo”, com aprofundamento e perguntas no workshop.
- JS v13 / CSS v10. Sintaxe, nove correspondências, tratamento de não/inconclusivo/sem lado, contagem de ambos e captura desativada verificados. Fluxo e oferta mantidos na mesma página; botão verde único e UTMs preservados.
- Publicação conferida: dpl_12SSeyjHapxu9rUMnSjNC28WZ99H. HTML/JS/CSS idênticos aos arquivos testados; caso sem referências selecionadas validado no domínio público, sem termos maternos/paternos atribuídos. Layout móvel e desktop, contexto visível e CTA único conferidos.

## Resultado resumido em tópicos — 26/09/2026
- Removidos os rótulos repetidos “Nomenclatura no material”, explicações individuais e parágrafo final destacado nos prints.
- Frase única de abertura atribui os termos ao material do treinamento. Lista compacta exibe apenas os conceitos correspondentes às referências selecionadas, sem subtítulos por item.
- Não/inconclusivo permanecem distintos nos dados e não acrescentam tópicos. Sem seleções, mensagem neutra sem lista vazia. Referências de ambos os lados geram dois itens.
- JS v14 / CSS v11. Sintaxe e apresentação móvel conferidas; correspondências, dados da sessão, oferta, rolagem e checkout preservados.
- Publicação conferida: dpl_CdqdjSn1JrE8pMEr1v2mw7oQfyAC. HTML/JS/CSS idênticos aos arquivos testados; lista com ambos os lados e exclusão de não/inconclusivo conferidas. Layout móvel e desktop sem overflow horizontal.

## Uma frase antes dos tópicos — 26/09/2026
- Retirados o eyebrow “Conceitos do material didático”, título em duas linhas e parágrafo introdutório separados. Frase única: “Pelas suas seleções, os conceitos do método são:”.
- Cabeçalho menor, alinhado à esquerda; espaçamento da seção reduzido. Lista, correspondências e oferta preservadas.
- JS v15 / CSS v12. Sintaxe e resultado móvel conferidos. Em 390x844, no mesmo caminho TE/três seleções, o início do vídeo passou de 1319px para 1183px, aproximadamente 136px mais acima; sem overflow horizontal e com um único CTA.
- Publicação conferida: dpl_7Ram6Gt97t62HfS6qk94oqXBpqXP. HTML/JS/CSS idênticos aos validados; frase única em 16px, remoção dos textos anteriores e lista conferidas no domínio público com cache renovado.

## Título e continuação para o workshop — 26/09/2026
- Título “Seu Raio-X”, com Raio-X azul; removida a tag superior e atualizado o subtítulo para “Suas seleções, organizadas pelos conceitos do método Raio-X.”
- Frase antes dos tópicos: “Com base no que você selecionou, estes são os pontos para aprofundar no método:”.
- Seta dupla animada e link “Continue abaixo” antes da oferta. Âncora leva ao título do workshop, com foco e rolagem suave; preferência por movimento reduzido respeitada pela regra global existente.
- JS v16 / CSS v13. Sintaxe e layout móvel conferidos; cor azul, ausência da tag, animação e clique da âncora validados.
- Publicação conferida: dpl_7M9B8YQVXZzNQDwozEpsPvuYrurU. HTML/JS/CSS públicos idênticos aos arquivos testados; âncora levou ao workshop com foco no título. Celular e desktop sem overflow horizontal.

## Oferta com tag e datas em azul — 26/09/2026
- “Isso é só o começo.” em uma linha, com tamanho responsivo. Workshop em tag arredondada; card de datas com fundo azul e texto branco.
- Subtítulo em primeira pessoa sobre aprofundamento em dois dias; tópicos sobre traços do método, experiências maternas/paternas relatadas e comportamentos narcisistas nas relações. Não adicionadas promessas de inferir traumas ou narcisismo pela aparência.
- JS v17 / CSS v14. Sintaxe verificada; título de uma linha e ausência de overflow confirmados em 320x568. Data, horário, vídeo e checkout preservados.
- Publicação conferida: dpl_G2yuoudXMrBjd6RUhALPneXVB4mn. HTML/JS/CSS idênticos aos arquivos validados; título em uma linha e layout sem overflow no celular e desktop.

## Tag azul-clara no título dos conceitos — 26/09/2026
- Título: “No método, os pontos do rosto que você selecionou correspondem a:”, sobre fundo azul-claro e borda arredondada.
- JS v18 / CSS v15. Sintaxe e visual móvel conferidos, sem overflow horizontal.
- Publicação verificada: dpl_4hneGhQ6Nrsh391PeZFM5K9JoBym; HTML/JS/CSS públicos idênticos aos arquivos validados.

# Prompt para publicar no GitHub e Vercel

Copie e use este prompt ao configurar o repositório/deploy:

> Publique a pasta `raiox01/` como uma página estática acessível em `https://quiz.brunosimplicio.com.br/raiox01/`. Preserve exatamente os arquivos `index.html`, `raiox01.js`, `rx-core.js`, `raiox01.css` e `raio-x-hero-wide.webp`. Não adicione Meta Pixel, `fbq`, Google Apps Script ou outro webhook no HTML/JS. O único container de tags é `GTM-MZBZ9HCS`. O único endpoint de coleta é `https://primary-production-ba57.up.railway.app/webhook/raiox01-coleta-v2`. Mantenha os parâmetros de URL completos na navegação e no checkout: UTMs, `fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `vk_source`, `vk_ad_id`, IDs e nomes de campanha/conjunto/anúncio/criativo da Meta. Não reescreva `/raiox01/` para a raiz. Depois do deploy, teste com `?rx_test=1&utm_source=qa&vk_source=paid_metaads&vk_ad_id=998877` e confirme no n8n que há `page_view`, `quiz_start`, `lead_submit`, `quiz_step_complete`, `quiz_complete` e `rx_checkout_click`.

## Estrutura no repositório

Envie esta pasta para a raiz do projeto com este caminho:

```text
raiox01/
  index.html
  raiox01.js
  rx-core.js
  raiox01.css
  raio-x-hero-wide.webp
```

O domínio deve apontar para o deploy e servir a pasta no caminho `/raiox01/`.

## GTM

No container `GTM-MZBZ9HCS`, importe `GTM-MZBZ9HCS_RAIOX01_NOVO_DOMINIO.json` usando **Combinar**. Em seguida publique a versão.

## Validação após deploy

1. Abra `https://quiz.brunosimplicio.com.br/raiox01/?rx_test=1&utm_source=qa&vk_source=paid_metaads&vk_ad_id=998877`.
2. Confirme no código-fonte que existe `GTM-MZBZ9HCS` e não existe `fbevents.js` nem `script.google.com`.
3. Faça um cadastro de teste e conclua o quiz.
4. Confirme no n8n e Supabase o status, UTM/VK, etapas e evento final.

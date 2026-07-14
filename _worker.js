// _worker.js — roda ANTES de servir os arquivos do site.
// Cuida só das duas rotas de API que buscam dados do F-Droid
// (contornando o bloqueio de CORS). Tudo que não for essas duas
// rotas passa direto pros arquivos normais do site (env.ASSETS).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/fdroid-search') {
      return buscarApps(url);
    }

    if (url.pathname === '/api/fdroid-package') {
      return buscarPacote(url);
    }

    // Não é rota de API: serve o site normalmente (HTML, CSS, JS, imagens...)
    return env.ASSETS.fetch(request);
  }
};

async function buscarApps(url) {
  try {
    const termo = url.searchParams.get('q') || '';
    const resposta = await fetch(
      `https://search.f-droid.org/api/search_apps?q=${encodeURIComponent(termo)}`
    );

    if (!resposta.ok) {
      return jsonResponse({ apps: [] });
    }

    const dados = await resposta.json();
    return jsonResponse(dados);
  } catch (erro) {
    return jsonResponse({ apps: [], erro: String(erro) });
  }
}

async function buscarPacote(url) {
  const pkg = url.searchParams.get('pkg') || '';
  if (!pkg) {
    return jsonResponse({ erro: 'pacote não informado' }, 400);
  }

  try {
    const resposta = await fetch(`https://f-droid.org/api/v1/packages/${pkg}`);
    if (!resposta.ok) {
      return jsonResponse({ erro: 'não encontrado' });
    }
    const dados = await resposta.json();
    return jsonResponse(dados);
  } catch (erro) {
    return jsonResponse({ erro: String(erro) });
  }
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

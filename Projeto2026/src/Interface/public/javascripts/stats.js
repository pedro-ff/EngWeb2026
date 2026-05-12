/* stats.js — gráficos da página de estatísticas (Chart.js 4.x) */

// ----------------------------------------- Paleta ----------------------------------------- //
function paleta(n, base) {
  const hex = base || '#7a1f2e';
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return Array.from({ length: n }, (_, i) => {
    const f = 0.45 + (i / Math.max(n-1,1)) * 0.55;
    return `rgba(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)},0.85)`;
  });
}

// ----------------------------------------- Defaults globais ----------------------------------------- //
Chart.defaults.font.family = "'Inter','Segoe UI',system-ui,sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#4a4640';

// ----------------------------------------- Fábricas de opções ----------------------------------------- //
function optsH(unidade) {          // barras horizontais
  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.x.toLocaleString('pt-PT')} ${unidade||'registos'}`
        }
      }
    },
    scales: {
      x: { grid: { color:'#ece8e1' }, ticks: { precision:0 } },
      y: { grid: { display:false } }
    }
  };
}

function optsV(unidade, onClick) { // barras verticais
  return {
    responsive: true,
    maintainAspectRatio: false,
    onClick,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toLocaleString('pt-PT')} ${unidade||'registos'}`
        }
      }
    },
    scales: {
      x: { grid: { display:false } },
      y: { grid: { color:'#ece8e1' }, ticks: { precision:0 } }
    }
  };
}

// Helper: cria gráfico num canvas dentro de um .chart-wrap
// O chart-wrap tem altura fixa em CSS/inline; o canvas preenche-o com position:absolute
function criarGrafico(id, tipo, labels, valores, cor, optsExtra) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  return new Chart(canvas, {
    type: tipo,
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: Array.isArray(cor) ? cor : paleta(labels.length, cor),
        hoverBackgroundColor: '#e8a0aa',
        borderRadius: 4
      }]
    },
    options: optsExtra
  });
}

// ----------------------------------------- Distribuição por distrito ----------------------------------------- //
(function() {
  const d = STATS.porDistrito;
  criarGrafico(
    'grafico-distritos', 'bar',
    d.map(x => x.distrito), d.map(x => x.total),
    '#7a1f2e', optsH('registos')
  );
})();

// ----------------------------------------- Top Concelhos ----------------------------------------- //
(function() {
  const d = STATS.topConcelhos;
  criarGrafico(
    'grafico-concelhos', 'bar',
    d.map(x => x.concelho), d.map(x => x.total),
    '#b5495b', optsH('registos')
  );
})();

// ----------------------------------------- Distribuição por século (com drill-down) ----------------------------------------- //
let graficoDrill = null;

(function() {
  const d = STATS.porSeculo;
  const seculos = d.map(x => x.seculo);
  const canvas = document.getElementById('grafico-seculos');
  if (!canvas) return;
  canvas.style.cursor = 'pointer';

  const opsDrill = {
    ...optsV('registos', handleClick),
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toLocaleString('pt-PT')} registos`,
          afterLabel: () => 'Clica para ver por décadas'
        }
      }
    }
  };

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: d.map(x => x.label),
      datasets: [{
        data: d.map(x => x.total),
        backgroundColor: paleta(d.length, '#7a1f2e'),
        hoverBackgroundColor: '#e8a0aa',
        borderRadius: 4
      }]
    },
    options: opsDrill
  });

  async function handleClick(event, elements) {
    if (!elements.length) return;
    const sec = seculos[elements[0].index];
    const label = d[elements[0].index].label;
    await mostrarDrill(sec, label);
  }
})();

async function mostrarDrill(sec, labelSeculo) {
  const wrap = document.getElementById('drill-wrap');
  const titulo = document.getElementById('drill-titulo');
  const canvas = document.getElementById('grafico-decadas');

  wrap.style.display = 'block';
  titulo.textContent = `Décadas — ${labelSeculo}`;

  if (graficoDrill) { graficoDrill.destroy(); graficoDrill = null; }

  let decadas;
  try {
    const r = await fetch(`/stats/seculo/${sec}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    decadas = (await r.json()).decadas;
  } catch(e) {
    titulo.textContent = 'Erro ao carregar dados';
    return;
  }

  graficoDrill = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: decadas.map(d => d.label),
      datasets: [{
        data: decadas.map(d => d.total),
        backgroundColor: paleta(decadas.length, '#5c3317'),
        hoverBackgroundColor: '#e8a0aa',
        borderRadius: 4
      }]
    },
    options: optsV('registos')
  });

  wrap.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

document.getElementById('drill-fechar').addEventListener('click', () => {
  document.getElementById('drill-wrap').style.display = 'none';
  if (graficoDrill) { graficoDrill.destroy(); graficoDrill = null; }
});

// ----------------------------------------- Top Requerentes ----------------------------------------- //
(function() {
  const d = STATS.topRequerentes;
  criarGrafico(
    'grafico-requerentes', 'bar',
    d.map(x => x.nome), d.map(x => x.total),
    '#2e5c3a', optsH('ocorrências')
  );
})();

// ----------------------------------------- Top Apelidos ----------------------------------------- //
(function() {
  const d = STATS.topApelidos;
  criarGrafico(
    'grafico-apelidos', 'bar',
    d.map(x => x.apelido), d.map(x => x.total),
    '#2e3d5c', optsH('ocorrências')
  );
})();
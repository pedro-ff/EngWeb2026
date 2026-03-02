const pug = require('pug');

function renderPug(fileName, data) {
  return pug.renderFile(`./views/${fileName}.pug`, data);
}

exports.examsTablePage = (exames, d) =>
  renderPug('index', {
    list: exames,
    date: d
  });


exports.cartaoAtleta = (exame, d) =>
  renderPug('emd', {
    emd: exame,
    date: d
  });


exports.emdForm = (d, exame = null) =>
  renderPug('form', {
    date: d,
    emd: exame
  });


exports.errorPage = (msg, d) =>
  renderPug('error', {
    message: msg,
    date: d
  });

  exports.emdStatsPage = (stats, d) =>
    renderPug('stats', {
      stats: stats,
      date: d
    });
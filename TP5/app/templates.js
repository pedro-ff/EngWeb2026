const pug = require('pug');

function renderPug(fileName, data) {
  return pug.renderFile(`./views/${fileName}.pug`, data);
}

exports.filmsTablePage = (films, d) =>
  renderPug('index', {
    list: films,
    date: d
  });


exports.filmPage = (filme, d) =>
  renderPug('film', {
    film: filme,
    date: d
  });


exports.actorsTablePage = (actors,d) =>
  renderPug('actorIndex', {
    list : actors,
    date: d
  })


exports.actorPage = (actor,d) =>
  renderPug('actor', {
    actor : actor,
    date : d
  })

exports.genresTablePage = (genres,d) =>
  renderPug('genreIndex',{
    list:genres,
    date : d
  })

exports.genrePage = (genre,d) =>
  renderPug('genre',{
    genre:genre,
    date:d
  })
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
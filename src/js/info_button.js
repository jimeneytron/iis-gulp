const $ = require("jquery");

$('.info_button').click((e) => {
  const child = $(e.currentTarget).children('.info_button__info');
  if ($(child).hasClass('info_button__info-show')) {
    $(child).removeClass('info_button__info-show');
  } else {
    $('.info_button__info').each((_i, item) => {
        $(item).removeClass('info_button__info-show');
    });
    $(child).addClass('info_button__info-show');
  }
});
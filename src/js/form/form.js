const $ = require("jquery");
const InputMask = require('inputmask');
const customSelect = require('custom-select').default;
require('jquery-statebus');
require('jquery-validation');

const STATUS = {
  NeedRegistration: 1,
  NeedPassword: 2,
};

$.validator.addMethod("rusLetters", function(value, element) {
  const reg = new RegExp('^[а-яА-ЯЁё]+$', 'gu');
  return this.optional( element ) || reg.test( value );
}, 'Только русские буквы.');


$(document).ready(function(){
  // state
  const form = $.statebus('form', { 
    state: {
      name: '',
      phone: '',
      isAjax: false,
      personalInfo: true,
      step: 1,
      confirmCode: null,
      securityTry: {},
      secretQuestionList: [],
      userList: null

    },
    action:{
      changeState: function(name, data){
        const result = {};
        result[name] = data;
        return result; 
      }
    }
  });
  //
  $.post('/api/v1/security/hello')
  .then((response) => {
    const token = response.data.sessionList[0].sessionToken;
    $.ajaxSetup({
      data: { source: 'iis', sessionToken: token }
    });
  });

  // mask
  const phoneMask = new InputMask('+7(999)-999-99-99');
  const otpMask = new InputMask('9999');
  phoneMask.mask($('#phone'));
  otpMask.mask($('#confirm_code'));

  // events
  $('#name').on('keyup', (e) => {
    const { value } = e.target;
    form.action.changeState('name', value);
    render(form.state);
  });

  $('#phone').on('keyup', (e) => {
    const { value } = e.target;
    form.action.changeState('phone', value);
    render(form.state);
  });

  $('#personal_info').on('click', (e) => {
    const value = e.target.checked;
    form.action.changeState('personalInfo', value);
    render(form.state);
  });

  $('#confirm_code').on('keyup', (e) => {
    const { value } = e.target;
    form.action.changeState('confirmCode', value);
    render(form.state);
  });

  // render

  const render = (state) => {
    console.log(state);
    // действия на checkbox
    if (!state.personalInfo || state.isAjax) {
      $('.form-sumbit').attr('disabled', true);
      $('.form-link').attr('disabled', true);
    } else {
      $('.form-sumbit').removeAttr('disabled');
      $('.form-link').removeAttr('disabled');
    }
    // steps
    if (state.step === 1) {
      $('.step-registration').hide();
    }
    if (state.step === 2) {
      $('.form-otp').fadeIn();
      $('.step-auth').find('.form-link').remove();
      $('.step-auth').find('.form-personal_info').hide();
      $('.step-auth').find('.form-sumbit').text('Потвердить телефон');
      $('.step-auth').find('#name').attr('disabled', true);
      $('.step-auth').find('#phone').attr('disabled', true);
    }
    if (state.step === 3) {
      $('.step-auth').hide();
      $('.step-registration').show();
      form.state.secretQuestionList.map((item) => {
        $('select').append(`<option value='${item.secretQuestionId}'>${item.question}</option>`)
      });
      customSelect('.form-select select');
    }
  };

  render(form.state);

  // validation

  $('.form').validate({
    // debug: true,
    submitHandler: (e) => {
      if (form.state.step === 1) {
        form.action.changeState('isAjax', true);
        render(form.state);
        $.post('/api/v1/security/login/try', {
          login: form.state.phone,
        })
          .then((response) => {
            form.action.changeState('isAjax', false);
            if (!response.data.errorCode) {
              form.action.changeState('step', 2);
              form.action.changeState('securityTry', response.data.otpList[0]);
            }
            render(form.state);
          });
      }
      if (form.state.step === 2 && form.state.confirmCode.length === 4) {
        form.action.changeState('isAjax', true);
        render(form.state);
        $.post('/api/v1/security/otp/confirm', {
          otpCode: form.state.confirmCode,
          otpToken: form.state.securityTry.otpToken
        })
          .then((response) => {
            form.action.changeState('isAjax', false);
            if (!response.data.errorCode) {
              form.action.changeState('securityTry', response.data.otpList[0]);
              form.action.changeState('secretQuestionList', response.data.secretQuestionList);
              form.action.changeState('userList', response.data.userList[0]);
              form.action.changeState('step', 3);
            }
            render(form.state);
          });
      }
    },
    rules: {
      name: {
        required: true,
        rusLetters: true,
        maxlength: 256
      },
      phone: {
        required: true,
      },
      personal_info: {
        required: true,
      },
      confirm_code: {
        minlength: 4
      }
    },
    messages: {
      name: {
        required: 'Введите Имя'
      },
      phone: {
        required: 'Номер телефона обязателен'
      }
    }
  });
});
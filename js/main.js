var viewer = new Horarios.Viewer();

// Atualizar os dados com o semestre selecionado
$('#semester').on('change', function() {
  $("#content").html('');
  var semesterValue = $('#semester').val();
  viewer.init(semesterValue);
});

$(function(){
    viewer.init($('#semester').val());
});
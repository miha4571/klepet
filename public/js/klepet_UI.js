function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
      
      //slikeee
    dodajSlike(sistemskoSporocilo);

      //videi
      dodajVidee(sistemskoSporocilo);
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    
    //slikeee
    dodajSlike(sporocilo);

    //videi
    dodajVidee(sporocilo);
    
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    
    //slikeee
    dodajSlike(sporocilo.besedilo);

    //videi
    dodajVidee(sporocilo.besedilo);
  });
  
  var timeout;
  socket.on('dregljaj', function () {
    $('#vsebina').jrumble();
    clearTimeout(timeout);
    $('#vsebina').trigger('startRumble');
    timeout = setTimeout(function(){
      $('#vsebina').trigger('stopRumble');
    }, 1500);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $("#poslji-sporocilo").val('/zasebno "' + $(this).text() + '"');
      $('#poslji-sporocilo').focus();
    })
  });

  setInterval(function() {
    console.log("aaa")
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


/*function dodajSlike(vhodnoBesedilo) {
  var naslovi = /(https?:\/\/.*\.(?:png|jpg))/g;
  vhodnoBesedilo = vhodnoBesedilo.replace(naslovi , "<br><img src='$1' width='200px' style='margin-left:20px'  /><br>");
  return vhodnoBesedilo;
}
implementacija smeskov use pokvari, lazje kej drugega na novo
*/

function dodajSlike(vhodnoBesedilo) {
  var povezave = /(https?:\/\/.*?\.(?:png|jpg|gif))/g;
  
  /*var besede = vhodnoBesedilo.split(" ");
  for (var i = 0; i < besede.length; i++) {
    if(besede[i].match(povezave)) {
      $('#sporocila').append("<br><img src='"+ besede[i] +"' width='200px' style='margin-left:20px'  /><br>");
    }
  }*/
  
  // izboljsava!!!, ni potrebno da so povezave locene s presledkom
  var besede;
  var jeLavbic; 
  while ((besede = povezave.exec(vhodnoBesedilo)) != null)
  {
    jeLavbic = besede[0].indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
    if(jeLavbic) {
      continue;
    }
    $('#sporocila').append("<br><img src='"+ besede[0] +"' width='200px' style='margin-left:20px'  /><br>");
  }
}

function dodajVidee(vhodnoBesedilo) {
  var povezave = /(?:https:\/\/www\.youtube\.com\/watch\?v\=)([a-z0-9A-Z]{11})/g;
  
  var besede;
  while ((besede = povezave.exec(vhodnoBesedilo)) != null) {
    console.log(besede[1]);
    $('#sporocila').append("<br><iframe src='https://www.youtube.com/embed/"+ besede[1] +"' width='200px' height='150px' style='margin-left:20px' allowfullscreen></iframe><br>");
  }
}

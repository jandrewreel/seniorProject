//GLOBAL VARIABLE
var displayCount = 0;

function searchFunction(req, res) {
   console.log("Searching for Artist");

   //Getting access token
   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;     
        
   $("#ulResults").empty();

   var song = $("#song").val();
   var searchType = $("#searchType").val();
   var accessToken = access_token;


   $.get("/search", {song:song, accessToken:accessToken, searchType:searchType}, function(data) {
      console.log("Back from the Server with:");
      console.log(data);

      if (searchType === 'album') {
         for (var i = 0; i < data.length; i++) {
         $("#ulResults").append("Album: " + data[i].name + "<br>");
         $("#ulResults").append("Artist: " + data[i].artists[0].name + "<br>");
         //$("#ulResults").append("Released: " + data[i].release_date + "<br>");
         $("#ulResults").append("Tracks: " + data[i].total_tracks + "<br><br>");
         }
      }

      if (searchType === 'artist') {
         $("#ulResults").append("Total Followers: " + data.followers.total);
      }

      if (searchType === 'track') {
         var count = 1;
         for (var i = 0; i < data.length; i++) {
            $("#ulResults").append("Track #" + count + " " + data[i].name + "<br>");
            count++;
         }
      }
   });
};

//Load the Web Application
function start (req, res) {
  
  $("#playlistForm").hide();
  $("#xResults").hide();
  $("#results").hide();

  getPlaylist();
}

//Get User Id
function getUserData(req, res) {

  $("#userResults").empty();

  //Get access token
  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  //Get User Request
  $.get("/user", {access_token:access_token}, function(data) {

    $("#userResults").append("User Id: " + data.id + "<br>");
    $("#user_name").text(data.display_name);
  }); 
};

//Get Playlist Info
function getPlaylist(req, res) {

  //SPA Handling
  $("#playlistResults").empty();
  $("#menuSelect").text("Your Playlist");
  $("#topSongsResults").empty();
  $("#topArtistsResults").empty();
  $("#xResults").hide();
  $("#playerInfo").hide();
  $("#playlistForm").hide();
  $("#playlistEdits").show();
  $("#playlistEditElements").empty();
  $("#listResults").empty(); 
  $(".createPlaylist").show();
  
  //Get access token
  var params = getHashParams();

  var access_token = params.access_token,
     refresh_token = params.refresh_token,
     error = params.error;

  $.get("/playlist", {access_token:access_token}, function(data) {
         
    var count = 1;
    for (var i = 0; i < data.length; i++) {
         
      $("#listResults").append("<li class=\"playlist\" alt=\"" + data[i].name + "\" id=\"" + 
        data[i].id + "\">" + data[i].name + "</li>");
      $("#playlistEditElements").append("<option value=\"" + data[i].id + "\">" + data[i].name + "</li>");

        count++;
    }

    $(".playlist").click(function(){
            
      $("#topSongsResults").empty();
      $("#xResults").show();
      var x = $(this).attr("id");
      var name = $(this).attr("alt");
      $("#xResults").html("<h3>" + name + " Playlist</h3>");
            
      //Get songs in playlist
      $.get("/playlist_tracks", {access_token:access_token, x:x}, function(data) {
               
        display(data);
            
      });
    });
         

  });

  getUserData();
};



//Get User's Top Songs
function getTopSongs(req, res) {

   $("#menuSelect").text("Your Top Songs");

   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;

   $("#listResults").empty();
   $(".createPlaylist").hide();
   $("#topSongsResults").empty();
   $("#xResults").show();
   $("#xResults").html("<h3>Your Top Songs</h3>");
   $("#topArtistsResults").empty();
   $("#playlistEdits").hide();   

   $.get("/topSongs", {access_token : access_token}, function(data) {   

      var count = 1;
      for (var i = 0; i < data.length; i++) {
            
         $("#listResults").append("<li class=\"li_track\" id=\"" + 
            data[i].id + "\">" + data[i].name + "</li>");

         count++;
      }

      $(".li_track").click(function(){
            
            $("#topSongsResults").empty();
            $("#xResults").hide();
            var x = $(this).attr("id");

            //playerDisplay(data);
            $.get("/getTrack", {access_token : access_token, x : x}, function(data) {

                //Display Results
                playerDisplay(data);

                //Get songs in playlist
                $.get("/recommendations", {access_token : access_token, x : x}, function(data) {

                  display(data);
               
                }); 
            });
      });

      display(data);

   });
};

//Get User's Top Artist
function getTopArtists(req, res) {

   $("#menuSelect").text("Your Top Artists");

   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;

   $("#listResults").empty();
   $(".createPlaylist").hide();
   $("#topSongsResults").empty();
   $("#topArtistsResults").empty();
   $("xResults").hide();
   $("#playlistEdits").hide();
   $("#playerInfo").hide();
   $("#playlistForm").hide();
   

   $.get("/topArtists", {access_token : access_token}, function(data) {   

      var count = 1;
      for (var i = 0; i < data.length; i++) {
            
         $("#listResults").append("<li class=\"li_track\" id=\"" + 
            data[i].id + "\">" + data[i].name + "</li>");

         count++;
      }

      $(".li_track").click(function(){
            
            $("#topArtistsResults").empty();
            $("#xResults").show();
            var x = $(this).attr("id");

            //playerDisplay(data);
            $.get("/getArtist", {access_token : access_token, x : x}, function(data) {

                $("#playerInfo").html("<div id=\"currentTrackDisplay\"><img alt=\"" + data.id + 
                  "\"src=\"" + data.images[0].url + "\" height=\"300\" width=\"300\" style=\"float:left; border-radius:50%\">" +
                  "<div id=\"currentTrackText\"><h3 style=\"margin-bottom: 50px\"><b>" + data.name + "</b></h3>" +
                  // "<h4 style=\"margin-bottom: 50px\">" + data.artists[0].name + "</h4>" +
                  "<h4>Followers: " + data.followers.total + "</h4>" +
                  "<h5>Popularity: " + data.popularity + "</h5></div></div>");

                var artistName = data.name;
                $("#results").show();
                $("#xResults").html("<h3><b>" + artistName  + "\'s</b> Related Artists</h3>");
                //$("#xResults").html("<h3>Related Artists</h3>");

                $.get("/relatedArtists", {access_token : access_token, x : x}, function(data) {    
   
                  var count = 1;
                  for (var i = 0; i < data.length; i++) {

                    if (data[i].images[0].url != null) {
                      $("#topArtistsResults").append("<li style=\"float:left margin-bottom: 100px\"><img class=\"li_results\" id = \"" + data[i].id + 
                        "\"src=\"" + data[i].images[0].url + "\" height=\"100\" width=\"100\" style=\"border-radius:50%\">" +
                        "<h4>" + data[i].name + "</h4></li>"); 
                    }
                
                  count++;

                  }
               
                }); 
            });
      });

   });
};


//Post New Playlist
function postPlaylist(req, res) {
 
   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;

   //Final Attempt
   $.get("/user", {access_token : access_token}, function (data) {

      var userId = data.id;

      var playlistName = $("#playlistName").val();
      const x = {name : playlistName};

      $.get("/createPlaylist", {access_token : access_token, userId : userId, x : x}, function(data){

            getPlaylist();

      });
   });
}


//Rename a Playlist
function renamePlaylist(req, res) {
 
  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  var playlistId = $("#playlistEditElements").val();

  var newName = $("#newName").val();

  $.get("/editPlaylist", {access_token:access_token, playlistId:playlistId, newName:newName}, function(data) {

      getPlaylist();
  });

}


//Unfollow a Playlist
function unfollowPlaylist(req, res) {
 
  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  var playlistId = $("#playlistEditElements").val();

  $.get("/unfollowPlaylist", {access_token:access_token, playlistId:playlistId}, function(data) {

      getPlaylist();
  });

}


//Handle Music Click Function
function playerDisplay(req, res) {

   //$("#playerInfo").empty();
   //$("#playlistFormElements").empty();
   $("#playerInfo").show();
   $("#playlistForm").show();
   $("#playlistEdits").hide();
   //$("#playlistFormElements").show();

   //Song Id
   var data = req;

   //Get Access Token
   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;

  var album_type = "";

  if (data.album.album_type == "album") {
    album_type = "(Album)";
  }
  else {
    album_type = "(Single)";
  }
   
   //Song Information
   $("#playerInfo").html("<div id=\"currentTrackDisplay\"><img alt=\"" + data.id +
    "\"src=\"" + data.album.images[0].url + "\" width=\"300\" style=\"float:left\">" +
    "<div id=\"currentTrackText\"><h3><b>" + data.name + "</b></h3>" +
    "<h4 style=\"margin-bottom: 50px\">" + data.artists[0].name + "</h4>" +
    "<h4>" + data.album.name + "</h4>" +
    "<h5>" + album_type + "</h5></div></div>");

   //Current Track List Recommendations
   $("#topSongsResults").append("<br><br><img id=\"currentTrack\" alt=\"" + data.id + "\" style=\" float:left\" src=\"" 
    + data.album.images[0].url + "\" width=\"100\">" +
    "<h4>" + data.name + "</h4>" +
    "<p>" + data.artists[0].name + "</p>" +
    "<p>" + data.album.name + "</p><br>");
  
   //Get List of Playlist
   $.get("/playlist", {access_token:access_token}, function(data) {
         
      var count = 1;
      for (var i = 0; i < data.length; i++) {
         
         $("#playlistFormElements").append("<option value=\"" + data[i].id + "\">" + data[i].name + "</li>");

         count++;
      }
   });
}

function addTrack(req, res) {

   //Get Playlist Id
   var playlistId = $("#playlistFormElements").val();
   var playlistName = $("#playlistFormElements option:selected").text();

   //Get Song Id
   var trackId = $("#currentTrack").attr("alt");

   //Get Access Token
   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;
   $("#topSongsResults").empty();
   //PUT Request to Server
   $.get("/addTrackItem", {access_token:access_token, playlistId: playlistId, trackId:trackId}, function(data) {
      
      console.log("Track Added!");
      $.get("/playlist_tracks", {access_token:access_token, x:playlistId}, function(data) {
                 
      $("#xResults").html("<h3><b>" + playlistName + " </b>Playlist</h3>");           
      display(data);
      $("#playlistForm").hide();

            
      });
   });  
}

function removeTrack(req, res) {

   //Get Playlist Id
   var playlistId = $("#playlistFormElements").val();

   //Get Song Id
   var trackId = $("#currentTrack").attr("alt");

   //Get Access Token
   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;
   $("#topSongsResults").empty();
   
   //PUT Request to Server
   $.get("/removeTrackItem", {access_token:access_token, playlistId: playlistId, trackId:trackId}, function(data) {
      
      console.log("Track Deleted!");
      $.get("/playlist_tracks", {access_token:access_token, x:playlistId}, function(data) {
                 
      display(data);
      $("#playlistForm").hide();
            
      });
   });  
}

//Display album covers
function display(data) {
   
  displayCount++;
  
  $("#results").show();
   
    var count = 1;
    for (var i = 0; i < data.length; i++) {

      if (data[i].preview_url != null) {
        $("#topSongsResults").append("<img class=\"li_results\" id = \"" + data[i].id + "\" alt = \"" + 
          data[i].preview_url + "\" src=\"" + data[i].album.images[0].url + "\" width=\"100\">"); 
        }
      count++;

    }

    event();
}


//Get the Access Token
function getHashParams() {
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
}

//Handle Events for Music
function event() {

   var params = getHashParams();

   var access_token = params.access_token,
       refresh_token = params.refresh_token,
       error = params.error;

   $(".li_results").on({
            mouseenter: function(){
               //play music
               var x = $(this).attr("alt");
               $("#music").html("<audio id=\"myAudio\"><source src=\"" + x + "\"></audio>");
               var y = document.getElementById("myAudio");
               y.play();
            },
            mouseleave: function(){
               //pause music
               var x = $(this).attr("alt");
               $("#music").html("<audio id=\"myAudio\"><source src=\"" + x + "\"></audio>");
               var y = document.getElementById("myAudio");
               y.pause();
               
            },
            click: function(){
               
              //calls a get to similar songs/artist
              var x = $(this).attr("id");

              $.get("/getTrack", {access_token : access_token, x : x}, function(data) {

                //Display Results
                playerDisplay(data);

                $.get("/recommendations", {access_token : access_token, x : x}, function(data) {

                  display(data);
                  
                });

              });
               
            }
         });
}


//Sign-Out Function
function signOut() {

   const url = 'https://www.spotify.com/logout/';  

   const spotifyLogoutWindow = window.open(url, 'Spotify Logout', 'width=700,height=500,top=40,left=40');                                                                                               
   setTimeout(() => spotifyLogoutWindow.close(), 2000);
   
   window.location.href = 'http://localhost:5000';
}
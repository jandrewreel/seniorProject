/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fetch = require("node-fetch");

var client_id = '6f83827f0d1c424982ffedc35463f1e2'; // Your client id
var client_secret = '68c8192021ea47e388924790eb89ee0c'; // Your secret
var redirect_uri = 'http://localhost:5000/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  console.log("Request for Log-in");

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private user-top-read playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  console.log("Get the Callback");

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        //res.redirect('home.html');
        res.redirect('/home.html' + '#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//Add Search Function Here
app.get("/search", search);

function search(req, res) {
   console.log("Request for Search");

   //Search Item
   const song = req.query.song;
   console.log('Searching for: ' + song);

   var searchType = req.query.searchType;
   console.log('Search Type = ' + searchType);

   var accessToken = req.query.accessToken;
   console.log("Access Token: " + accessToken);

   var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(song) + '&type=' + searchType + '&market=US&limit=20';

   var myOptions = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      mode: 'cors',
      cache: 'default'
    };

    //Search by album
    if (searchType === 'album') {
      fetch(url, myOptions)
      .then(function(response) {
         return response.json();
      })
      .then(json => {

         var a = [];
         var b = [];
         var j = 0;

         for (var i = 0; i < 20; i++) {

            a[i] = json.albums.items[i];

            if (a[i].album_type == 'album' && a[i].artists[0].name == song) {

               b[j] = a[i];
               j++;
               console.log('Album Name: ' + a[i].name);
               console.log('Artist: ' + a[i].artists[0].name);
               console.log('');
            }
         }

         console.log("Update Results");
         console.log('');
         res.json(b);
      });
    }

    //Search by artist
    if (searchType === "artist") {
      fetch(url, myOptions)
      .then(function(response) {
         return response.json();
      })
      .then(json => {
          var artist = json.artists.items[0];

          console.log('Followers: ' + artist.followers.total);

          res.json(artist);
      });
    }

    //Search by track
    if (searchType === 'track') {
      fetch(url, myOptions)
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        var t = [];
        var count = 1;

        for (var i = 0; i < json.tracks.items[0].album.total_tracks; i++) {

          t[i] = json.tracks.items[i];

          console.log("Track #" + count + " " + t[i].name);
          count++;
        }

        res.json(t);

      });
    }

};


//USER ID GETTER
app.get("/user", user);

function user(req, res) {

  console.log("Request for User Data");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  var url = "https://api.spotify.com/v1/me";
  var myOptions = {
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
    };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    var id = json.id;
    var display_name = json.display_name;

    console.log("Id: " + id);
    console.log("Name " + display_name);

    res.json(json);
  
  });
  
};


//GET PLAYLISTS
app.get("/playlist", playlist);

function playlist (req, res) {

  console.log("Request for Playlists");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  var url = "https://api.spotify.com/v1/me/playlists";

  var myOptions = {
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
    };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var n = [];

    for (var i = json.items.length - 1; i >= 0; i--) {
      
      n[i] = json.items[i];
      console.log("json: " + n[i].name);
    }
    
    res.json(n);

  });
}


// GET TOP SONGS
app.get("/topSongs", topSongs);

function topSongs (req, res)  {

  console.log("Request for Top Songs");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  var url = "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=40";

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var a = [];
    var b = [];
    var j = 0;

    for (var i = json.items.length - 1; i >=0; i--) {

      a[i] = json.items[i];

      console.log("Track Name: " + a[i].name);
      console.log("Artist: " + a[i].artists[0].name);
      console.log("ID: " + a[i].id);

    }
  
    res.json(a);
  });
}


// GET TOP ARTISTS
app.get("/topArtists", topArtists);

function topArtists (req, res)  {

  console.log("Request for Top Artists");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  var url = "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=20";

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var a = [];
    var b = [];
    var j = 0;

    for (var i = json.items.length - 1; i >=0; i--) {

      a[i] = json.items[i];

      console.log("Name: " + a[i].name);
      console.log("Followers: " + a[i].followers.total);
      console.log("ID: " + a[i].id);

    }
  
    res.json(a);
  });
}




// GET SONG RECOMMENDATIONS
app.get("/recommendations", getRecommendations);

function getRecommendations (req, res) {

  console.log("Request for song recommendations");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const songId = req.query.x;
  console.log('Song Id: ' + songId);

  var url = "https://api.spotify.com/v1/recommendations?market=US&seed_tracks=" + songId;

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    var c = [];

    for (var i = 0; i < json.tracks.length; i++) {
      c[i] = json.tracks[i];
      console.log("Tracks: " + c[i].name);
    }

    res.json(c);
  });

}


// GET ARTIST RECOMMENDATIONS
app.get("/relatedArtists", relatedArtists);

function relatedArtists (req, res) {

  console.log("Request for related Artists");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const artistId = req.query.x;
  console.log('Artist Id: ' + artistId);

  var url = "https://api.spotify.com/v1/artists/" + artistId + "/related-artists";

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    var c = [];

    for (var i = 0; i < json.artists.length; i++) {
      c[i] = json.artists[i];

      console.log("Name: " + c[i].name);
      console.log("Followers: " + c[i].followers.total);
      console.log("ID: " + c[i].id);
    }

    res.json(c);
  });

}


// GET PLAYLIST TRACKS
app.get('/playlist_tracks', playlist_tracks);

function playlist_tracks(req, res) {

  console.log("Request for playlist tracks");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const playlistId = req.query.x;

  var url = "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks";

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    var t = [];

    for (var i = 0; i < json.items.length; i++) {
      t[i] = json.items[i].track;

      console.log(json.items[i].track.name);

    }
    res.json(t);
  });
}

//CREATE PLAYLIST
app.get('/createPlaylist', createPlaylist);

function createPlaylist(req, res) {
  
  console.log("Request to create playlist");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const user_id = req.query.userId;
  console.log('User Id: ' + user_id);

  const data = req.query.x;
  var url = "https://api.spotify.com/v1/users/" + user_id + "/playlists";

  var myOptions = {
    method: 'POST',
    headers: {
      'Authorization' : 'Bearer ' + access_token,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify(data),
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var name = json.name;

    console.log("Created Playlist: " + name);

    res.json(json);
  });
}


//GET A TRACK
app.get('/getTrack', getTrack);

function getTrack(req, res) {

  console.log("Request for a track");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const id = req.query.x;
  console.log('Track Id: ' + id);

  var url = "https://api.spotify.com/v1/tracks/" + id;

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    
    console.log("Track: " + json.name);
    console.log("Artist: " + json.artists[0].name);
    console.log("Album: " + json.album.name);

    res.json(json);
  });

}


//GET AN ARTITST
app.get('/getArtist', getArtist);

function getArtist(req, res) {

  console.log("Request for an Aritist");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const id = req.query.x;
  console.log('Artist Id: ' + id);

  var url = "https://api.spotify.com/v1/artists/" + id;

  var myOptions = {
    headers:{
      'Authorization' : 'Bearer ' + access_token
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {
    
    console.log("Name: " + json.name);
    console.log("Followers: " + json.followers.total);
    console.log("Id: " + json.id);

    res.json(json);
  });

}


//ADD TRACK TO PLAYLIST
app.get('/addTrackItem', addTrackItem);

function addTrackItem(req, res) {
  
  console.log("Request to add track to playlist");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const playlist_id = req.query.playlistId;
  console.log('Playlist Id: ' + playlist_id);

  const track_id = req.query.trackId;
  console.log('Track Id: ' + track_id);

  const data = req.query.x;
  var url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks?uris=spotify%3Atrack%3A" + track_id;

  var myOptions = {
    method: 'POST',
    headers: {
      'Authorization' : 'Bearer ' + access_token,
      'Content-Type' : 'application/json',
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var snapshot_id = json.snapshot_id;

    console.log("Added Track: " + snapshot_id);

    res.json(json);
  });
}

//Edit Playlist Name
app.get('/editPlaylist', editPlaylist);

function editPlaylist(req, res) {
  
  console.log("Request to change Playlist Name");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const playlist_id = req.query.playlistId;
  console.log('Playlist Id: ' + playlist_id);

  const new_Name = req.query.newName;
  console.log('New Name: ' + new_Name);

  //Convert Track Id to JSON
  const data = {name : new_Name};

  
  var url = "https://api.spotify.com/v1/playlists/" + playlist_id;

  var myOptions = {
    method: 'PUT',
    headers: {
      'Authorization' : 'Bearer ' + access_token,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify(data),
  };

  fetch(url, myOptions)
  .then(function(response) {
    res.end();
  });
}


//UNFOLLOW PLAYLIST
app.get('/unfollowPlaylist', unfollowPlaylist);

function unfollowPlaylist(req, res) {
  
  console.log("Request to unfollow a Playlist");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const playlist_id = req.query.playlistId;
  console.log('Playlist Id: ' + playlist_id);

  
  var url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/followers";

  var myOptions = {
    method: 'DELETE',
    headers: {
      'Authorization' : 'Bearer ' + access_token,
      'Content-Type' : 'application/json',
    },
  };

  fetch(url, myOptions)
  .then(function(response) {
    res.end();
  });
}


//REMOVE TRACK FROM PLAYLIST
app.get('/removeTrackItem', removeTrackItem);

function removeTrackItem(req, res) {
  
  console.log("Request to remove a track from playlist");

  const access_token = req.query.access_token;
  console.log('Access Token: ' + access_token);

  const playlist_id = req.query.playlistId;
  console.log('Playlist Id: ' + playlist_id);

  const track_id = req.query.trackId;
  console.log('Track Id: ' + track_id);

  //Convert Track Id to JSON
  const data = '{"tracks":[' +
  '{"uri":"spotify:track:' + track_id + '\"}]}';

  
  var url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks";

  var myOptions = {
    method: 'DELETE',
    headers: {
      'Authorization' : 'Bearer ' + access_token,
      'Content-Type' : 'application/json',
    },
    body: data,
  };

  fetch(url, myOptions)
  .then(function(response) {
    return response.json();
  })
  .then(json => {

    var snapshot_id = json.snapshot_id;

    console.log("Removed Track: " + snapshot_id);

    res.json(json);
  });
}

console.log('Listening on 5000');
app.listen(5000);

import React, { Component } from 'react';
import './App.css';
import Spotify from 'spotify-web-api-js';
import Chart from './components/Chart.js';
import Item from './components/Item';
import {isBrowser, isMobile} from "react-device-detect";
import getAverageColor from 'get-average-color';

const spotifyWebApi = new Spotify();

const genreKeywords = [
['pop'],
['country'],
['classical', 'soundtrack'],
['bass', 'chillwave', 'future', 'tronic', 'house', 'rave', 'dub', 'dance', 'trap', 'vapor', 'techno', 'edm'],
['indie'],
['rock', 'punk', 'metal', 'grunge'],
['jazz', 'bop', 'swing', 'stride'],
['r&b', 'urban', 'soul', 'funk'],
['hip hop', 'rap'],
]

const mobileChartHeight = 200;
const browserChartHeight = 100;


class App extends Component {

  constructor() {
    super();
    const params = this.getHashParams();
    this.state ={
      month: new Date().toLocaleString('default', { month: 'long' }),
      loggedIn: params.access_token ? true : false,
      timeRange: 'short_term',
      aboutDisplay: 'about',
      containerDisplay: "hidden",
      loginDisplay: "button",
      headerDisplay: "hidden",
      showcaseDisplay: "hidden",
      backgroundColor:  "white",
      chartDisplay: "hidden",
      chartHeight: browserChartHeight,
      userFirstname: "",
      userLastname: "",
      topArtists: {
        names: [],
        ids: [],
        albumImgs: [],
        genres: [],
        colors: []
      },
      topTracks: {
        names: [],
        artist: [],
        ids: [],
        albumImgs: []
      },
      avgBPM: 0,
      topGenres: [],
      initialDataReceived: false,
      chartData: {
        labels: ["Pop", "Country", "Classical", "Electronic", "Indie", "Rock", "Jazz", "R&B/Soul", "Hip-Hop"],
        datasets: [
          {
            label: "Genres",
            fillColor: "rgba(29,185,84,1)",
            backgroundColor: "rgba(29,185,84,0.5)",
            lineTension: 0,
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      chartOptions: {
        maintainAspectRatio: true,
        responsive: true,
        scale: {
          display: true
        },
        labels: {
          fontColor: 'red'
        }
      }
    }
    
    if(params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
      console.log(params.access_token);
    }
    this.changeBackgroundColor = this.changeBackgroundColor.bind(this);


    this.getUserInfo()
    this.getTopArtists()
    this.getTopTracks()
    
    
  }

  getHashParams = () => {
    var hashParams = {};
    console.log(window.location.hash.substring(1));
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
    
  }

  getUserInfo = () => {
    spotifyWebApi.getMe().then(user => {
      var name = user.display_name.split(" ");
      this.setState({
        userFirstname: name[0]
      })
    });
  }

  getTopArtists = () => {
    console.log('getting top artists')
    var name_array = [];
    var id_array = [];
    var albumImg_array = [];
    var genre_array = [];
    var genre_data = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var curr_genre_data = [];
    var color_array = [];
    
    spotifyWebApi.getMyTopArtists({limit: 50, time_range: this.state.timeRange})
      .then((data) => {
        for(var i = 0; i < 25; i++) {
          if(data.items[i] !== undefined) {
            name_array.push(data.items[i].name)
            id_array.push(data.items[i].id)
            albumImg_array.push(data.items[i].images[0].url)
            genre_array.push(data.items[i].genres)
            curr_genre_data = this.genreChartMaker(data.items[i].genres)
            getAverageColor(data.items[i].images[0].url).then(rgb => color_array.push(rgb))
            for(var j = 0; j < 9; j++) {
              //update genre data with new data plus a weight depending on how high up on the top artists list they come from
              if(curr_genre_data[j] !== 0) {
                genre_data[j] += (curr_genre_data[j] + ((25 - i)/4));
              }
            }
          }
          

          //console.log(name_array[i] + " has genres " + curr_genre_data);
        }
        /*
        console.log(name_array);
        genre_array = [].concat.apply([],genre_array);
        console.log(genre_array);
        */
        console.log("genre data = " + genre_data);
        this.setState({
          topArtists: {
            names: name_array,
            ids: id_array,
            albumImgs: albumImg_array,
            topGenres: genre_array,
            colors: color_array
          },
          chartData: {
            datasets: [{
              label: "Genres",
              data: genre_data,
              fillColor: "rgba(255, 102, 255,1)",
              defaultFontSize: 20
            }]
          },
          chartOptions: {
            scale: {
              display: true
            }
          },
          chartDisplay: "chart",
          loginDisplay: "hidden",
          aboutDisplay: "hidden",
          showcaseDisplay: "showcase",
          headerDisplay: "showcase-header"
        })
      })
  }

  getTopTracks = () => {
    console.log('getting top tracks')
    var name_array = [];
    var artist_array = [];
    var id_array = [];
    var albumImg_array = [];
    
    spotifyWebApi.getMyTopTracks({limit: 50, time_range: this.state.timeRange})
      .then((data) => {
        for(var i = 0; i < 50; i++) {
          if(data.items[i] !== undefined) {
            name_array.push(data.items[i].name)
            artist_array.push(data.items[i].artists[0].name)
            id_array.push(data.items[i].id)
            albumImg_array.push(data.items[i].album.images[0].url)
          }
          
        }

        this.setState({
          topTracks: {
            names: name_array,
            artist: artist_array,
            ids: id_array,
            albumImgs: albumImg_array
          },
          initialDataReceived: true
        })

        //get BPM
        /*
        var ids = this.state.topTracks.ids;
        var bpmSum = 0;
        spotifyWebApi.getAudioFeaturesForTracks(id_array)
          .then((data) => {
            for(var i = 0; i < 50; i++) {
              if(data.audio_features[i].tempo != null) {
                bpmSum += data.audio_features[i].tempo
              }
            }
    
            this.setState({
              avgBPM: Math.round((bpmSum / 50)),
              containerDisplay: "container"
            })
          })*/
      })
  }

  genreChartMaker(genres) {
    var genreCheckbox = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < genres.length; i++) {
      //check each genre against the genre keywords. Tick the genreCheckBox if applicable. Once done, update state's genre data
      for(var j = 0; j < 9; j++) {
        if(genreCheckbox[j] !== 1) {
          for(var k = 0; k < genreKeywords[j].length; k++) {
            if(genres[i].indexOf(genreKeywords[j][k]) !== -1) {
              genreCheckbox[j] = 1;
            }
          }
        }
      }
    }
    return genreCheckbox;
  }

  changeTerm(term) {
    console.log('changing term to ' + term)
    this.setState({
      timeRange: term
    })

    this.getTopArtists();
    this.getTopTracks();
  }

  changeBackgroundColor(index) {
    var color = this.state.topArtists.colors[index];
    console.log(color);

    this.setState({
      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`
    });
  }

  render() {
    return (
      <div className="App">
        
        <div className="App-title">{this.state.userFirstname == '' ? 'Your' : this.state.userFirstname + '\'s'} <br/>{this.state.month} <br/>Favourites</div>
          
        <a className={this.state.loginDisplay} href='https://statifyforspotify-backend.herokuapp.com/login'>
          <button className="btn btn-primary">Generate</button>
        </a>
        <div className="content">
          <div className={this.state.showcaseDisplay}>
            <Item itemRank={1}
                  itemImage={this.state.topTracks.albumImgs[0]} 
                  itemName={this.state.topTracks.names[0]}
                  itemSubName={this.state.topTracks.artist[0]} />
            <Item itemRank={2} 
                  itemImage={this.state.topTracks.albumImgs[1]} 
                  itemName={this.state.topTracks.names[1]}
                  itemSubName={this.state.topTracks.artist[1]} />
            <Item itemRank={3} 
                  itemImage={this.state.topTracks.albumImgs[2]} 
                  itemName={this.state.topTracks.names[2]}
                  itemSubName={this.state.topTracks.artist[2]} />
            <Item itemRank={4} 
                  itemImage={this.state.topTracks.albumImgs[3]} 
                  itemName={this.state.topTracks.names[3]}
                  itemSubName={this.state.topTracks.artist[3]} />
            <Item itemRank={5} 
                  itemImage={this.state.topTracks.albumImgs[4]} 
                  itemName={this.state.topTracks.names[4]}
                  itemSubName={this.state.topTracks.artist[4]} />
          </div>
        

        <div className="footer"></div>
        </div>
      </div>
    
    );
  }
}

export default App;

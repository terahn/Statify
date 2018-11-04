import React, { Component } from 'react';
import './App.css';
import Spotify from 'spotify-web-api-js';
import Chart from './components/Chart.js'
import {isBrowser, isMobile} from "react-device-detect";

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
      loggedIn: params.access_token ? true : false,
      timeRange: 'medium_term',
      aboutDisplay: 'about',
      containerDisplay: "hidden",
      loginDisplay: "button",
      headerDisplay: "App-header",
      chartDisplay: "hidden",
      chartHeight: browserChartHeight,
      topArtists: {
        names: [],
        ids: [],
        albumImgs: [],
        genres: []
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

    if(isMobile) {
      console.log('detected mobile device')
      this.setState ={
        chartHeight: mobileChartHeight
      }
    }

    else {
      console.log('detected browser')
    }
    
    if(params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
      console.log(params.access_token);
    }

    
    this.getTopArtists()
    this.getTopTracks()
    
    
  }

  getHashParams() {
    var hashParams = {};
    console.log(window.location.hash.substring(1));
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
    
  }

  getTopArtists() {
    console.log('getting top artists')
    var name_array = [];
    var id_array = [];
    var albumImg_array = [];
    var genre_array = [];
    var genre_data = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var curr_genre_data = [];
    
    spotifyWebApi.getMyTopArtists({limit: 50, time_range: this.state.timeRange})
      .then((data) => {
        for(var i = 0; i < 25; i++) {
          if(data.items[i] !== undefined) {
            name_array.push(data.items[i].name)
            id_array.push(data.items[i].id)
            albumImg_array.push(data.items[i].images[0].url)
            genre_array.push(data.items[i].genres)
            curr_genre_data = this.genreChartMaker(data.items[i].genres)
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
            topGenres: genre_array
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
          aboutDisplay: "hidden"
        })
      })
  }

  getTopTracks() {
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
          })
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

  render() {
    return (
      <div className="App">
        
        
        <div className="App-content">
          <div className="App-title">Statify</div>
          
          <a className= {this.state.loginDisplay} href='https://statifyforspotify-backend.herokuapp.com/login'>
            <button className="login">Generate</button>
          </a>
          <div className= {this.state.aboutDisplay}>View your top songs and artists as well as a visualization of your musical tastes</div>
          <Chart data={this.state.chartData} options={this.state.chartOptions} className={this.state.chartDisplay} chartHeight={this.state.chartHeight}/>
          <div id="artists" className= {this.state.containerDisplay} >
            <p className="cat-title">Top Artists</p>
            <ul>
              <li>{this.state.topArtists.names[0]}</li>
              <li>{this.state.topArtists.names[1]}</li>
              <li>{this.state.topArtists.names[2]}</li>
              <li>{this.state.topArtists.names[3]}</li>
              <li>{this.state.topArtists.names[4]}</li>
              <li>{this.state.topArtists.names[5]}</li>
              <li>{this.state.topArtists.names[6]}</li>
              <li>{this.state.topArtists.names[7]}</li>
              <li>{this.state.topArtists.names[8]}</li>
              <li>{this.state.topArtists.names[9]}</li>
            </ul>
          </div>
          <div id="songs" className={this.state.containerDisplay}>
            <p className="cat-title">Top Songs</p>
            <ul>
              <li>{this.state.topTracks.names[0]} - {this.state.topTracks.artist[0]}</li>
              <li>{this.state.topTracks.names[1]} - {this.state.topTracks.artist[1]}</li>
              <li>{this.state.topTracks.names[2]} - {this.state.topTracks.artist[2]}</li>
              <li>{this.state.topTracks.names[3]} - {this.state.topTracks.artist[3]}</li>
              <li>{this.state.topTracks.names[4]} - {this.state.topTracks.artist[4]}</li>
              <li>{this.state.topTracks.names[5]} - {this.state.topTracks.artist[5]}</li>
              <li>{this.state.topTracks.names[6]} - {this.state.topTracks.artist[6]}</li>
              <li>{this.state.topTracks.names[7]} - {this.state.topTracks.artist[7]}</li>
              <li>{this.state.topTracks.names[8]} - {this.state.topTracks.artist[8]}</li>
              <li>{this.state.topTracks.names[9]} - {this.state.topTracks.artist[9]}</li>
            </ul>
          </div>
          
          </div>
        <div className="footer">
          <div id="footer_contents">
            <a id="link" href="https://github.com/terahn/Statify" target="_blank">
              <svg height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
            </a>
            <a id="link" href="https://www.instagram.com/thehairyson/" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>
        
      </div>
    
    );
  }
}

export default App;

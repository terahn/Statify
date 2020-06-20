import React, { Component } from 'react';
import './App.css';
import Spotify from 'spotify-web-api-js';
import { Graph } from 'react-d3-graph';
import Item from './components/Item';
import Genre from './components/Genre';
import {
  graphConfig,
  graphHeight,
  graphWidth,
} from './components/Graph.config';
import logo from './statify-logo.png';

const spotifyWebApi = new Spotify();

const genreKeywords = [
  ['pop'],
  ['country'],
  ['classical', 'soundtrack'],
  [
    'bass',
    'chillwave',
    'future',
    'tronic',
    'house',
    'rave',
    'dub',
    'dance',
    'trap',
    'vapor',
    'techno',
    'edm',
  ],
  ['indie'],
  ['rock', 'punk', 'metal', 'grunge'],
  ['jazz', 'bop', 'swing', 'stride'],
  ['r&b', 'urban', 'soul', 'funk'],
  ['hip hop', 'rap'],
];

class App extends Component {
  constructor() {
    super();
    const params = this.getHashParams();
    this.state = {
      timeRange: 'medium_term',
      loginDisplay: 'button',
      displayContent: false,
      userFirstname: '',
      topArtists: {
        names: [],
        ids: [],
        albumImgs: [],
        genres: [],
      },
      topTracks: {
        names: [],
        artist: [],
        ids: [],
        albumImgs: [],
      },
      genreData: [],
      genreLabels: [
        'Pop',
        'Country',
        'Classical',
        'Electronic',
        'Indie',
        'Rock',
        'Jazz',
        'R&B/Soul',
        'Hip-Hop',
      ],
      graphData: {
        nodes: [],
        links: [],
      },
      renderGraph: false,
    };

    if (params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
    }
    this.fetchData();
  }

  fetchData = async () => {
    const name = await this.getUserInfo();
    const { topTracks } = await this.getTopTracks();
    const {
      topArtists,
      genreData,
      loginDisplay,
      displayContent,
    } = await this.getTopArtists();
    const graphNodes = await this.buildGraphNodes(topArtists);
    const graphLinks = await this.buildGraphLinks(topArtists);
    this.setState((prevState) => ({
      ...prevState,
      loginDisplay,
      displayContent,
      userFirstname: name[0],
      topArtists,
      topTracks,
      genreData,
      graphData: {
        nodes: graphNodes,
        links: graphLinks,
      },
      renderGraph: true,
    }));
    setTimeout(() => {
      this.removeFalseLinks();
    }, 2000);
  };

  getHashParams = () => {
    const hashParams = {};
    let e;
    const r = /([^&;=]+)=?([^&;]*)/g;
    const q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  };

  getUserInfo = () => {
    return new Promise((resolve, reject) => {
      spotifyWebApi
        .getMe()
        .then((user) => {
          const name = user.display_name.split(' ');
          resolve(name);
          // this.setState({
          //   userFirstname: name[0],
          // });
        })
        .catch((error) => reject(error));
    });
  };

  getTopArtists = () => {
    const nameArray = [];
    const idArray = [];
    const albumImgArray = [];
    const genreArray = [];
    const genreData = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let currGenreData = [];
    const artistLimit = 50;
    const { timeRange } = this.state;

    return new Promise((resolve, reject) => {
      spotifyWebApi
        .getMyTopArtists({
          limit: artistLimit,
          time_range: timeRange,
        })
        .then((data) => {
          for (let i = 0; i < artistLimit; i += 1) {
            if (data.items[i] !== undefined) {
              nameArray.push(data.items[i].name);
              idArray.push(data.items[i].id);
              albumImgArray.push(data.items[i].images[0].url);
              genreArray.push(data.items[i].genres);
              currGenreData = this.genreChartMaker(data.items[i].genres);
              for (let j = 0; j < 9; j += 1) {
                // update genre data with new data plus a weight depending on how high up on the top artists list they come from
                if (currGenreData[j] !== 0) {
                  genreData[j] += currGenreData[j] + (25 - i) / 4;
                }
              }
            }
          }

          resolve({
            topArtists: {
              names: nameArray,
              ids: idArray,
              albumImgs: albumImgArray,
              topGenres: genreArray,
            },
            genreData,
            loginDisplay: 'hidden',
            displayContent: true,
          });
        })
        .catch((error) => reject(error));
    });
  };

  getTopTracks = () => {
    const nameArray = [];
    const artistArray = [];
    const idArray = [];
    const albumImgArray = [];
    const { timeRange } = this.state;
    return new Promise((resolve, reject) => {
      spotifyWebApi
        .getMyTopTracks({ limit: 50, time_range: timeRange })
        .then((data) => {
          for (let i = 0; i < 50; i += 1) {
            if (data.items[i] !== undefined) {
              nameArray.push(data.items[i].name);
              artistArray.push(data.items[i].artists[0].name);
              idArray.push(data.items[i].id);
              albumImgArray.push(data.items[i].album.images[0].url);
            }
          }

          resolve({
            topTracks: {
              names: nameArray,
              artist: artistArray,
              ids: idArray,
              albumImgs: albumImgArray,
            },
          });
        })
        .catch((error) => reject(error));
    });
  };

  genreChartMaker = (genres) => {
    // console.log(genres)
    const genreCheckbox = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < genres.length; i += 1) {
      // check each genre against the genre keywords. Tick the genreCheckBox if applicable. Once done, update state's genre data
      for (let j = 0; j < 9; j += 1) {
        if (genreCheckbox[j] !== 1) {
          for (let k = 0; k < genreKeywords[j].length; k += 1) {
            if (genres[i].indexOf(genreKeywords[j][k]) !== -1) {
              genreCheckbox[j] = 1;
            }
          }
        }
      }
    }
    return genreCheckbox;
  };

  changeTerm = (event) => {
    const term = event.target.value;
    this.setState({
      timeRange: term,
    });

    this.fetchData();
  };

  renderGenreData = () => {
    const { genreData, genreLabels } = this.state;
    const indexed = genreData.map((x, idx) => {
      return { label: genreLabels[idx], val: x };
    });
    indexed.sort((x, y) => {
      return x.val < y.val ? 1 : x.val === y.val ? 0 : -1;
    });
    const top = indexed.slice(0, 5);

    return top.map((x, idx) => {
      return <Genre label={x.label} value={x.val} key={`genre_${x.label}`} />;
    });
  };

  buildGraphNodes = ({ ids, names, albumImgs }) => {
    return new Promise((resolve) => {
      const graphNodes = [];
      ids.forEach((x, index) => {
        graphNodes.push({
          id: names[index],
          svg: albumImgs[index],
          // img: albumImgs[index],
        });
      });

      resolve(graphNodes);
    });
  };

  buildGraphLinks = ({ ids, names }) => {
    return Promise.all(
      ids.map((element) => spotifyWebApi.getArtistRelatedArtists(element))
    )
      .then((data) => {
        let links = [];
        data.forEach((element, srcIdx) => {
          let artistLinks = [];
          element.artists.forEach((x) => {
            const artistIndex = ids.indexOf(x.id);
            // there is a valid link
            if (artistIndex > 0) {
              artistLinks.push({
                source: names[srcIdx],
                target: names[artistIndex],
                linkType: true,
              });
            }
          });

          // add a fake link (temporary hack in order for unlinked nodes to not be bunched up in the top left corner)
          if (artistLinks.length === 0) {
            artistLinks = [
              {
                source: names[srcIdx],
                target: names[Math.floor(Math.random() * names.length)],
                opacity: 0.01,
                linkType: false,
              },
            ];
          }
          links = [...links, ...artistLinks];
        });

        return links;
      })
      .catch((error) => error);
  };

  renderArtistGraph = () => {
    const { renderGraph, graphData } = this.state;
    if (renderGraph) {
      return (
        <div
          className="graph-container"
          style={{ height: graphHeight, width: graphWidth }}
        >
          <Graph
            id="artist_graph"
            data={graphData}
            config={graphConfig}
            onMouseOverNode={this.hoverNode}
          />
        </div>
      );
    }
    return null;
  };

  removeFalseLinks = () => {
    const { graphData } = this.state;
    this.setState({
      graphData: {
        ...graphData,
        links: graphData.links.filter((link) => {
          return link.linkType;
        }),
      },
    });
  };

  renderTopTracks = (n) => {
    const { topTracks } = this.state;
    const renderList = [];
    for (let i = 0; i < n; i += 1) {
      renderList.push(
        <Item
          itemRank={i}
          itemImage={topTracks.albumImgs[i]}
          itemName={topTracks.names[i]}
          itemSubName={topTracks.artist[i]}
          key={`${i}_track`}
        />
      );
    }
    return renderList;
  };

  render() {
    const { userFirstname, displayContent, renderGraph } = this.state;

    return (
      <div className="App">
        <div className={displayContent ? 'hidden' : 'login'}>
          {/* <div className="login-title">Statify</div> */}
          <img className="login-logo" src={logo} alt="statify logo" />
          <div className="login-description">
            Get a grasp of your music taste
          </div>
        </div>
        <div className={displayContent ? 'App-title' : 'hidden'}>
          {userFirstname === '' ? 'Your' : `${userFirstname}'s`}
          <br />
          Favourites
        </div>
        <img
          className={displayContent ? 'content-logo' : 'hidden'}
          src={logo}
          alt="statify logo"
        />

        <a
          className={displayContent ? 'hidden' : 'button'}
          href="http://localhost:8888/login"
        >
          <button type="submit" className="btn btn-primary">
            Generate
          </button>
        </a>
        <div className={displayContent ? 'content' : 'hidden'}>
          <this.renderArtistGraph render={renderGraph} />

          <div className="showcase">
            <div className="App-header">Your Current Favorites</div>
            {displayContent ? this.renderTopTracks(5) : null}
          </div>

          <div className="genre-container">
            <div className="App-header">Your Tastes</div>
            <div className="genre">{this.renderGenreData()}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

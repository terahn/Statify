import React, { Component } from 'react';
import './App.css';
import Spotify from 'spotify-web-api-js';
import { Graph } from 'react-d3-graph';
import {
  Typography,
  Button,
  Card,
  CardHeader,
  CardActions,
  CardActionArea,
  CardMedia,
  IconButton,
  CardContent,
  Collapse,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';
import { InfoOutlined, Refresh } from '@material-ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
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

const cardSlide = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

class App extends Component {
  constructor() {
    super();
    const params = this.getHashParams();
    const hasAccessToken = Object.prototype.hasOwnProperty.call(
      params,
      'access_token'
    );
    this.state = {
      timeRange: 'medium_term',
      displayContent: false,
      hasAccessToken,
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
      selectedNode: '',
      modalOpen: false,
    };

    if (params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
      this.fetchData();
    }
  }

  fetchData = async () => {
    const { renderGraph } = this.state;
    if (renderGraph) {
      this.setState({
        renderGraph: false,
      });
    }
    const name = await this.getUserInfo();
    const { topTracks } = await this.getTopTracks();
    const {
      topArtists,
      genreData,
      displayContent,
    } = await this.getTopArtists();
    const graphNodes = await this.buildGraphNodes(topArtists);
    const graphLinks = await this.buildGraphLinks(topArtists);
    this.setState((prevState) => ({
      ...prevState,
      displayContent,
      userFirstname: name[0],
      topArtists,
      topTracks,
      genreData,
      graphData: {
        // nodes: this.decorateGraphNodesWithInitialPositioning(graphNodes),
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
    // eslint-disable-next-line no-cond-assign
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
    const { timeRange } = this.state;
    const newValue = event.target.value;
    if (timeRange !== newValue) {
      this.setState({
        timeRange: newValue,
      });

      this.fetchData();
    }
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
          // svg: albumImgs[index],
          img: albumImgs[index],
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

  decorateGraphNodesWithInitialPositioning = (nodes) => {
    return nodes.map((n) => ({
      ...n,
      x: n.x || Math.floor(Math.random() * 1000),
      y: n.y || Math.floor(Math.random() * 1000),
    }));
  };

  onClickNode = (nodeId) => {
    this.setState({
      selectedNode: nodeId,
    });
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
          itemRank={i + 1}
          itemImage={topTracks.albumImgs[i]}
          itemName={topTracks.names[i]}
          itemSubName={topTracks.artist[i]}
          key={`${i}_track`}
        />
      );
    }
    return renderList;
  };

  renderSelectedCard = (nodeId) => {
    const { graphData, topArtists } = this.state;
    try {
      const artistImg = graphData.nodes.find((node) => node.id === nodeId).img;
      const artistId = 'PUT SOMETHING HERE';
      const connections = [];
      graphData.links.forEach((link) => {
        if (link.source === nodeId) {
          connections.push(link.target);
        } else if (link.target === nodeId) {
          connections.push(link.source);
        }
      });
      const uniqueConnections = new Set(connections);
      return (
        <motion.div
          variants={cardSlide}
          initial="initial"
          animate="animate"
          exit="exit"
          className="selected-card"
        >
          <Card>
            <CardMedia
              image={artistImg}
              title="Artist Image"
              className="selected-card-img"
            />
            <CardContent className="content-left">
              <Typography gutterBottom variant="h5" component="h2">
                {nodeId}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                {uniqueConnections.size !== 1
                  ? `${uniqueConnections.size} connections`
                  : '1 connection'}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="primary"
                href={`https://open.spotify.com/artist/${artistId}`}
                target="_blank"
              >
                View On Spotify
              </Button>
              <Button size="small" color="primary">
                View All Related Artists
              </Button>
            </CardActions>
          </Card>
        </motion.div>
      );
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  openModal = () => {
    this.setState({
      modalOpen: true,
    });
  };

  closeModal = () => {
    this.setState({
      modalOpen: false,
    });
  };

  render() {
    const {
      userFirstname,
      displayContent,
      renderGraph,
      selectedNode,
      timeRange,
      graphData,
      hasAccessToken,
      modalOpen,
    } = this.state;

    return (
      <AnimatePresence>
        <div className="App">
          {!displayContent && !hasAccessToken && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="login"
            >
              {/* <div className="login-title">Statify</div> */}
              <img className="login-logo" src={logo} alt="statify logo" />
              <div className="login-description">
                Get a grasp of your music taste
              </div>
              <a
                href="http://localhost:8888/login"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="contained" color="primary">
                  Generate
                </Button>
              </a>
            </motion.div>
          )}
          {displayContent && (
            <motion.div
              animate="animate"
              initial="initial"
              variants={cardSlide}
              className="card"
            >
              <Card>
                <CardHeader
                  className="content-left"
                  title={
                    userFirstname === ''
                      ? 'Your'
                      : `${userFirstname}'s Favourites`
                  }
                />
                <CardActions>
                  <IconButton onClick={this.openModal}>
                    <InfoOutlined />
                  </IconButton>
                  <IconButton onClick={this.fetchData}>
                    <Refresh />
                  </IconButton>
                </CardActions>
                <CardContent className="content-left">
                  <FormControl className="timeRange content-left">
                    <InputLabel>Time Range</InputLabel>
                    <Select value={timeRange} onChange={this.changeTerm}>
                      <MenuItem value="short_term">Short</MenuItem>
                      <MenuItem value="medium_term">Medium</MenuItem>
                      <MenuItem value="long_term">Long</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>

                {/* <div className="genre-container">
            <div className="App-header">Your Tastes</div>
            <div className="genre">{this.renderGenreData()}</div>
          </div> */}
              </Card>
            </motion.div>
          )}
          <Dialog onClose={this.closeModal} open={modalOpen} fullWidth>
            <DialogTitle>About</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Statify allows you to view the connections between your favorite
                artists. All data is pulled from the Spotify API.
                <br />
                <br />
                Controls:
                <ul>
                  <li>
                    Click a node to
                    <b> view more info</b>
                  </li>
                  <li>
                    Click and drag to
                    <b> move around</b>
                  </li>
                  <li>
                    Scroll up to
                    <b> zoom in</b>
                  </li>
                  <li>
                    Scroll down to
                    <b> zoom out</b>
                  </li>
                </ul>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                color="primary"
                href="https://github.com/terahn/Statify"
                target="_blank"
              >
                View on GitHub
              </Button>
            </DialogActions>
          </Dialog>
          {selectedNode !== '' ? this.renderSelectedCard(selectedNode) : null}

          {renderGraph && (
            <Graph
              id="artist_graph"
              data={graphData}
              config={graphConfig}
              onClickNode={this.onClickNode}
            />
          )}
        </div>
      </AnimatePresence>
    );
  }
}

export default App;

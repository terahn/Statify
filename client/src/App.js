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
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
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

const cardSlide = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

const muiTheme = createMuiTheme({
  palette: {
    primary: {
      main: '#1ed760',
    },
  },
});

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
      currentArtists: [],
      topTracks: [],
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
    // const { topTracks } = await this.getTopTracks();
    const { topArtists } = await this.getTopArtists();
    const graphNodes = await this.buildGraphNodes(topArtists);
    const [graphLinks, relatedArtists] = await this.buildGraphLinks(topArtists);
    topArtists.forEach((artist, index) => {
      artist.relatedArtists = relatedArtists[index].artists;
    });
    this.setState((prevState) => ({
      ...prevState,
      displayContent: true,
      userFirstname: name[0],
      currentArtists: topArtists,
      // topTracks,
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
    const artistLimit = 50;
    const { timeRange } = this.state;

    return new Promise((resolve, reject) => {
      spotifyWebApi
        .getMyTopArtists({
          limit: artistLimit,
          time_range: timeRange,
        })
        .then((data) => {
          resolve({
            topArtists: data.items,
          });
        })
        .catch((error) => reject(error));
    });
  };

  getTopTracks = () => {
    const { timeRange } = this.state;
    return new Promise((resolve, reject) => {
      spotifyWebApi
        .getMyTopTracks({ limit: 50, time_range: timeRange })
        .then((data) => {
          resolve({
            topTracks: data.items,
          });
        })
        .catch((error) => reject(error));
    });
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

  buildGraphNodes = (artists) => {
    return new Promise((resolve) => {
      const graphNodes = [];
      artists.forEach((artist) => {
        graphNodes.push({
          id: artist.name,
          img: artist.images[2].url,
        });
      });

      resolve(graphNodes);
    });
  };

  buildGraphLinks = (artists, fakeLinks = true) => {
    return Promise.all(
      artists.map((artist) => spotifyWebApi.getArtistRelatedArtists(artist.id))
    )
      .then((data) => {
        const relatedArtists = data;
        let links = [];
        data.forEach((element, srcIdx) => {
          let artistLinks = [];
          element.artists.forEach((x) => {
            const found = artists.find((artist) => artist.id === x.id);
            // there is a valid link
            if (found) {
              artistLinks.push({
                source: artists[srcIdx].name,
                target: found.name,
                linkType: true,
              });
            }
          });

          // add a fake link (temporary hack in order for unlinked nodes to not be bunched up in the top left corner)
          if (artistLinks.length === 0 && fakeLinks) {
            artistLinks = [
              {
                source: artists[srcIdx].name,
                target:
                  artists[Math.floor(Math.random() * artists.length)].name,
                opacity: 0.01,
                linkType: false,
              },
            ];
          }

          links = [...links, ...artistLinks];
        });

        return [links, relatedArtists];
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
    const { graphData, currentArtists } = this.state;
    try {
      const artist = currentArtists.find((x) => x.name === nodeId);
      const artistUrl = artist.external_urls.spotify;
      const artistImg = artist.images[0].url;
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
                href={artistUrl}
                target="_blank"
              >
                View On Spotify
              </Button>
              {/* <Button
                size="small"
                color="primary"
                onClick={() => this.viewRelatedArtists(artist)}
              >
                View All Related Artists
              </Button> */}
            </CardActions>
          </Card>
        </motion.div>
      );
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  viewRelatedArtists = async (selectedArtist) => {
    const { currentArtists } = this.state;
    const artists = selectedArtist.relatedArtists.concat(currentArtists);
    const graphNodes = await this.buildGraphNodes(artists);
    const [graphLinks, relatedArtists] = await this.buildGraphLinks(
      artists,
      false
    );
    artists.forEach((artist, index) => {
      artist.relatedArtists = relatedArtists[index].artists;
    });
    const filteredLinks = graphLinks.filter(
      (link) =>
        currentArtists.find((artist) => artist.name === link.source) ||
        currentArtists.find((artist) => artist.name === link.target)
    );
    this.setState({
      graphData: {
        nodes: graphNodes,
        links: Array.from(new Set(filteredLinks)),
      },
      currentArtists: artists,
    });
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
              <ThemeProvider theme={muiTheme}>
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
              </ThemeProvider>
              {/* <div className="login-title">Statify</div> */}
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

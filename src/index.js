import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import "./styles.css";

import axios from "axios";
import { Polyline } from "react-leaflet";
import swal from "sweetalert";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      speed: 0.001,
      route_polyline: [],
      travel_ongoing: false,
      startpoint: [],
      endpoint: [],
      viewport: {
        center: [28.6828, 77.3121],
        zoom: 13
      }
    };
  }

  convertPolyLine = (polyline) => {
    const converted_polyline = [];
    for (let i = 0; i < polyline.length; i++) {
      converted_polyline.push([polyline[i][1], polyline[i][0]]);
    }
    // console.log("converted polyline", converted_polyline);
    return converted_polyline;
  };

  getRoute = async () => {
    let url = `https://graphhopper.com/api/1/route?point=${this.state.startpoint[0]}%2C${this.state.startpoint[1]}&point=${this.state.endpoint[0]}%2C${this.state.endpoint[1]}1&vehicle=car&debug=false&locale=en&points_encoded=false&instructions=false&elevation=false&optimize=true&key=9db0a28e-4851-433f-86c7-94b8a695fb18`;

    try {
      const routeresponse = await axios.get(url);
      console.log(routeresponse.data);
      const routeData = this.convertPolyLine(
        routeresponse.data.paths[0].points.coordinates
      );
      console.log(routeData);

      this.setState({ route_polyline: routeData });
    } catch (error) {
      console.error(error);
      swal("Error", "Route error. Invalid end points", "error");
    }
  };

  setStartPoint = () => {
    let locationstring = document.getElementById("startpoint").value;
    if (locationstring === "currentlocation") {
      // set current location as starting point
      let newpoint = this.state.viewport.center;
      console.log("startpoint set: " + newpoint);
      swal("Success", "Start Point set", "success");
      this.setState({ startpoint: newpoint });
      return;
    }

    axios
      .get(
        `https://graphhopper.com/api/1/geocode?q=${locationstring}&locale=de&debug=true&key=9db0a28e-4851-433f-86c7-94b8a695fb18`
      )
      .then((res) => {
        let data = res.data;

        // console.log(data.hits[0].point);
        let newpoint = [data.hits[0].point.lat, data.hits[0].point.lng];
        console.log("startpoint set: " + newpoint);
        swal("Success", "Start Point set", "success");
        this.setState({
          viewport: {
            center: newpoint
          },
          startpoint: newpoint
        });
      })
      .catch((err) => {
        console.error(err);
        swal("Error", "Map error. Invalid start point", "error");
      });
  };

  setEndPoint = () => {
    let locationstring = document.getElementById("endpoint").value;
    axios
      .get(
        `https://graphhopper.com/api/1/geocode?q=${locationstring}&locale=de&debug=true&key=9db0a28e-4851-433f-86c7-94b8a695fb18`
      )
      .then((res) => {
        let data = res.data;

        // console.log(data.hits[0].point);
        let newpoint = [data.hits[0].point.lat, data.hits[0].point.lng];
        console.log("endpoint set: " + newpoint);
        swal("Success", "End Point set", "success");
        this.setState({
          endpoint: newpoint
        });
      })
      .catch((err) => {
        console.error(err);
        swal("Error", "Map error. Invalid end point", "error");
      });
  };

  moveVehicle = (direction = "up") => {
    let newcenter = [
      this.state.viewport.center[0] + this.state.speed,
      this.state.viewport.center[1]
    ];
    if (direction === "up") {
    } else if (direction === "down") {
      newcenter = [
        this.state.viewport.center[0] - this.state.speed,
        this.state.viewport.center[1]
      ];
    } else if (direction === "left") {
      newcenter = [
        this.state.viewport.center[0],
        this.state.viewport.center[1] - this.state.speed
      ];
    } else if (direction === "right") {
      newcenter = [
        this.state.viewport.center[0],
        this.state.viewport.center[1] + this.state.speed
      ];
    }

    this.setState({
      viewport: {
        center: newcenter
      }
    });
  };

  handleZoomChanged = (viewport) => {
    console.log("zoom changed");
    this.setState({
      viewport: { center: this.state.viewport.center, zoom: viewport.zoom }
    });
  };

  startTravel = () => {
    if (this.state.route_polyline.length === 0) {
      swal("Error", "Cannot start travel. Route not set", "warning");
      return;
    }
    this.setState({ travel_ongoing: true });
    this.setState({
      viewport: {
        center: this.state.route_polyline[0]
      }
    });
    swal(
      "Success",
      "Travel Started. You can now move along the route",
      "success"
    );
  };

  endTravel = () => {
    this.setState({
      route_polyline: [],
      travel_ongoing: false
    });
    swal("Success", "Travel Ended", "success");
  };

  render() {
    return (
      <div className="maincontainer">
        <h3>Real World Travel Simulator</h3>
        <div>
          <p>
            Set Starting Point:
            <input type="text" id="startpoint" defaultValue="currentlocation" />
            <button onClick={this.setStartPoint}>Get</button>
          </p>
          <p>
            Set Destination:
            <input type="text" id="endpoint" />
            <button onClick={this.setEndPoint}>Get</button>
          </p>
          <p>
            <button onClick={this.getRoute}>Get route</button>
          </p>
        </div>

        {!this.state.travel_ongoing && (
          <div className="navigation">
            <p>
              Current Speed:
              <input
                type="text"
                defaultValue={0.0005}
                onChange={(e) => {
                  this.setState({ speed: parseFloat(e.target.value) });
                }}
              />
            </p>
            <button
              onClick={() => {
                this.moveVehicle("up");
              }}
            >
              Move Up
            </button>
            <button
              onClick={() => {
                this.moveVehicle("down");
              }}
            >
              Move Down
            </button>
            <button
              onClick={() => {
                this.moveVehicle("left");
              }}
            >
              Move Left
            </button>
            <button
              onClick={() => {
                this.moveVehicle("right");
              }}
            >
              Move Right
            </button>
          </div>
        )}

        <div className="navigation">
          {!this.state.travel_ongoing && (
            <button
              onClick={() => {
                this.startTravel();
              }}
            >
              Start Travel
            </button>
          )}

          {this.state.travel_ongoing && (
            <button
              onClick={() => {
                this.endTravel();
              }}
            >
              End Travel
            </button>
          )}
        </div>

        <Map
          onzoomlevelschange={this.handleZoomChanged}
          viewport={this.state.viewport}
        >
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          <Marker position={this.state.viewport.center}>
            <Popup>Current Location</Popup>
          </Marker>
          {this.state.route_polyline.length > 0 && (
            <Polyline
              pathOptions={{ color: "red", fillColor: "red" }}
              positions={this.state.route_polyline}
            />
          )}
        </Map>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

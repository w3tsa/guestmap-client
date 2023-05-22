import { useEffect, useState, Fragment } from "react";

import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  Card,
  Button,
  CardTitle,
  CardText,
  Form,
  FormGroup,
  Label,
  Input,
  Col,
} from "reactstrap";
import "./App.css";
import iconUrl from "./pin.svg";
import messageIcon from "./messageIcon.svg";

import Joi from "joi";

function App() {
  const [state, setState] = useState({
    location: {
      lat: 51.505,
      lng: -0.09,
    },
  });

  const [allMessages, setAllMessages] = useState([]);

  const [loader, setLoader] = useState({
    sendingMessage: false,
    sentMessage: false,
  });

  const [userLocation, setUserLocation] = useState({
    haveUsersLocation: false,
    zoom: 3,
  });

  const [user, setUser] = useState({
    name: "",
    message: "",
  });

  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api/v1/messages"
      : "https://guestmap-api-production.up.railway.app/api/v1/messages";

  let myIcon = L.icon({
    iconUrl,
    iconSize: [50, 82],
    iconAnchor: [25, 82],
    popupAnchor: [0, -62],
  });
  let userIcon = L.icon({
    iconUrl: messageIcon,
    iconSize: [50, 82],
    iconAnchor: [25, 82],
    popupAnchor: [0, -62],
  });

  const schema = Joi.object().keys({
    name: Joi.string().min(1).max(500).required(),
    message: Joi.string().min(1).max(500).required(),
  });

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((messages) => {
        const haveSeenLocation = {};
        messages = messages.reduce((all, message) => {
          const key = `${message.latitude}${message.longitude}`;
          if (haveSeenLocation[key]) {
            haveSeenLocation[key].otherMessages =
              haveSeenLocation[key].otherMessages || [];
            haveSeenLocation[key].otherMessages.push(message);
          } else {
            haveSeenLocation[key] = message;
            all.push(message);
          }
          return all;
        }, []);

        setAllMessages(messages);
      });
  }, [API_URL]);

  useEffect(() => {
    const successCallback = (position) => {
      setState((prevState) => ({
        ...prevState,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      }));
      setUserLocation((prevLocation) => ({
        ...prevLocation,
        haveUsersLocation: true,
        zoom: 13,
      }));
    };

    const errorCallback = async () => {
      const response = await fetch("https://ipapi.co/json");
      const location = await response.json();
      setState((prevState) => ({
        ...prevState,
        location: {
          lat: location.latitude,
          lng: location.longitude,
        },
      }));
      setUserLocation((prevLocation) => ({
        ...prevLocation,
        haveUsersLocation: true,
        zoom: 13,
      }));
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  }, []);

  const formSubmitted = (e) => {
    e.preventDefault();
    setLoader({ sendingMessage: true });
    const userMessage = {
      name: user.name,
      message: user.message,
    };
    const { error } = schema.validate(userMessage);
    if (!error) {
      fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...userMessage,
          latitude: state.location.lat,
          longitude: state.location.lng,
        }),
      })
        .then((res) => res.json())
        .then((message) => {
          console.log(state.messages);
          setTimeout(() => {
            setLoader({
              sendingMessage: false,
              sentMessage: true,
            });
          }, 4000);
        });
      // window.location.reload();
    } else {
      alert(error);
      setLoader({ sendingMessage: false });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };
  const position = [state.location.lat, state.location.lng];
  return (
    <Fragment>
      <MapContainer
        className="map"
        center={position}
        zoom={userLocation.zoom}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation.haveUsersLocation && (
          <Marker position={position} icon={myIcon}>
            {/* <Popup>
            {allMessages.length > 0 && `${allMessages[allMessages.length - 1].name} : ${allMessages[allMessages.length - 1].message}`}
          </Popup> */}
          </Marker>
        )}

        {allMessages.map((message) => {
          return (
            <Marker
              position={[message.latitude, message.longitude]}
              icon={userIcon}
              key={message._id}
            >
              <Popup>
                <p>
                  <em>{message.name}:</em> {message.message}
                </p>
                {message.otherMessages &&
                  message.otherMessages.map((message) => {
                    return (
                      <p key={message._id}>
                        <em>{message.name}:</em> {message.message}
                      </p>
                    );
                  })}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <Card body className="message-form">
        <CardTitle tag="h5">Welcome to Guest map</CardTitle>
        <CardText>Leave a message with your location!</CardText>
        <CardText>Thanks for stopping by</CardText>

        {!loader.sendingMessage && !loader.sentMessage ? (
          <Form onSubmit={formSubmitted}>
            <FormGroup row>
              <Label for="name" sm={5}>
                Name
              </Label>
              <Col sm={10}>
                <Input
                  onChange={handleChange}
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter your name"
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="message" sm={5}>
                Message
              </Label>
              <Col sm={10}>
                <Input
                  onChange={handleChange}
                  type="textarea"
                  name="message"
                  id="message"
                  placeholder="Enter a message"
                />
              </Col>
            </FormGroup>
            <Button
              color="info"
              type="submit"
              className="button"
              disabled={!userLocation.haveUsersLocation}
            >
              Submit
            </Button>
          </Form>
        ) : loader.sendingMessage ? (
          <video
            autoPlay
            loop
            src="https://media.giphy.com/media/hWSQvXbDDh8rlnoLOt/giphy.mp4"
          ></video>
        ) : (
          <CardText>Thanks for submitting a message</CardText>
        )}
      </Card>
    </Fragment>
  );
}

export default App;

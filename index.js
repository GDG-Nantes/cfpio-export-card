#!/usr/bin/env node

const request = require("request-promise-native");
const tough = require("tough-cookie");
const fs = require("fs");
const getToken = () => process.env.CFP_TOKEN;

const constructCookie = () =>
  // Put cookie in an jar which can be used across multiple requests
  request.jar().setCookie(
    new tough.Cookie({
      key: "token",
      value: getToken(),
      domain: "api.cfp.io",
      httpOnly: true,
      maxAge: 31536000
    }),
    "https://api.cfp.io"
  );

const getData = () => {
  const value = {};

  // Easy creation of the cookie - see tough-cookie docs for details
  const cookie = constructCookie();
  // ...all requests will include the cookie

  const generateHttpCall = endpoint =>
    Object.assign(
      {},
      {
        method: "GET",
        uri: `https://api.cfp.io/v0/${endpoint}`,
        headers: {
          Origin: "https://devfestnantes.cfp.io",
          Referer: "https://devfestnantes.cfp.io/",
          Cookie: `token=${getToken()}`
        },
        jar: cookie, // Tells rp to include cookies in jar that match uri,
        json: true,
        resolveWithFullResponse: false
      }
    );

  return request(generateHttpCall("tracks"))
    .then(data => Object.assign(value, { tracks: data }))
    .then(() => request(generateHttpCall("formats")))
    .then(data => Object.assign(value, { formats: data }))
    .then(() => request(generateHttpCall("admin/sessions")))
    .then(data => {
      console.log(
        `👷 Welcome ! Conf has ${value.tracks.length} tracks and ${value.formats
          .length} formats`
      );
      return Object.assign(value, { sessions: data });
    })
    .catch(err => {
      console.log("💩 AieAieAie!\n", err);
      process.exit();
    });
};

const transform = data => session =>
  Object.assign(session, {
    formatLabel: data.formats.find(({ id }) => id === session.format).name
  });

const start = getData => {
  getData()
    .then(data => {
      console.log(`📢 Format: ${JSON.stringify(data)}`);
      return data;
    })
    .then(data => data.sessions.map(transform(data)) && data)
    .then(data => fs.writeFileSync("./sessions.json", JSON.stringify(data)))
    .catch(err => {
      console.log("💩 AieAieAie!\n", err);
    });
};
if (require.main === module) {
  return start(getData);
}

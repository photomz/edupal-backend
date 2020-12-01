const mixpanel = require("../util/mixpanel/lib/mixpanel-node").init(
  "163ddda22a51cddd2fcce948b3d8406d",
  {
    protocol: "https",
  }
);

/**
 * Teacher action to assign the current meeting to a Class for persistent recording
 * Emits getClass to all students
 * @param {*} data
 * @param {*} socket
 */
const mixpanelHandler = async ({ action, id, properties }, socket) => {
  console.log(socket.ip);
  const props = { ...properties, $ip: socket.ip };
  // eslint-disable-next-line no-param-reassign
  switch (action) {
    case "people":
      mixpanel.people.set(id, props);
      break;
    case "track":
      mixpanel.track(id, props);
      break;
    default:
      break;
  }
  return {
    statusCode: 200,
  };
};

module.exports = mixpanelHandler;
